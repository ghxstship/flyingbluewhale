import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createMeeting } from "./actions";

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
      <ModuleHeader eyebrow="Coordination" title="New Meeting" />
      <div className="page-content max-w-2xl">
        <FormShell action={createMeeting} cancelHref="/console/meetings" submitLabel="Schedule Meeting">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Title<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="title" required placeholder="OAC Weekly #14" className={INPUT} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Project</span>
              <select name="project_id" className={INPUT}>
                <option value="">—</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Kind</span>
              <select name="kind" className={INPUT} defaultValue="other">
                <option value="kickoff">Kickoff</option>
                <option value="owner_architect_contractor">Owner-Architect-Contractor (OAC)</option>
                <option value="sub_meeting">Sub Meeting</option>
                <option value="safety">Safety</option>
                <option value="punch_walk">Punch Walk</option>
                <option value="design_review">Design Review</option>
                <option value="progress">Progress</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                Starts at<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <input type="datetime-local" name="starts_at" required className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Ends at</span>
              <input type="datetime-local" name="ends_at" className={INPUT} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Location</span>
              <input name="location_name" placeholder="Site office, Zoom, etc." className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Meeting URL</span>
              <input name="meeting_url" placeholder="https://…" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Agenda (Markdown)</span>
            <textarea name="agenda_md" rows={5} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
