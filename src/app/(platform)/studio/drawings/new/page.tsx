import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createSheetSet } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

const DISCIPLINES = [
  { value: "multi", labelKey: "multi", labelFallback: "Multi-discipline" },
  { value: "A", labelKey: "architectural", labelFallback: "Architectural" },
  { value: "S", labelKey: "structural", labelFallback: "Structural" },
  { value: "M", labelKey: "mechanical", labelFallback: "Mechanical" },
  { value: "E", labelKey: "electrical", labelFallback: "Electrical" },
  { value: "P", labelKey: "plumbing", labelFallback: "Plumbing" },
  { value: "FP", labelKey: "fireProtection", labelFallback: "Fire Protection" },
  { value: "CIV", labelKey: "civil", labelFallback: "Civil" },
  { value: "LAN", labelKey: "landscape", labelFallback: "Landscape" },
  { value: "IT", labelKey: "telecomIt", labelFallback: "Telecom / IT" },
];

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
        eyebrow={t("console.drawings.new.eyebrow", undefined, "Creative")}
        title={t("console.drawings.new.title", undefined, "New Sheet Set")}
        subtitle={t(
          "console.drawings.new.subtitle",
          undefined,
          "A versioned package of construction drawings. Add sheets after creation; publish to lock a version.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createSheetSet}
          cancelHref="/studio/drawings"
          submitLabel={t("console.drawings.new.submit", undefined, "Create Sheet Set")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.drawings.new.fields.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.drawings.new.placeholders.name", undefined, "100% Construction Documents")}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.drawings.new.fields.description", undefined, "Description")}</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.drawings.new.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.drawings.new.fields.discipline", undefined, "Discipline")}</span>
              <select name="discipline" className={INPUT} defaultValue="multi">
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {t(`console.drawings.new.disciplines.${d.labelKey}`, undefined, d.labelFallback)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.drawings.new.fields.initialVersionLabel", undefined, "Initial version label")}
            </span>
            <input
              name="initial_version_label"
              defaultValue="Rev 0"
              placeholder={t(
                "console.drawings.new.placeholders.initialVersionLabel",
                undefined,
                "Rev 0, 50% DD, 100% CD, 2026-03-15",
              )}
              className={INPUT}
            />
            <span className="text-[11px] text-[var(--p-text-2)]">
              {t(
                "console.drawings.new.hints.initialVersionLabel",
                undefined,
                "Creates a draft version under this set. Leave blank to skip and add a version later.",
              )}
            </span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
