import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CheckInScanner, type RecentScan } from "./CheckInScanner";

/**
 * The ONE shared Scan surface (kit 29 §C route policy, directive 2026-07-17).
 *
 * `/m/check-in` is the canonical route; `/m/scan` is an alias rendering this
 * same surface; `/m/inventory/scan` renders it preset to the Asset (inventory)
 * mode; `/m/check-in/scan/[slug]` renders it scoped to a gate slug. Before the
 * consolidation, `/m/scan` and `/m/inventory/scan` were divergent duplicates
 * (a separate QuickScan capture log and a mode-locked InventoryScanner copy).
 *
 * Segmented Access / Asset / POS scanner (live camera decode, per-mode
 * symbologies) with a manual code fallback (also the HID keyboard-wedge input
 * for Bluetooth sleds), both submitting through the queueable /api/v1/scan
 * endpoint (offline scans queue + replay). Recent activity is the org's
 * latest `assignment_events` scan rows.
 */

export type ScanSurfaceMode = "access" | "asset" | "pos";

/**
 * Normalize a `?mode=` deep-link value onto a segmented scanner mode.
 * `inventory` is the §C-sanctioned spelling for the Asset preset
 * (`/m/check-in?mode=inventory`); anything unrecognized falls back to the
 * default Access segment.
 */
export function parseScanMode(raw: string | string[] | undefined): ScanSurfaceMode | undefined {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "access" || v === "asset" || v === "pos") return v;
  if (v === "inventory") return "asset";
  return undefined;
}

export async function ScanSurface({
  initialMode,
  gateSlug,
  backHref,
  backLabel,
}: {
  /** Preset segment (deep-link or preset route); defaults to Access. */
  initialMode?: ScanSurfaceMode;
  /** Gate / zone slug context (`/m/check-in/scan/[slug]`). */
  gateSlug?: string;
  /** Optional back link (the Inventory preset points back to /m/inventory). */
  backHref?: string;
  backLabel?: string;
}) {
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

  const recent: RecentScan[] = (
    (data ?? []) as Array<{
      id: string;
      result: string | null;
      body: string | null;
      at: string | null;
    }>
  ).map((r) => ({
    id: r.id,
    result: r.result ?? "accepted",
    body: r.body,
    at: r.at ? fmt.relative(r.at) : "",
  }));

  return (
    <div className="screen screen-anim">
      <CheckInScanner
        recent={recent}
        gateSlug={gateSlug}
        initialMode={initialMode}
        backHref={backHref}
        backLabel={backLabel}
        labels={{
          eyebrow: gateSlug
            ? t("m.checkin.gate.eyebrow", { slug: gateSlug }, `Gate · ${gateSlug}`)
            : t("m.checkin.eyebrow", { count: recent.length }, `${recent.length} Recent Scans`),
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
