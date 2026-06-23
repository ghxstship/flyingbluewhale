import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { Goal } from "@/lib/goals";
import { GoalForm } from "../../GoalForm";
import { updateGoalAction } from "../../actions";
import { listOwnerOptions } from "../../owners";

export const dynamic = "force-dynamic";

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Execution" title="Edit Goal" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
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
  const owners = await listOwnerOptions(db, session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow="Execution"
        title="Edit Goal"
        breadcrumbs={[
          { label: "Execution" },
          { label: "Goals", href: "/studio/goals" },
          { label: goal.title, href: `/studio/goals/${goal.id}` },
          { label: "Edit" },
        ]}
      />
      <div className="page-content max-w-2xl">
        <GoalForm
          action={updateGoalAction.bind(null, goal.id)}
          owners={owners}
          goal={goal}
          submitLabel="Save Goal"
        />
      </div>
    </>
  );
}
