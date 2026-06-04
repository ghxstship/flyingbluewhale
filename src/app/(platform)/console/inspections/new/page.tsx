import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createInspection } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const [{ data: projects }, { data: templates }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase
      .from("inspection_templates")
      .select("id, name, category")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.inspections.new.eyebrow", undefined, "Safety")}
        title={t("console.inspections.new.title", undefined, "Schedule Inspection")}
        subtitle={t("console.inspections.new.subtitle", undefined, "Pick a template and target.")}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createInspection}
          cancelHref="/console/inspections"
          submitLabel={t("console.inspections.new.submit", undefined, "Schedule")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.inspections.new.fields.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t(
                "console.inspections.new.fields.namePlaceholder",
                undefined,
                "Pre-doors rigging walk — Saturday",
              )}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.inspections.new.fields.project", undefined, "Project")}</span>
              <select name="project_id" className={INPUT}>
                <option value="">—</option>
                {(projects ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.inspections.new.fields.template", undefined, "Template")}</span>
              <select name="template_id" className={INPUT}>
                <option value="">—</option>
                {(templates ?? []).map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.inspections.new.fields.scheduledFor", undefined, "Scheduled for")}</span>
            <input type="datetime-local" name="scheduled_for" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.inspections.new.fields.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
