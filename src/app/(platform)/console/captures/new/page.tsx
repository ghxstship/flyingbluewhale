import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { registerCapture } from "./actions";

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
        eyebrow="Field"
        title="Register Reality Capture"
        subtitle="Anchors a capture from OpenSpace / DroneDeploy / StructionSite / Matterport / 360°. Heavy assets live with the partner."
      />
      <div className="page-content max-w-2xl">
        <FormShell action={registerCapture} cancelHref="/console/captures" submitLabel="Register Capture">
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              Name<span className="ms-0.5 text-[var(--color-error)]">*</span>
            </span>
            <input name="name" required placeholder="L3 Mech Room walk — 2026-05-24" className={INPUT} />
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
              <span className={LBL}>
                Source<span className="ms-0.5 text-[var(--color-error)]">*</span>
              </span>
              <select name="source" required className={INPUT} defaultValue="openspace">
                <option value="openspace">OpenSpace</option>
                <option value="dronedeploy">DroneDeploy</option>
                <option value="structionsite">StructionSite</option>
                <option value="matterport">Matterport</option>
                <option value="huddle_cam">HuddleCam</option>
                <option value="manual_360">Manual 360°</option>
                <option value="drone_photo">Drone Photo</option>
                <option value="satellite">Satellite</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Capture date</span>
              <input type="date" name="capture_date" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>Panoramas (approx)</span>
              <input type="number" min="0" name="panorama_count" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Viewer URL</span>
            <input name="external_url" placeholder="https://app.openspace.ai/…" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>External ID (vendor's job/space ID)</span>
            <input name="external_id" className={`${INPUT} font-mono text-xs`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>Notes</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
