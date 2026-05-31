import { type NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * GET  /api/v1/ops/alerts  — list open operational alerts for the org.
 * POST /api/v1/ops/alerts  — trigger rule evaluation, fire new alerts.
 *
 * POST is idempotent per (org_id, rule_kind, entity_id) within a
 * 4-hour window — duplicate evaluation runs won't flood the table.
 */

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const severity = url.searchParams.get("severity");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500);

  return withAuth(async (session) => {
    const svc = createServiceClient() as unknown as LooseSupabase;
    let q = svc
      .from("ops_alerts")
      .select(
        "id, rule_kind, severity, title, body, entity_type, entity_id, context, fired_at, acknowledged_at, resolved_at",
      )
      .eq("org_id", session.orgId)
      .is("resolved_at", null)
      .order("fired_at", { ascending: false })
      .limit(limit);

    if (severity) q = q.eq("severity", severity);
    const { data, error } = await q;
    if (error) return apiError("internal", error.message);
    return apiOk({ alerts: data ?? [] });
  });
}

type AlertCandidate = {
  rule_kind: string;
  severity: "info" | "warning" | "critical";
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  context?: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  void req;
  return withAuth(async (session) => {
    const svc = createServiceClient() as unknown as LooseSupabase;
    const now = new Date();
    const dedupeWindow = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    const candidates: AlertCandidate[] = [];

    // ── Rule: budget_overrun ──────────────────────────────────────────────
    // Projects where the sum of approved expenses + time_entry costs
    // exceeds the project budget.
    const { data: overruns } = await svc
      .from("budgets")
      .select("id, project_id, total_amount, spent_amount, project:project_id(name)")
      .eq("org_id", session.orgId)
      .not("spent_amount", "is", null)
      .filter("spent_amount", "gt", "total_amount");

    for (const b of overruns ?? []) {
      const name = (b.project as { name?: string } | null)?.name ?? "Unknown project";
      const overage = ((b.spent_amount as number) - (b.total_amount as number)) / 100;
      candidates.push({
        rule_kind: "budget_overrun",
        severity: "critical",
        title: `Budget overrun: ${name}`,
        body: `Spent exceeds budget by $${overage.toFixed(2)}.`,
        entity_type: "budget",
        entity_id: b.id as string,
        context: { project_id: b.project_id, spent: b.spent_amount, total: b.total_amount },
      });
    }

    // ── Rule: overdue_deliverable ─────────────────────────────────────────
    const { data: overdueDelivs } = await svc
      .from("deliverables")
      .select("id, title, due_at, project:project_id(name)")
      .eq("org_id", session.orgId)
      .not("due_at", "is", null)
      .lt("due_at", now.toISOString())
      .not("deliverable_state", "in", '("approved","delivered","rejected")');

    for (const d of overdueDelivs ?? []) {
      const pname = (d.project as { name?: string } | null)?.name ?? "Unknown";
      candidates.push({
        rule_kind: "overdue_deliverable",
        severity: "warning",
        title: `Overdue deliverable: ${d.title}`,
        body: `"${d.title}" in ${pname} passed its due date without approval.`,
        entity_type: "deliverable",
        entity_id: d.id as string,
        context: { project: pname, due_at: d.due_at },
      });
    }

    // ── Rule: task_overdue ────────────────────────────────────────────────
    const { data: overdueTasks } = await svc
      .from("tasks")
      .select("id, title, due_at, project:project_id(name)")
      .eq("org_id", session.orgId)
      .not("due_at", "is", null)
      .lt("due_at", now.toISOString().split("T")[0]) // date comparison
      .not("status", "in", '("done","cancelled")');

    for (const t of overdueTasks ?? []) {
      const pname = (t.project as { name?: string } | null)?.name;
      candidates.push({
        rule_kind: "task_overdue",
        severity: "warning",
        title: `Overdue task: ${t.title}`,
        body: `Task "${t.title}"${pname ? ` in ${pname}` : ""} is past its due date.`,
        entity_type: "task",
        entity_id: t.id as string,
        context: { due_at: t.due_at },
      });
    }

    // ── Rule: crew_gap ────────────────────────────────────────────────────
    // Shifts starting in the next 48 hours with no assigned crew member.
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const { data: unassignedShifts } = await svc
      .from("shifts")
      .select("id, role, starts_at, venue:venue_id(name)")
      .eq("org_id", session.orgId)
      .is("workforce_member_id", null)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", in48h);

    for (const s of unassignedShifts ?? []) {
      const vname = (s.venue as { name?: string } | null)?.name ?? "Unknown venue";
      candidates.push({
        rule_kind: "crew_gap",
        severity: "critical",
        title: `Unassigned shift in 48h: ${s.role ?? "Crew"} at ${vname}`,
        body: `A ${s.role ?? "crew"} shift at ${vname} starting ${new Date(s.starts_at as string).toLocaleString()} has no assigned team member.`,
        entity_type: "shift",
        entity_id: s.id as string,
        context: { starts_at: s.starts_at, venue: vname },
      });
    }

    // ── Deduplicate + insert new alerts ───────────────────────────────────
    // Fetch alerts already fired in the deduplication window.
    const { data: recent } = await svc
      .from("ops_alerts")
      .select("rule_kind, entity_id")
      .eq("org_id", session.orgId)
      .gte("fired_at", dedupeWindow)
      .is("resolved_at", null);

    const existing = new Set<string>(
      ((recent ?? []) as Array<{ rule_kind: string; entity_id: string | null }>).map(
        (r) => `${r.rule_kind}:${r.entity_id ?? ""}`,
      ),
    );

    const toInsert = candidates.filter(
      (c) => !existing.has(`${c.rule_kind}:${c.entity_id ?? ""}`),
    );

    if (toInsert.length > 0) {
      await svc.from("ops_alerts").insert(
        toInsert.map((c) => ({
          org_id: session.orgId,
          rule_kind: c.rule_kind,
          severity: c.severity,
          title: c.title,
          body: c.body,
          entity_type: c.entity_type ?? null,
          entity_id: c.entity_id ?? null,
          context: c.context ?? {},
        })),
      );
    }

    return apiOk({ evaluated: candidates.length, fired: toInsert.length });
  });
}
