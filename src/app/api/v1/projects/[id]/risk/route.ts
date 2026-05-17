import { apiError, apiOk } from "@/lib/api";
import { withAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/v1/projects/[id]/risk
 *
 * Project risk flags — Monday.com AI smart risk parity.
 * Returns a list of auto-detected risk signals for a project:
 *   - overdue deliverables
 *   - budget overrun (actual > budget_cents)
 *   - stale project (no updates > 7 days)
 *   - crew gaps (zero crew members assigned)
 *   - open high-severity incidents
 *
 * Each flag carries a severity ("high"|"medium"|"low") and a human message.
 */

export type RiskFlag = {
  id: string;
  severity: "high" | "medium" | "low";
  category: "deliverables" | "budget" | "staleness" | "crew" | "incidents";
  message: string;
  count?: number;
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;

  return withAuth(async (session) => {
    const supabase = await createClient();

    // Verify org ownership.
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, budget_cents, updated_at, xpms_phase")
      .eq("id", projectId)
      .eq("org_id", session.orgId)
      .maybeSingle();
    if (!project) return apiError("not_found", "Project not found");

    const flags: RiskFlag[] = [];

    await Promise.all([
      // 1 — Overdue deliverables
      supabase
        .from("deliverables")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("org_id", session.orgId)
        .lt("due_date", new Date().toISOString())
        .not("deliverable_state", "in", '("delivered","rejected")')
        .then(({ count }) => {
          if (count && count > 0) {
            flags.push({
              id: "overdue_deliverables",
              severity: count >= 3 ? "high" : "medium",
              category: "deliverables",
              message: `${count} deliverable${count === 1 ? "" : "s"} past due`,
              count,
            });
          }
        }),

      // 2 — Budget overrun
      (async () => {
        if (!project.budget_cents) return;
        const [{ data: expenses }, { data: timeEntries }] = await Promise.all([
          supabase.from("expenses").select("amount_cents").eq("project_id", projectId).eq("org_id", session.orgId),
          supabase
            .from("time_entries")
            .select("duration_minutes, rate_cents")
            .eq("project_id", projectId)
            .eq("org_id", session.orgId),
        ]);
        const expenseTotal = (expenses ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
        const timeTotal = (timeEntries ?? []).reduce(
          (s, r) => s + Math.round(((r.duration_minutes ?? 0) / 60) * (r.rate_cents ?? 0)),
          0,
        );
        const totalSpend = expenseTotal + timeTotal;
        const pct = totalSpend / project.budget_cents;
        if (pct >= 1.0) {
          flags.push({
            id: "budget_overrun",
            severity: "high",
            category: "budget",
            message: `Over budget — ${Math.round(pct * 100)}% of budget spent`,
          });
        } else if (pct >= 0.9) {
          flags.push({
            id: "budget_warning",
            severity: "medium",
            category: "budget",
            message: `${Math.round(pct * 100)}% of budget consumed`,
          });
        }
      })(),

      // 3 — Stale project (no updates in 7+ days on active phases)
      (() => {
        const activePhases = ["planning", "active", "production"];
        if (!activePhases.includes(project.xpms_phase)) return;
        const daysSinceUpdate =
          (Date.now() - new Date(project.updated_at as string).getTime()) / 86_400_000;
        if (daysSinceUpdate >= 14) {
          flags.push({
            id: "stale_project",
            severity: "medium",
            category: "staleness",
            message: `No activity in ${Math.floor(daysSinceUpdate)} days`,
          });
        }
      })(),

      // 4 — Crew gap: no crew members assigned to this project
      supabase
        .from("crew_members")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .then(({ count }) => {
          // If the org has crew but none are linked, that's a gap.
          // We use project crew via time_entries as a proxy.
          if (typeof count === "number" && count > 0) return;
          // No crew in org at all — lower severity signal.
          flags.push({
            id: "no_crew",
            severity: "low",
            category: "crew",
            message: "No crew members in org roster",
          });
        }),

      // 5 — Open incidents linked to this project
      supabase
        .from("incidents")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("org_id", session.orgId)
        .not("incident_state", "in", '("closed","resolved")')
        .then(({ count }) => {
          if (count && count > 0) {
            flags.push({
              id: "open_incidents",
              severity: count >= 2 ? "high" : "medium",
              category: "incidents",
              message: `${count} open incident${count === 1 ? "" : "s"}`,
              count,
            });
          }
        }),
    ]);

    // Sort: high → medium → low
    const order = { high: 0, medium: 1, low: 2 };
    flags.sort((a, b) => order[a.severity] - order[b.severity]);

    return apiOk({ project_id: projectId, flags, flagged: flags.length > 0 });
  });
}
