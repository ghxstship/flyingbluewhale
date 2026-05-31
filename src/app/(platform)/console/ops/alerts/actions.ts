"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const IdSchema = z.object({ alertId: z.string().uuid() });

export async function acknowledgeAlertAction(fd: FormData): Promise<void> {
  const session = await requireSession();
  const { alertId } = IdSchema.parse({ alertId: fd.get("alertId") });
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase
    .from("ops_alerts")
    .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: session.userId })
    .eq("id", alertId)
    .eq("org_id", session.orgId)
    .is("acknowledged_at", null);
  revalidatePath("/console/ops/alerts");
}

export async function resolveAlertAction(fd: FormData): Promise<void> {
  const session = await requireSession();
  const { alertId } = IdSchema.parse({ alertId: fd.get("alertId") });
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase
    .from("ops_alerts")
    .update({ resolved_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("org_id", session.orgId);
  revalidatePath("/console/ops/alerts");
}

export async function evaluateAlertsAction(): Promise<{ fired: number }> {
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();
  const dedupeWindow = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  type Candidate = {
    rule_kind: string;
    severity: "info" | "warning" | "critical";
    title: string;
    body: string;
    entity_type?: string;
    entity_id?: string;
    context?: Record<string, unknown>;
  };
  const candidates: Candidate[] = [];

  const [{ data: overruns }, { data: overdueDelivs }, { data: overdueTasks }, { data: unassigned }] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("id, project_id, total_amount, spent_amount, project:project_id(name)")
        .eq("org_id", session.orgId)
        .filter("spent_amount", "gt", "total_amount"),
      supabase
        .from("deliverables")
        .select("id, title, due_at, project:project_id(name)")
        .eq("org_id", session.orgId)
        .not("due_at", "is", null)
        .lt("due_at", now.toISOString())
        .not("deliverable_state", "in", '("approved","delivered","rejected")'),
      supabase
        .from("tasks")
        .select("id, title, due_at, project:project_id(name)")
        .eq("org_id", session.orgId)
        .not("due_at", "is", null)
        .lt("due_at", now.toISOString().split("T")[0])
        .not("status", "in", '("done","cancelled")'),
      supabase
        .from("shifts")
        .select("id, role, starts_at, venue:venue_id(name)")
        .eq("org_id", session.orgId)
        .is("workforce_member_id", null)
        .gte("starts_at", now.toISOString())
        .lte("starts_at", in48h),
    ]);

  for (const b of overruns ?? []) {
    const name = (b.project as { name?: string } | null)?.name ?? "Unknown";
    const overage = (((b.spent_amount as number) - (b.total_amount as number)) / 100).toFixed(2);
    candidates.push({
      rule_kind: "budget_overrun",
      severity: "critical",
      title: `Budget overrun: ${name}`,
      body: `Spent exceeds budget by $${overage}.`,
      entity_type: "budget",
      entity_id: b.id as string,
    });
  }
  for (const d of overdueDelivs ?? []) {
    const pname = (d.project as { name?: string } | null)?.name ?? "Unknown";
    candidates.push({
      rule_kind: "overdue_deliverable",
      severity: "warning",
      title: `Overdue deliverable: ${d.title}`,
      body: `"${d.title}" in ${pname} is past its due date.`,
      entity_type: "deliverable",
      entity_id: d.id as string,
    });
  }
  for (const t of overdueTasks ?? []) {
    const pname = (t.project as { name?: string } | null)?.name;
    candidates.push({
      rule_kind: "task_overdue",
      severity: "warning",
      title: `Overdue task: ${t.title}`,
      body: `"${t.title}"${pname ? ` in ${pname}` : ""} is past its due date.`,
      entity_type: "task",
      entity_id: t.id as string,
    });
  }
  for (const s of unassigned ?? []) {
    const vname = (s.venue as { name?: string } | null)?.name ?? "Unknown venue";
    candidates.push({
      rule_kind: "crew_gap",
      severity: "critical",
      title: `Unassigned shift: ${s.role ?? "Crew"} @ ${vname}`,
      body: `Shift starting ${new Date(s.starts_at as string).toLocaleString()} at ${vname} has no crew assigned.`,
      entity_type: "shift",
      entity_id: s.id as string,
    });
  }

  const looseSupabase = supabase as unknown as LooseSupabase;
  const { data: recent } = await looseSupabase
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

  const toInsert = candidates.filter((c) => !existing.has(`${c.rule_kind}:${c.entity_id ?? ""}`));
  if (toInsert.length > 0) {
    await looseSupabase.from("ops_alerts").insert(
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

  revalidatePath("/console/ops/alerts");
  return { fired: toInsert.length };
}
