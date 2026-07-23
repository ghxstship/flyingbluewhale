import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";
import { listCaptureFences } from "@/lib/db/venue-geofences";
import type { CaptureProject } from "@/lib/mobile/geofence-file";
import { CaptureScreen } from "./CaptureScreen";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Capture (T1-5) — server half. Fetches the org's active venue
 * geofences (with their resolved candidate projects) plus the active-project
 * list for the manual-picker fallback, then hands everything to the client
 * screen. The GPS match itself runs client-side — the fix only exists on
 * the device, and shipping the fences down means matching keeps working
 * offline from the last page load.
 */
export default async function CapturePage() {
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();

  const [fences, { data: projRows }] = await Promise.all([
    listCaptureFences(session.orgId),
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .eq("project_state", "active")
      .is("deleted_at", null)
      .order("start_date", { ascending: false, nullsFirst: false })
      .limit(100),
  ]);

  const projects: CaptureProject[] = (projRows ?? []).map((p) => ({
    id: p.id,
    name: p.name ?? t("m.capture.untitledProject", undefined, "Untitled Project"),
  }));

  return <CaptureScreen fences={fences} projects={projects} />;
}
