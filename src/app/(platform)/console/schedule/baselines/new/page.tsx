import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createBaseline } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

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
        eyebrow="Operations"
        title="New Schedule Baseline"
        subtitle="A named snapshot of the project schedule. Add activities + dependencies after creation; activate to make this the active baseline for the project."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createBaseline} cancelHref="/console/schedule/baselines" submitLabel="Create Baseline">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="Initial 100% CD Baseline" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
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
        </FormShell>
      </div>
    </>
  );
}
