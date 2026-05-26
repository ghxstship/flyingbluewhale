import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createSheetSet } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

const DISCIPLINES = [
  { value: "multi", label: "Multi-discipline" },
  { value: "A", label: "Architectural" },
  { value: "S", label: "Structural" },
  { value: "M", label: "Mechanical" },
  { value: "E", label: "Electrical" },
  { value: "P", label: "Plumbing" },
  { value: "FP", label: "Fire Protection" },
  { value: "CIV", label: "Civil" },
  { value: "LAN", label: "Landscape" },
  { value: "IT", label: "Telecom / IT" },
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
        title="New Sheet Set"
        subtitle="A versioned package of construction drawings. Add sheets after creation; publish to lock a version."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createSheetSet} cancelHref="/console/drawings" submitLabel="Create Sheet Set">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="100% Construction Documents" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
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
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Initial version label</span>
            <input
              name="initial_version_label"
              defaultValue="Rev 0"
              placeholder="Rev 0, 50% DD, 100% CD, 2026-03-15"
              className={INPUT}
            />
            <span className="text-[10px] text-[var(--text-muted)]">
              Creates a draft version under this set. Leave blank to skip and add a version later.
            </span>
          </label>
        </FormShell>
      </div>
    </>
  );
}
