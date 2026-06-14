import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { updateSheetSet } from "./actions";

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

type SheetSet = {
  id: string;
  name: string;
  description: string | null;
  discipline: string | null;
  project_id: string;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();

  const [{ data: row }, { data: projects }] = await Promise.all([
    supabase
      .from("sheet_sets")
      .select("id, name, description, discipline, project_id, updated_at")
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

  const set = row as SheetSet | null;
  if (!set) notFound();
  const projectChoices = (projects ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.drawings.edit.eyebrow", undefined, "Creative · Drawings")}
        title={t("console.drawings.edit.title", { name: set.name }, `Edit · ${set.name}`)}
        subtitle={t(
          "console.drawings.edit.subtitle",
          undefined,
          "Versions and sheets are managed from the detail page; this edits the set metadata.",
        )}
        breadcrumbs={[
          { label: t("console.drawings.edit.breadcrumbs.drawings", undefined, "Drawings"), href: "/console/drawings" },
          { label: set.name, href: `/console/drawings/${set.id}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateSheetSet}
          cancelHref={`/console/drawings/${set.id}`}
          submitLabel={t("console.drawings.edit.submit", undefined, "Save Sheet Set")}
          dirtyGuard
        >
          <input type="hidden" name="_updated_at" defaultValue={set.updated_at} />
          <input type="hidden" name="id" value={set.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.drawings.edit.fields.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input name="name" required defaultValue={set.name} maxLength={200} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.drawings.edit.fields.description", undefined, "Description")}</span>
            <textarea name="description" rows={3} defaultValue={set.description ?? ""} maxLength={4000} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.drawings.edit.fields.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required defaultValue={set.project_id} className={INPUT}>
                <option value="">{t("common.selectPlaceholder", undefined, "Select…")}</option>
                {projectChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.drawings.edit.fields.discipline", undefined, "Discipline")}</span>
              <select name="discipline" className={INPUT} defaultValue={set.discipline ?? "multi"}>
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {t(`console.drawings.new.disciplines.${d.labelKey}`, undefined, d.labelFallback)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
