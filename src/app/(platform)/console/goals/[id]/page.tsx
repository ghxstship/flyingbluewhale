import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DeleteForm } from "@/components/DeleteForm";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  GOAL_STATES,
  GOAL_STATE_LABELS,
  goalProgress,
  formatPercent,
  type Goal,
  type KeyResult,
} from "@/lib/goals";
import { deleteGoalAction, setGoalStateAction } from "../actions";
import { KeyResultsPanel } from "./KeyResultsPanel";

export const dynamic = "force-dynamic";

export default async function GoalDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const canEdit = isManagerPlus(session);
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data } = await db
    .from("goals")
    .select("id, org_id, title, description, owner_id, period, goal_state, created_at, updated_at")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  const goal = (data ?? null) as Goal | null;
  if (!goal) notFound();

  const { data: krData } = await db
    .from("key_results")
    .select("id, org_id, goal_id, title, target_value, current_value, unit, kr_state, created_at, updated_at")
    .eq("goal_id", goal.id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(200);
  const keyResults = (krData ?? []) as KeyResult[];

  let ownerLabel: string | null = null;
  if (goal.owner_id) {
    const { data: ownerData } = await db
      .from("users")
      .select("id, email, name")
      .eq("id", goal.owner_id)
      .maybeSingle();
    const owner = (ownerData ?? null) as { email: string; name: string | null } | null;
    ownerLabel = owner ? (owner.name ?? owner.email) : null;
  }

  const progress = goalProgress(keyResults);

  return (
    <>
      <ModuleHeader
        eyebrow="Goal"
        title={goal.title}
        subtitle={goal.period ?? undefined}
        breadcrumbs={[{ label: "Execution" }, { label: "Goals", href: "/console/goals" }, { label: goal.title }]}
        action={
          canEdit ? (
            <div className="flex items-center gap-2">
              <Button href={`/console/goals/${goal.id}/edit`} size="sm" variant="secondary">
                Edit
              </Button>
              {GOAL_STATES.filter((s) => s !== goal.goal_state).map((s) => (
                <form key={s} action={setGoalStateAction.bind(null, goal.id, s)}>
                  <Button type="submit" size="sm" variant="secondary">
                    {GOAL_STATE_LABELS[s]}
                  </Button>
                </form>
              ))}
              <DeleteForm
                action={deleteGoalAction.bind(null, goal.id)}
                confirm={`Delete goal "${goal.title}"?`}
              />
            </div>
          ) : undefined
        }
      />
      <div className="page-content space-y-8">
        <div className="metric-grid">
          <Field label="State">
            <StatusBadge status={goal.goal_state} />
          </Field>
          <Field label="Owner">{ownerLabel ?? "Unassigned"}</Field>
          <Field label="Period">{goal.period ?? "—"}</Field>
          <Field label="Created">{timeAgo(goal.created_at)}</Field>
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Overall Progress</h3>
            <span className="text-sm font-medium">{formatPercent(progress)}</span>
          </div>
          <ProgressBar
            value={Math.round(progress * 100)}
            aria-label="Overall goal progress"
            className="mt-3"
          />
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            Average of {keyResults.length === 1 ? "1 key result" : `${keyResults.length} key results`} (current /
            target).
          </p>
        </div>

        <KeyResultsPanel goalId={goal.id} keyResults={keyResults} canEdit={canEdit} />

        {goal.description && (
          <div className="surface p-5">
            <h3 className="text-sm font-semibold">Description</h3>
            <p className="mt-2 text-sm whitespace-pre-wrap text-[var(--p-text-2)]">{goal.description}</p>
          </div>
        )}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="surface p-3">
      <div className="text-[11px] font-semibold tracking-wide text-[var(--p-text-2)]">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
