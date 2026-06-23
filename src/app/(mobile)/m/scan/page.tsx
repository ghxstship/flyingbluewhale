import { requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { ScanCapture } from "@/components/scanners/ScanCapture";

export const dynamic = "force-dynamic";

/**
 * /m/scan — COMPVSS quick-scan capture surface (kit v7 §3). Mounts the new
 * <ScanCapture> wrapper over the CameraScanner primitive: a reticle, a manual
 * code fallback, and an in-session capture log. Distinct from /m/check-in (the
 * mode-segmented gate scanner that resolves codes through the assignments
 * domain) — this is the lightweight, generic decode surface.
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
      <ScanCapture
        labels={{
          hint: t("m.scan.hint", undefined, "Point the camera at a QR or barcode — it reads automatically."),
          manualToggle: t("m.scan.manualToggle", undefined, "Enter code manually"),
          manualLabel: t("m.scan.manualLabel", undefined, "Code"),
          manualPlaceholder: t("m.scan.manualPlaceholder", undefined, "e.g. R7-014"),
          manualSubmit: t("m.scan.manualSubmit", undefined, "Capture"),
          recentTitle: t("m.scan.recentTitle", undefined, "Captured this session"),
          recentEmpty: t("m.scan.recentEmpty", undefined, "No codes captured yet"),
        }}
      />
    </div>
  );
}
