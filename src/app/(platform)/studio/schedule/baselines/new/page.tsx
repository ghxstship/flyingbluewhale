import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { FormField } from "@/components/ui/FormField";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createBaseline } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.schedule.baselines.new.eyebrow", undefined, "Operations")}
        title={t("console.schedule.baselines.new.title", undefined, "New Schedule Baseline")}
        subtitle={t(
          "console.schedule.baselines.new.subtitle",
          undefined,
          "A named snapshot of the project schedule. Add activities + dependencies after creation; activate to make this the active baseline for the project.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createBaseline}
          cancelHref="/studio/schedule/baselines"
          submitLabel={t("console.schedule.baselines.new.submit", undefined, "Create Baseline")}
        >
          <FormField label={t("console.schedule.baselines.new.nameLabel", undefined, "Name")} required>
            <input
              name="name"
              required
              placeholder={t("console.schedule.baselines.new.namePlaceholder", undefined, "Initial 100% CD Baseline")}
              className="ps-input"
            />
          </FormField>
          <FormField label={t("console.schedule.baselines.new.descriptionLabel", undefined, "Description")}>
            <textarea name="description" rows={3} className="ps-input" />
          </FormField>
          <FormField label={t("console.schedule.baselines.new.projectLabel", undefined, "Project")} required>
            <select name="project_id" required className="ps-input">
              <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
              {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
        </FormShell>
      </div>
    </>
  );
}
