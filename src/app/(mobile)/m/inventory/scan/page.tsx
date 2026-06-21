import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { InventoryScanner, type RecentScan } from "./InventoryScanner";

export const dynamic = "force-dynamic";

/**
 * /m/inventory/scan — COMPVSS asset check-out / check-in scanner. Kit
 * `.scanframe` reticle + manual asset-tag entry, resolving codes through the
 * surviving `scanCode` action (which calls `scanAssignment`). Recent activity
 * is the org's latest `assignment_events` scan rows.
 */
export default async function InventoryScanPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("assignment_events")
    .select("id, result, body, at")
    .eq("org_id", session.orgId)
    .eq("event_kind", "scan")
    .order("at", { ascending: false })
    .limit(8);

  const recent: RecentScan[] = ((data ?? []) as Array<{
    id: string;
    result: string | null;
    body: string | null;
    at: string | null;
  }>).map((r) => ({
    id: r.id,
    result: r.result ?? "accepted",
    body: r.body,
    at: r.at ? fmt.relative(r.at) : "",
  }));

  return (
    <div className="screen screen-anim">
      <InventoryScanner
        recent={recent}
        labels={{
          eyebrow: t("m.inventoryScan.eyebrow", undefined, "Asset Tag"),
          title: t("m.inventoryScan.title", undefined, "Scan To Check Out / In"),
          hint: t("m.inventoryScan.hint", undefined, "Point at an asset tag QR — reads automatically."),
          back: t("m.inventoryScan.back", undefined, "Assets"),
          enableCamera: t("m.inventoryScan.enableCamera", undefined, "Enable Camera"),
          cameraDenied: t("m.inventoryScan.cameraDenied", undefined, "Camera Unavailable — Use Manual Entry"),
          manualLabel: t("m.inventoryScan.manualLabel", undefined, "Asset Tag"),
          manualPlaceholder: t("m.inventoryScan.manualPlaceholder", undefined, "e.g. R7-014"),
          cta: t("m.inventoryScan.cta", undefined, "Resolve Tag"),
          scanning: t("m.inventoryScan.scanning", undefined, "Checking…"),
          recentTitle: t("m.inventoryScan.recentTitle", undefined, "Recent Activity"),
          recentEmpty: t("m.inventoryScan.recentEmpty", undefined, "No Scans Yet"),
          logged: t("m.inventoryScan.logged", undefined, "Logged"),
        }}
      />
    </div>
  );
}
