import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import type { Goal } from "@/lib/goals";
import { GoalForm } from "../../GoalForm";
import { updateGoalAction } from "../../actions";
import { listOwnerOptions } from "../../owners";

export const dynamic = "force-dynamic";

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.goals.eyebrow", undefined, "Execution")}
          title={t("console.goals.editPage.title", undefined, "Edit Goal")}
        />
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
        eyebrow={t("console.goals.eyebrow", undefined, "Execution")}
        title={t("console.goals.editPage.title", undefined, "Edit Goal")}
        breadcrumbs={[
          { label: t("console.goals.eyebrow", undefined, "Execution") },
          { label: t("console.goals.title", undefined, "Goals"), href: "/studio/goals" },
          { label: goal.title, href: `/studio/goals/${goal.id}` },
          { label: t("console.goals.editPage.breadcrumb", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <GoalForm
          action={updateGoalAction.bind(null, goal.id)}
          owners={owners}
          goal={goal}
          submitLabel={t("console.goals.editPage.submit", undefined, "Save Goal")}
        />
      </div>
    </>
  );
}
