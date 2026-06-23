import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestT } from "@/lib/i18n/request";
import { updateBimModel } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

type Model = {
  id: string;
  name: string;
  discipline: string | null;
  source_type: string;
  storage_path: string;
  version_label: string | null;
  project_id: string;
  updated_at: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { t } = await getRequestT();

  const SOURCE_TYPES = [
    { value: "ifc", label: t("console.bim.new.sourceType.ifc", undefined, "IFC") },
    { value: "ifc_zip", label: t("console.bim.new.sourceType.ifcZip", undefined, "IFC — Zipped") },
    { value: "rvt", label: t("console.bim.new.sourceType.rvt", undefined, "Revit — RVT") },
    { value: "nwd", label: t("console.bim.new.sourceType.nwd", undefined, "Navisworks — NWD") },
    { value: "nwc", label: t("console.bim.new.sourceType.nwc", undefined, "Navisworks Cache — NWC") },
    { value: "glb", label: t("console.bim.new.sourceType.glb", undefined, "glTF Binary — GLB") },
    { value: "gltf", label: t("console.bim.new.sourceType.gltf", undefined, "glTF") },
    { value: "fbx", label: t("console.bim.new.sourceType.fbx", undefined, "FBX") },
    { value: "dwg", label: t("console.bim.new.sourceType.dwg", undefined, "AutoCAD — DWG") },
  ];

  const DISCIPLINES = [
    { value: "multi", label: t("console.bim.new.discipline.multi", undefined, "Multi-discipline") },
    { value: "A", label: t("console.bim.new.discipline.architectural", undefined, "Architectural") },
    { value: "S", label: t("console.bim.new.discipline.structural", undefined, "Structural") },
    { value: "M", label: t("console.bim.new.discipline.mechanical", undefined, "Mechanical") },
    { value: "E", label: t("console.bim.new.discipline.electrical", undefined, "Electrical") },
    { value: "P", label: t("console.bim.new.discipline.plumbing", undefined, "Plumbing") },
    { value: "FP", label: t("console.bim.new.discipline.fireProtection", undefined, "Fire Protection") },
    { value: "CIV", label: t("console.bim.new.discipline.civil", undefined, "Civil") },
  ];

  const [{ data: row }, { data: projects }] = await Promise.all([
    supabase
      .from("bim_models")
      .select("id, name, discipline, source_type, storage_path, version_label, project_id, updated_at")
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

  const m = row as Model | null;
  if (!m) notFound();
  const projectChoices = (projects ?? []) as Array<{ id: string; name: string }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bim.edit.eyebrow", undefined, "Creative · BIM")}
        title={t("console.bim.edit.title", { name: m.name }, `Edit · ${m.name}`)}
        subtitle={t(
          "console.bim.edit.subtitle",
          undefined,
          "Processing state, hot links, and download are managed from the detail page.",
        )}
        breadcrumbs={[
          { label: t("console.bim.edit.breadcrumbs.bim", undefined, "BIM"), href: "/studio/bim" },
          { label: m.name, href: `/studio/bim/${m.id}` },
          { label: t("common.edit", undefined, "Edit") },
        ]}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={updateBimModel}
          cancelHref={`/studio/bim/${m.id}`}
          submitLabel={t("console.bim.edit.submit", undefined, "Save Model")}
          dirtyGuard
        >
          <input type="hidden" name="_updated_at" defaultValue={m.updated_at} />
          <input type="hidden" name="id" value={m.id} />

          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.bim.edit.field.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input name="name" required defaultValue={m.name} maxLength={200} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.bim.edit.field.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required defaultValue={m.project_id} className={INPUT}>
                <option value="">{t("console.bim.new.selectProject", undefined, "Select…")}</option>
                {projectChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.bim.edit.field.discipline", undefined, "Discipline")}</span>
              <select name="discipline" className={INPUT} defaultValue={m.discipline ?? "multi"}>
                {DISCIPLINES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.bim.edit.field.sourceType", undefined, "Source type")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="source_type" required className={INPUT} defaultValue={m.source_type}>
                {SOURCE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.bim.edit.field.versionLabel", undefined, "Version label")}</span>
              <input
                name="version_label"
                defaultValue={m.version_label ?? ""}
                maxLength={64}
                placeholder={t("console.bim.new.placeholder.versionLabel", undefined, "Rev 0, 50% DD")}
                className={INPUT}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.bim.edit.field.storagePath", undefined, "Storage path")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="storage_path"
              required
              defaultValue={m.storage_path}
              maxLength={400}
              className={`${INPUT} font-mono text-xs`}
            />
            <span className="text-[10px] text-[var(--p-text-2)]">
              {t(
                "console.bim.new.storagePathHint",
                undefined,
                "Object key inside the 'bim' storage bucket. Upload separately; this row references it.",
              )}
            </span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
