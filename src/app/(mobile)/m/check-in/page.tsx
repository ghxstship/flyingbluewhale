import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CheckInScanner, type RecentScan } from "./CheckInScanner";

export const dynamic = "force-dynamic";

/**
 * /m/check-in — COMPVSS field Scan surface. Segmented Access / Asset / POS
 * scanner (live camera decode, per-mode symbologies) with a manual code
 * fallback (also the HID keyboard-wedge input for Bluetooth sleds), both
 * submitting through the queueable /api/v1/scan endpoint (offline scans queue
 * + replay). Recent activity is the org's latest `assignment_events` scan
 * rows. Ref design: app.jsx 2527-2600.
 */
export default async function CheckInPage() {
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
      <CheckInScanner
        recent={recent}
        labels={{
          eyebrow: t("m.checkin.eyebrow", { count: recent.length }, `${recent.length} Recent Scans`),
          title: t("m.checkin.title", undefined, "Scan"),
          access: t("m.checkin.access", undefined, "Access"),
          asset: t("m.checkin.asset", undefined, "Asset"),
          pos: t("m.checkin.pos", undefined, "POS"),
          qr: t("m.checkin.qr", undefined, "QR Code"),
          scanHintCamera: t("m.checkin.scanHintCamera", undefined, "Reads QR & barcodes automatically"),
          scanHintAccess: t("m.checkin.scanHintAccess", undefined, "Scan the QR on the credential"),
          enableCamera: t("m.checkin.enableCamera", undefined, "Enable Camera"),
          cameraDenied: t("m.checkin.cameraDenied", undefined, "Camera Unavailable, Use Manual Entry"),
          queuedTitle: t("m.checkin.queuedTitle", undefined, "Recorded"),
          queuedBody: t(
            "m.checkin.queuedBody",
            undefined,
            "Saved on this device. It will sync and verify when you're back online.",
          ),
          ctaAccess: t("m.checkin.ctaAccess", undefined, "Verify Credential"),
          ctaAsset: t("m.checkin.ctaAsset", undefined, "Check Out / In"),
          ctaPos: t("m.checkin.ctaPos", undefined, "Scan Product"),
          manual: t("m.checkin.manual", undefined, "Enter Code Manually"),
          manualLabel: t("m.checkin.manualLabel", undefined, "Code"),
          manualPlaceholder: t("m.checkin.manualPlaceholder", undefined, "e.g. R7-014"),
          batch: t("m.checkin.batch", undefined, "Batch Check-In"),
          scanning: t("m.checkin.scanning", undefined, "Checking…"),
          recentTitle: t("m.checkin.recentTitle", undefined, "Recent Activity"),
          recentEmpty: t("m.checkin.recentEmpty", undefined, "No Scans Yet"),
          logged: t("m.checkin.logged", undefined, "Logged"),
        }}
      />
    </div>
  );
}
