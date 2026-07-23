import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { registerCapture } from "./actions";

export const dynamic = "force-dynamic";

const INPUT = "ps-input w-full";
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

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.captures.new.eyebrow", undefined, "Field")}
        title={t("console.captures.new.title", undefined, "Register Reality Capture")}
        subtitle={t(
          "console.captures.new.subtitle",
          undefined,
          "Anchors a capture from OpenSpace / DroneDeploy / StructionSite / Matterport / 360°. Heavy assets live with the partner.",
        )}
      />
      <div className="page-content max-w-2xl">
        <FormShell
          action={registerCapture}
          cancelHref="/studio/captures"
          submitLabel={t("console.captures.new.submit", undefined, "Register Capture")}
        >
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.captures.new.name", undefined, "Name")}
              <span className="ms-0.5 text-[var(--p-danger)]">*</span>
            </span>
            <input
              name="name"
              required
              placeholder={t("console.captures.new.namePlaceholder", undefined, "L3 Mech Room walk · 2026-05-24")}
              className={INPUT}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.captures.new.project", undefined, "Project")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="project_id" required className={INPUT}>
                <option value="">{t("common.selectEllipsis", undefined, "Select…")}</option>
                {((projects ?? []) as Array<{ id: string; name: string }>).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>
                {t("console.captures.new.sourceLabel", undefined, "Source")}
                <span className="ms-0.5 text-[var(--p-danger)]">*</span>
              </span>
              <select name="source" required className={INPUT} defaultValue="openspace">
                <option value="openspace">{t("console.captures.new.source.openspace", undefined, "OpenSpace")}</option>
                <option value="dronedeploy">
                  {t("console.captures.new.source.dronedeploy", undefined, "DroneDeploy")}
                </option>
                <option value="structionsite">
                  {t("console.captures.new.source.structionsite", undefined, "StructionSite")}
                </option>
                <option value="matterport">
                  {t("console.captures.new.source.matterport", undefined, "Matterport")}
                </option>
                <option value="huddle_cam">{t("console.captures.new.source.huddleCam", undefined, "HuddleCam")}</option>
                <option value="manual_360">
                  {t("console.captures.new.source.manual360", undefined, "Manual 360°")}
                </option>
                <option value="drone_photo">
                  {t("console.captures.new.source.dronePhoto", undefined, "Drone Photo")}
                </option>
                <option value="satellite">{t("console.captures.new.source.satellite", undefined, "Satellite")}</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.captures.new.captureDate", undefined, "Capture date")}</span>
              <input type="date" name="capture_date" className={INPUT} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LBL}>{t("console.captures.new.panoramas", undefined, "Panoramas (Approx)")}</span>
              <input type="number" min="0" name="panorama_count" className={INPUT} />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.captures.new.viewerUrl", undefined, "Viewer URL")}</span>
            <input name="external_url" placeholder="https://app.openspace.ai/…" className={INPUT} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>
              {t("console.captures.new.externalId", undefined, "External ID (Vendor's Job/Space ID)")}
            </span>
            <input name="external_id" className={`${INPUT} font-mono text-xs`} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LBL}>{t("console.captures.new.notes", undefined, "Notes")}</span>
            <textarea name="notes" rows={3} className={INPUT} />
          </label>
        </FormShell>
      </div>
    </>
  );
}
