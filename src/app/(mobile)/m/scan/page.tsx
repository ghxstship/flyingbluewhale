import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { QuickScan } from "./QuickScan";

export const dynamic = "force-dynamic";

/**
 * /m/scan — COMPVSS quick-scan capture surface (kit v7 §3). Mounts the
 * <QuickScan> island: <ScanCapture> (reticle + manual fallback + session log)
 * with `onCapture` wired to the queueable /api/v1/scan endpoint — every
 * capture is journaled through the assignments domain (or durably queued
 * offline) and the log row shows the verdict. Distinct from /m/check-in (the
 * mode-segmented gate scanner) — this is the lightweight generic surface.
 */
export default async function ScanPage() {
  await requireSession();
  const { t } = await getRequestT();

  return (
    <div className="screen screen-anim">
      <header className="mb-4">
        <p className="font-mono text-xs tracking-[0.12em] text-[var(--p-text-3)] uppercase">
          {t("m.scan.eyebrow", undefined, "Quick Scan")}
        </p>
        <h1 className="text-xl font-bold tracking-tight text-[var(--p-text-1)]">
          {t("m.scan.title", undefined, "Scan a code")}
        </h1>
      </header>
      <QuickScan
        labels={{
          hint: t("m.scan.hint", undefined, "Point the camera at a QR or barcode — it reads automatically."),
          manualToggle: t("m.scan.manualToggle", undefined, "Enter code manually"),
          manualLabel: t("m.scan.manualLabel", undefined, "Code"),
          manualPlaceholder: t("m.scan.manualPlaceholder", undefined, "e.g. R7-014"),
          manualSubmit: t("m.scan.manualSubmit", undefined, "Capture"),
          recentTitle: t("m.scan.recentTitle", undefined, "Captured this session"),
          recentEmpty: t("m.scan.recentEmpty", undefined, "No codes captured yet"),
          results: {
            accepted: t("m.scan.result.accepted", undefined, "Accepted"),
            asset: t("m.scan.result.asset", undefined, "Asset found"),
            duplicate: t("m.scan.result.duplicate", undefined, "Already scanned"),
            expired: t("m.scan.result.expired", undefined, "Expired"),
            voided: t("m.scan.result.voided", undefined, "Voided"),
            not_found: t("m.scan.result.notFound", undefined, "Not found"),
          },
          misread: t("m.scan.result.misread", undefined, "Misread barcode, scan again"),
          queued: t("m.scan.result.queued", undefined, "Queued, syncs when online"),
          failed: t("m.scan.result.failed", undefined, "Not recorded"),
        }}
      />
    </div>
  );
}
