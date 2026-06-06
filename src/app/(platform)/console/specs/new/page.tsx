import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { createSpecSection } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const FORMATS = [
    {
      value: "masterformat_2026",
      label: t("console.specs.new.format.masterformat_2026", undefined, "CSI MasterFormat 2026"),
    },
    {
      value: "masterformat_1995",
      label: t("console.specs.new.format.masterformat_1995", undefined, "CSI MasterFormat 1995 — 16-div"),
    },
    {
      value: "uniformat_2_2",
      label: t("console.specs.new.format.uniformat_2_2", undefined, "Uniformat II — ASTM E1557"),
    },
    { value: "nrm2", label: t("console.specs.new.format.nrm2", undefined, "RICS NRM2 — UK") },
    { value: "custom", label: t("console.specs.new.format.custom", undefined, "Custom") },
  ];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.specs.new.eyebrow", undefined, "Creative")}
        title={t("console.specs.new.title", undefined, "New Spec Section")}
        subtitle={t(
          "console.specs.new.subtitle",
          undefined,
          "A section in the project's specifications book. RFIs and submittals can link back to it.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createSpecSection}
          cancelHref="/console/specs"
          submitLabel={t("console.specs.new.submit", undefined, "Create Section")}
        >
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.new.fields.sectionNumber", undefined, "Section number")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="section_number" required placeholder="26 22 00" className={`${INPUT} font-mono`} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.new.fields.title", undefined, "Title")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input
                name="title"
                required
                placeholder={t("console.specs.new.placeholders.title", undefined, "Low-Voltage Transformers")}
                className={INPUT}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.new.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("console.specs.new.selectProject", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.specs.new.fields.format", undefined, "Format")}</span>
              <select name="format" className={INPUT} defaultValue="masterformat_2026">
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.specs.new.fields.division", undefined, "Division")}</span>
            <input
              name="division"
              placeholder={t("console.specs.new.placeholders.division", undefined, "26 — Electrical")}
              className={INPUT}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              {t("console.specs.new.hints.division", undefined, "Free text. Used for grouping in the sections list.")}
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.specs.new.fields.bodyMarkdown", undefined, "Body — Markdown")}</span>
            <textarea
              name="body_md"
              rows={8}
              placeholder="PART 1 - GENERAL\n  1.1 SUMMARY\n    A. Section includes ..."
              className={`${INPUT} font-mono text-xs`}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
