import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { updateSpecSection } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

type Section = {
  id: string;
  section_number: string;
  title: string;
  division: string | null;
  format: string;
  body_md: string | null;
  project_id: string;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
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

  const [{ data: row }, { data: projects }] = await Promise.all([
    supabase
      .from("spec_sections")
      .select("id, section_number, title, division, format, body_md, project_id, updated_at")
      .eq("id", id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const section = row as Section | null;
  if (!section) notFound();
  const projectChoices = (projects ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.specs.edit.eyebrow", undefined, "Creative · Specs")}
        title={t(
          "console.specs.edit.title",
          { ref: `${section.section_number} — ${section.title}` },
          `Edit · ${section.section_number} — ${section.title}`,
        )}
        subtitle={t("console.specs.edit.subtitle", undefined, "Issue/supersede state is managed from the detail page.")}
        breadcrumbs={[
          { label: t("console.specs.edit.breadcrumbs.specs", undefined, "Specs"), href: "/studio/specs" },
          { label: section.section_number, href: `/studio/specs/${section.id}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateSpecSection}
          cancelHref={`/studio/specs/${section.id}`}
          submitLabel={t("console.specs.edit.submit", undefined, "Save Section")}
          dirtyGuard
        >
          <input type="hidden" name="_updated_at" defaultValue={section.updated_at} />
          <input type="hidden" name="id" value={section.id} />

          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.edit.fields.sectionNumber", undefined, "Section number")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input
                name="section_number"
                required
                defaultValue={section.section_number}
                maxLength={64}
                className={`${INPUT} font-mono`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.edit.fields.title", undefined, "Title")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <input name="title" required defaultValue={section.title} maxLength={200} className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.specs.edit.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required defaultValue={section.project_id} className={INPUT}>
                <option value="">{t("console.specs.new.selectProject", undefined, "Select…")}</option>
                {projectChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.specs.edit.fields.format", undefined, "Format")}</span>
              <select name="format" className={INPUT} defaultValue={section.format}>
                {FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.specs.edit.fields.division", undefined, "Division")}</span>
            <input
              name="division"
              defaultValue={section.division ?? ""}
              maxLength={120}
              placeholder={t("console.specs.new.placeholders.division", undefined, "26 — Electrical")}
              className={INPUT}
            />
            <span className="text-[10px] text-[var(--p-text-2)]">
              {t("console.specs.new.hints.division", undefined, "Free text. Used for grouping in the sections list.")}
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.specs.edit.fields.bodyMarkdown", undefined, "Body — Markdown")}</span>
            <textarea
              name="body_md"
              rows={8}
              defaultValue={section.body_md ?? ""}
              maxLength={200000}
              className={`${INPUT} font-mono text-xs`}
            />
          </label>
        </FormShell>
      </div>
    </>
  );
}
