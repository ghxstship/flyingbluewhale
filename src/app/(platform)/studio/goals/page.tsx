import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { goalProgress, formatPercent, type Goal, type KeyResult } from "@/lib/goals";

export const dynamic = "force-dynamic";

type GoalRow = Goal & { progress: number; krCount: number };

export default async function GoalsHubPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Execution" title="Goals" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ data: goalData }, { data: krData }] = await Promise.all([
    db
      .from("goals")
      .select("id, org_id, title, description, owner_id, period, goal_state, created_at, updated_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(500),
    db
      .from("key_results")
      .select("id, org_id, goal_id, target_value, current_value")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .limit(2000),
  ]);

  const goals = (goalData ?? []) as Goal[];
  const krs = (krData ?? []) as Pick<KeyResult, "id" | "goal_id" | "target_value" | "current_value">[];

  const byGoal = new Map<string, Pick<KeyResult, "target_value" | "current_value">[]>();
  for (const kr of krs) {
    const bucket = byGoal.get(kr.goal_id) ?? [];
    bucket.push(kr);
    byGoal.set(kr.goal_id, bucket);
  }

  const rows: GoalRow[] = goals.map((g) => {
    const list = byGoal.get(g.id) ?? [];
    return { ...g, progress: goalProgress(list), krCount: list.length };
  });

  return (
    <>
      <ModuleHeader
        eyebrow="Execution"
        title="Goals"
        subtitle={goals.length === 1 ? "1 goal" : `${goals.length} goals`}
        breadcrumbs={[{ label: "Execution" }, { label: "Goals" }]}
        action={<Button href="/studio/goals/new">+ New Goal</Button>}
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title="No goals yet"
            description="Set org objectives and track measurable key results — progress rolls up from each key result automatically."
            action={<Button href="/studio/goals/new">+ New Goal</Button>}
          />
        ) : (
          <DataTable<GoalRow>
            rows={rows}
            rowHref={(g) => `/studio/goals/${g.id}`}
            emptyLabel="No goals yet"
            emptyDescription="Create your first objective."
            columns={[
              {
                key: "title",
                header: "Goal",
                render: (g) => g.title,
                accessor: (g) => g.title,
              },
              {
                key: "period",
                header: "Period",
                render: (g) => g.period ?? "—",
                accessor: (g) => g.period ?? "",
              },
              {
                key: "progress",
                header: "Progress",
                render: (g) => (
                  <div className="flex items-center gap-2">
                    <ProgressBar
                      value={Math.round(g.progress * 100)}
                      aria-label={`${g.title} progress`}
                      className="w-24"
                    />
                    <span className="text-xs text-[var(--p-text-2)]">{formatPercent(g.progress)}</span>
                  </div>
                ),
                accessor: (g) => g.progress,
              },
              {
                key: "krs",
                header: "Key Results",
                render: (g) => (g.krCount === 1 ? "1" : String(g.krCount)),
                accessor: (g) => g.krCount,
              },
              {
                key: "state",
                header: "State",
                render: (g) => <StatusBadge status={g.goal_state} />,
                accessor: (g) => g.goal_state,
              },
              {
                key: "created",
                header: "Created",
                render: (g) => timeAgo(g.created_at),
                accessor: (g) => g.created_at,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
