import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { OpsAskPanel } from "./OpsAskPanel";

export const dynamic = "force-dynamic";

export default async function OpsHealthPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="AI" title="Ops Health" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const now = new Date();

  const [
    { count: openProjects },
    { count: openTasks },
    { count: overdueDelivs },
    { count: openAlerts },
    { count: crewGaps },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .not("xpms_phase", "in", '("closed","cancelled")'),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .not("status", "in", '("done","cancelled")'),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .not("due_at", "is", null)
      .lt("due_at", now.toISOString())
      .not("deliverable_state", "in", '("approved","delivered","rejected")'),
    supabase
      .from("ops_alerts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("resolved_at", null),
    supabase
      .from("shifts")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .is("workforce_member_id", null)
      .gte("starts_at", now.toISOString())
      .lte("starts_at", new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()),
  ]);

  const quickPrompts = [
    "Summarise the operational health of all active projects.",
    "What deliverables are overdue and who owns them?",
    "List all unassigned shifts in the next 48 hours.",
    "Which projects are over budget?",
    "Show me open tasks that are past their due date.",
    "What are the top crew coverage gaps for this week?",
  ];

  const contextSummary = [
    `Active projects: ${openProjects ?? 0}`,
    `Open tasks: ${openTasks ?? 0}`,
    `Overdue deliverables: ${overdueDelivs ?? 0}`,
    `Open ops alerts: ${openAlerts ?? 0}`,
    `Unassigned shifts (48h): ${crewGaps ?? 0}`,
  ].join(" · ");

  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="Ops Health"
        subtitle="Ask questions about your operations in plain language"
        action={
          <Button href="/console/assistant" size="sm" variant="secondary">
            ← All Conversations
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-5">
          <MetricCard label="Active Projects" value={String(openProjects ?? 0)} />
          <MetricCard label="Open Tasks" value={String(openTasks ?? 0)} />
          <MetricCard
            label="Overdue Deliverables"
            value={String(overdueDelivs ?? 0)}
            accent={(overdueDelivs ?? 0) > 0}
          />
          <MetricCard
            label="Open Alerts"
            value={String(openAlerts ?? 0)}
            accent={(openAlerts ?? 0) > 0}
          />
          <MetricCard
            label="Crew Gaps (48h)"
            value={String(crewGaps ?? 0)}
            accent={(crewGaps ?? 0) > 0}
          />
        </div>

        <div className="surface p-4">
          <p className="text-xs text-[var(--text-muted)]">
            <span className="font-semibold">Context snapshot · </span>
            {contextSummary}
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Quick prompts</h2>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p) => (
              <span
                key={p}
                className="surface hover-lift rounded px-2 py-1 text-xs text-[var(--text-secondary)]"
              >
                {p}
              </span>
            ))}
          </div>
        </section>

        <OpsAskPanel
          contextSummary={contextSummary}
          quickPrompts={quickPrompts}
        />
      </div>
    </>
  );
}
