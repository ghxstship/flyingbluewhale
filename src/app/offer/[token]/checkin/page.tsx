import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasSupabase } from "@/lib/env";
import { getOfferLetterByToken } from "@/lib/offer-letters/queries";
import { recordCheckIn } from "@/lib/db/onboarding";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CheckInPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) notFound();
  const c = await cookies();
  const code = c.get(`offer_${token}`)?.value;
  // For QR scans we accept the token without a session — recipient is at the
  // venue with their letter in hand. Lookup uses the token + the recipient's
  // access code if cookie present, else falls back to a public read.
  const letter = code ? await getOfferLetterByToken(token, code) : null;
  if (!letter) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Check-in</h1>
        <p>
          Open your engagement letter first to unlock check-in —{" "}
          <Link href={`/offer/${token}`} className="underline">
            return to letter
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
        <div className="text-xs tracking-widest text-(--text-muted) uppercase">Day-1 Check-in</div>
        <h1 className="text-3xl font-semibold">Welcome to Salvage City, {letter.recipient_name.split(" ")[0]}.</h1>
      </header>
      <div className="border-s-success bg-success-soft border-s-4 p-4">
        <p className="text-sm font-medium">You're checked in.</p>
        <p className="text-xs text-(--text-secondary)">
          Production sees this immediately. Head to the production trailer for credentials and the safety briefing.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        <p>
          <strong>Next:</strong> Pick up your credentials at the production trailer. Sign the safety briefing
          attestation and pick up your radio if your role requires one.
        </p>
        <p>
          <strong>Project Director on call:</strong> Sarah Fry · (615) 708-3676
        </p>
      </div>
      <div className="text-xs text-(--text-muted)">
        <Link href={`/offer/${token}/onboarding`} className="underline">
          See your onboarding tracker
        </Link>{" "}
        ·{" "}
        <Link href={`/offer/${token}`} className="underline">
          Engagement letter
        </Link>
      </div>
    </div>
  );
}
