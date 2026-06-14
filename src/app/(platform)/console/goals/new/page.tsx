import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { GoalForm } from "../GoalForm";
import { createGoalAction } from "../actions";
import { listOwnerOptions } from "../owners";

export const dynamic = "force-dynamic";

export default async function NewGoalPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Execution" title="New Goal" />
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
        eyebrow="Execution"
        title="New Goal"
        breadcrumbs={[{ label: "Execution" }, { label: "Goals", href: "/console/goals" }, { label: "New" }]}
      />
      <div className="page-content max-w-2xl">
        <GoalForm action={createGoalAction} owners={owners} submitLabel="Create Goal" />
      </div>
    </>
  );
}
