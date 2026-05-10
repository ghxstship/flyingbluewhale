import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createBroadcast } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "input-base focus-ring";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .order("name");

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="New WO broadcast"
        subtitle="Post an open work order to the vendor pool. First qualified responder accepts."
      />
      <div className="page-content max-w-xl">
        <FormShell action={createBroadcast} cancelHref="/console/procurement/wo-broadcasts" submitLabel="Save Draft">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input
              name="title"
              required
              placeholder="Need extra forklift + driver, 2 hours, downstage"
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Description</span>
            <textarea name="description" rows={3} className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Project</span>
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
              <span className={LBL}>Category</span>
              <input name="category" placeholder="logistics / security / AV / catering" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Budget ($)</span>
              <input type="number" step="any" name="budget" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Needed by</span>
              <input type="datetime-local" name="needed_by" className={INPUT} />
            </label>
          </div>
        </FormShell>
      </div>
    </>
  );
}
