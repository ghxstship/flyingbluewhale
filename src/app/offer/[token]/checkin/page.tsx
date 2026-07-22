import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { recordCheckIn } from "@/lib/db/onboarding";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const { t } = await getRequestT();
  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;
  // For QR scans we accept the token without a session — recipient is at the
  // venue with their letter in hand. Lookup uses the token + the recipient's
  // access code if cookie present, else falls back to a public read.
  const letter = code ? await getOfferLetterByToken(token, code) : null;
  if (!letter) {
    return (
      <div className="space-y-4">
        <h1>{t("legal.offerCheckin.title", undefined, "Check-in")}</h1>
        <p>
          {t("legal.offerCheckin.lockedPrefix", undefined, "Open your engagement letter first to unlock check-in —")}{" "}
          <Link href={`/offer/${token}`} className="underline">
            {t("legal.offerCheckin.returnToLetter", undefined, "return to letter")}
          </Link>
          .
        </p>
      </div>
    );
  }

  const h = await headers();
  const ip = h.get("x-real-ip") || (h.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
  const userAgent = h.get("user-agent");
  await recordCheckIn(letter.id, ip, userAgent);

  return (
    <div className="space-y-6">
      <header>
        <div className="eyebrow">
          {t("legal.offerCheckin.dayOneEyebrow", undefined, "Day-1 Check-in")}
        </div>
        <h1>
          {t(
            "legal.offerCheckin.welcome",
            { name: letter.recipient_name.split(" ")[0]! },
            `Welcome to Salvage City, ${letter.recipient_name.split(" ")[0]}.`,
          )}
        </h1>
      </header>
      <div className="border-s-success bg-success-soft border-s-4 p-4">
        <p className="text-sm font-medium">{t("legal.offerCheckin.checkedIn", undefined, "You're checked in.")}</p>
        <p className="text-xs text-(--p-text-2)">
          {t(
            "legal.offerCheckin.checkedInBody",
            undefined,
            "Production sees this immediately. Head to the production trailer for credentials and the safety briefing.",
          )}
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <p>
          <strong>{t("legal.offerCheckin.nextLabel", undefined, "Next:")}</strong>{" "}
          {t(
            "legal.offerCheckin.nextBody",
            undefined,
            "Pick up your credentials at the production trailer. Sign the safety briefing attestation and pick up your radio if your role requires one.",
          )}
        </p>
        <p>
          <strong>{t("legal.offerCheckin.directorOnCall", undefined, "Project Director on call:")}</strong> Sarah Fry ·
          (615) 708-3676
        </p>
      </div>
      <div className="text-xs text-(--p-text-2)">
        <Link href={`/offer/${token}/onboarding`} className="underline">
          {t("legal.offerCheckin.seeOnboarding", undefined, "See your onboarding tracker")}
        </Link>{" "}
        ·{" "}
        <Link href={`/offer/${token}`} className="underline">
          {t("legal.offerCheckin.engagementLetter", undefined, "Engagement letter")}
        </Link>
      </div>
    </div>
  );
}
