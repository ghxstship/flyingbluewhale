export const dynamic = "force-dynamic";

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

/**
 * Sanitize the post-MFA redirect target to defeat open-redirect.
 * Only same-origin relative paths are accepted; everything else
 * (full URLs, protocol-relative `//evil.com`, missing leading
 * slash) collapses to `/me`. Mirrors the action-side guard in
 * `actions.ts#safeNext`.
 */
function safeNext(input: string | null | undefined): string {
  if (!input) return "/me";
  if (!input.startsWith("/")) return "/me";
  if (input.startsWith("//")) return "/me";
  return input;
}

export default async function MfaChallengePage({ searchParams }: Props) {
  const session = await getSession();
  const params = await searchParams;
  const next = safeNext(params.next);

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
