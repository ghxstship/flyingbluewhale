import Link from "next/link";
import { CheckInScanner } from "../CheckInScanner";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ManualLookupPage() {
  const { t } = await getRequestT();
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.checkIn.manual.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.checkIn.manual.title", undefined, "Manual Lookup")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t("m.checkIn.manual.subtitle", undefined, "Type a ticket code when the QR is unreadable")}
      </p>
      <div className="mt-6">
        <CheckInScanner />
      </div>
      <div className="mt-4 text-center">
        <Link href="/m/check-in" className="text-xs text-[var(--org-primary)]">
          {t("m.checkIn.manual.backToScanner", undefined, "Back to Scanner →")}
        </Link>
      </div>
    </div>
  );
}
