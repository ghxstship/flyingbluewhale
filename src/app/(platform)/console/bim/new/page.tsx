import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { registerBimModel } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const SOURCE_TYPES = [
  { value: "ifc", label: "IFC" },
  { value: "ifc_zip", label: "IFC (zipped)" },
  { value: "rvt", label: "Revit (RVT)" },
  { value: "nwd", label: "Navisworks (NWD)" },
  { value: "nwc", label: "Navisworks Cache (NWC)" },
  { value: "glb", label: "glTF binary (GLB)" },
  { value: "gltf", label: "glTF" },
  { value: "fbx", label: "FBX" },
  { value: "dwg", label: "AutoCAD (DWG)" },
];

const DISCIPLINES = [
  { value: "multi", label: "Multi-discipline" },
  { value: "A", label: "Architectural" },
  { value: "S", label: "Structural" },
  { value: "M", label: "Mechanical" },
  { value: "E", label: "Electrical" },
  { value: "P", label: "Plumbing" },
  { value: "FP", label: "Fire Protection" },
  { value: "CIV", label: "Civil" },
];

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
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
        eyebrow="Creative"
        title="Register BIM Model"
        subtitle="Register a model file. Upload through the 'bim' storage bucket separately; this row is the metadata anchor."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={registerBimModel} cancelHref="/console/bim" submitLabel="Register Model">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="Tower-A Architectural — Level 03" className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Project<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">Select…</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Discipline</span>
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
                Source type<span className="ms-0.5 text-[var(--color-error)]">*</span>
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
              <span className={LBL}>Version label</span>
              <input name="version_label" placeholder="Rev 0, 50% DD" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Storage path<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="storage_path"
              required
              placeholder="<project-id>/bim/tower-a-arch-rev0.ifc"
              className={`${INPUT} font-mono text-xs`}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              Object key inside the &apos;bim&apos; storage bucket. Upload separately; this row references it.
            </span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
