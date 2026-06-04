import { getRequestT } from "@/lib/i18n/request";
import { GateScanner } from "./GateScanner";

export const dynamic = "force-dynamic";

export default async function GateScanPage() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">{t("m.gate.scan.eyebrow", undefined, "Gate")}</div>
      <h1 className="text-display mt-2 text-3xl">{t("m.gate.scan.title", undefined, "Scan Accreditation")}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          "m.gate.scan.description",
          undefined,
          "Scan a card barcode to grant or deny access. Decisions are recorded server-side with the scanner identity.",
        )}
      </p>
      <div className="mt-6">
        <GateScanner />
      </div>
    </div>
  );
}
