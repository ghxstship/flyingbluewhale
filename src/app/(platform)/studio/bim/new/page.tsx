import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { registerBimModel } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--p-text-2)]";

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

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.bim.new.eyebrow", undefined, "Creative")}
        title={t("console.bim.new.title", undefined, "Register BIM Model")}
        subtitle={t(
          "console.bim.new.subtitle",
          undefined,
          "Register a model file. Upload through the 'bim' storage bucket separately; this row is the metadata anchor.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={registerBimModel}
          cancelHref="/studio/bim"
          submitLabel={t("console.bim.new.submit", undefined, "Register Model")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.bim.new.field.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.bim.new.placeholder.name", undefined, "Tower-A Architectural — Level 03")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.bim.new.field.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("console.bim.new.selectProject", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.bim.new.field.discipline", undefined, "Discipline")}</span>
              <select name="discipline" className={INPUT} defaultValue="multi">
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
                {t("console.bim.new.field.sourceType", undefined, "Source type")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="source_type" required className={INPUT} defaultValue="ifc">
                {SOURCE_TYPES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.bim.new.field.versionLabel", undefined, "Version label")}</span>
              <input
                name="version_label"
                placeholder={t("console.bim.new.placeholder.versionLabel", undefined, "Rev 0, 50% DD")}
                className={INPUT}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.bim.new.field.storagePath", undefined, "Storage path")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="storage_path"
              required
              placeholder="<project-id>/bim/tower-a-arch-rev0.ifc"
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
