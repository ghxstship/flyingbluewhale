import { getRequestT } from "@/lib/i18n/request";
import { CheckInScanner } from "./CheckInScanner";

export const dynamic = "force-dynamic";

export default async function CheckInHome() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-label text-[var(--brand-color)]">{t("m.checkIn.eyebrow", undefined, "Field Check-In")}</div>
      <h1 className="text-display mt-2 text-3xl">{t("m.checkIn.title", undefined, "Scan Tickets")}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        {t(
          "m.checkIn.description",
          undefined,
          "Camera-based QR/barcode scanning. Network-only — must be online to validate.",
        )}
      </p>
      <div className="mt-6">
        <CheckInScanner />
      </div>
    </div>
  );
}
