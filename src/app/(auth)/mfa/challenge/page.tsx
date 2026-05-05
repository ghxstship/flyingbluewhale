import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCurrentAal, getEnrolledFactors } from "@/lib/auth/mfa";
import { AuthShell } from "@/components/auth/AuthShell";
import { MfaChallengeForm } from "./MfaChallengeForm";

export const metadata = {
  title: "Two-Factor Verification",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function MfaChallengePage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;
  const next = params.next ?? "/me";

  // Not signed in → bounce through login (which itself will route here once
  // they've completed step 1).
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(`/mfa/challenge?next=${encodeURIComponent(next)}`)}`);
  }

  // Already aal2 — nothing to do here. Fall through to the destination.
  const aal = await getCurrentAal();
  if (aal === "aal2") redirect(next);

  // No verified TOTP factor → send them to enroll instead. The middleware
  // exempts /me/security/two-factor so they can actually reach it.
  const factors = await getEnrolledFactors(session.userId);
  const verified = factors.find((f) => f.factorType === "totp" && f.status === "verified");
  if (!verified) redirect("/me/security/two-factor?enroll=1");

  return (
    <AuthShell
      title="Two-Factor Verification"
      subtitle="Enter the six-digit code from your authenticator app to continue."
    >
      <MfaChallengeForm factorId={verified.id} next={next} />
    </AuthShell>
  );
}
