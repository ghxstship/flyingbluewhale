import { CheckInScanner } from "../../CheckInScanner";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ScanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">
        {t("m.checkIn.scan.eyebrow", { slug }, `Scanning · ${slug}`)}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.checkIn.scan.title", undefined, "QR scan")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {t(
          "m.checkIn.scan.hint",
          undefined,
          "Paste the scanned code below — camera integration drops on mobile clients.",
        )}
      </p>
      <div className="mt-6">
        <CheckInScanner />
      </div>
    </div>
  );
}
