import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createTrainingPathAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewTrainingPathPage() {
  const { t } = await getRequestT();
  if (hasSupabase) {
    await requireSession();
  }

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND"
        title="New Training Path"
        subtitle="Define a structured learning sequence for your team"
      />
      <div className="page-content max-w-xl">
        <FormShell
          action={createTrainingPathAction}
          cancelHref="/console/legend/paths"
          submitLabel={t("common.create", undefined, "Create")}
        >
          <Input label="Name" name="name" required maxLength={255} placeholder="e.g. New Hire Orientation" />
          <div>
            <label className="text-xs font-medium text-[var(--p-text-2)]">Description</label>
            <textarea name="description" rows={3} className="ps-input mt-1.5 w-full" placeholder="What will learners accomplish by completing this path?" />
          </div>
          <Input label="Target Role" name="target_role" maxLength={120} placeholder="e.g. Stage Manager, Rigger" hint="Who is this path designed for?" />
          <Input label="Estimated Hours" name="estimated_hours" type="number" min="0" step="0.5" placeholder="e.g. 4.5" hint="Total learning time estimate" />
          <div className="flex items-center gap-3">
            <input type="checkbox" name="is_required" id="is_required" className="h-4 w-4 rounded border-[var(--p-border)] accent-[var(--p-accent)]" />
            <label htmlFor="is_required" className="text-sm text-[var(--p-text-1)]">
              Mark as required for target role
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
