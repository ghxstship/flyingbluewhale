import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import { GoalForm } from "../GoalForm";
import { createGoalAction } from "../actions";
import { listOwnerOptions } from "../owners";

export const dynamic = "force-dynamic";

export default async function NewGoalPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.goals.eyebrow", undefined, "Execution")}
          title={t("console.goals.new.title", undefined, "New Goal")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;
  const owners = await listOwnerOptions(db, session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.goals.eyebrow", undefined, "Execution")}
        title={t("console.goals.new.title", undefined, "New Goal")}
        breadcrumbs={[
          { label: t("console.goals.eyebrow", undefined, "Execution") },
          { label: t("console.goals.title", undefined, "Goals"), href: "/studio/goals" },
          { label: t("console.goals.new.breadcrumb", undefined, "New") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <GoalForm
          action={createGoalAction}
          owners={owners}
          submitLabel={t("console.goals.new.submit", undefined, "Create Goal")}
        />
      </div>
    </>
  );
}
