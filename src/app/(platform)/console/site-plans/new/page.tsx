import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createSitePlan } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "input-base focus-ring";
const LBL = "text-xs font-medium text-[var(--text-secondary)]";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: projects }, { data: venues }] = await Promise.all([
    supabase.from("projects").select("id, name").eq("org_id", session.orgId).order("name"),
    supabase.from("venues").select("id, name").eq("org_id", session.orgId).order("name"),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow="Venues"
        title="New Site Plan"
        subtitle="Create a sheet record. Upload the first revision next."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={createSitePlan} cancelHref="/console/site-plans" submitLabel="Create Sheet">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Sheet code<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input name="code" required placeholder="e.g. A-101 or RIG-01" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Discipline</span>
              <select name="discipline" className={INPUT} defaultValue="site">
                {[
                  "site",
                  "rigging",
                  "power",
                  "audio",
                  "video",
                  "lighting",
                  "comms",
                  "evacuation",
                  "hospitality",
                  "accessibility",
                  "sustainability",
                  "other",
                ].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required placeholder="Main floor — load-in plan" className={INPUT} />
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
              <span className={LBL}>Venue</span>
              <select name="venue_id" className={INPUT}>
                <option value="">—</option>
                {(venues ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
