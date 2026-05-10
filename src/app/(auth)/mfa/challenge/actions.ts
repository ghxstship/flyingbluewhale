"use server";

import { createHash } from "node:crypto";
import { redirect } from "next/navigation";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getEnrolledFactors } from "@/lib/auth/mfa";
import type { FormState } from "@/components/FormShell";

// `mfa_recovery_codes` isn't in the generated Database type yet — narrow
// just the slice we touch (mirrors the push_subscriptions pattern).
type RecoveryCodesClient = {
  from: (table: "mfa_recovery_codes") => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => {
        is: (
          col: string,
          val: null,
        ) => Promise<{
          data: Array<{ id: string; code_hash: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };
    update: (patch: { used_at: string }) => {
      eq: (
        col: string,
        val: string,
      ) => {
        eq: (
          col: string,
          val: string,
        ) => {
          is: (
            col: string,
            val: null,
          ) => {
            select: (cols: string) => Promise<{
              data: Array<{ id: string }> | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };
};

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function safeNext(input: string | null): string {
  if (!input) return "/me";
  // Open-redirect guard: only allow same-origin paths.
  if (!input.startsWith("/")) return "/me";
  if (input.startsWith("//")) return "/me";
  return input;
}

/**
 * Handle the second-step challenge during login. Two paths:
 *
 *   1. 6-digit TOTP code → `supabase.auth.mfa.challenge` then `verify`. On
 *      success the session is upgraded to aal2.
 *   2. Recovery code (hyphenated 16 hex chars) → look up by sha256(plaintext),
 *      mark used. NOTE: Supabase doesn't natively elevate AAL via recovery
 *      codes. We mark the code consumed but the session stays at aal1. This
 *      is acceptable as a *fallback* unlock path — users can sign in, then
 *      should immediately rotate or remove the lost factor on
 *      /me/security/two-factor. The middleware checks both "aal2" and
 *      "user has a pending recovery-bypass cookie" — see proxy.ts.
 *
 *      To keep the implementation simple and avoid forging session JWTs we do
 *      NOT issue the bypass cookie here today; the recovery path simply
 *      redirects the user to /me/security/two-factor where the org-required
 *      gate is bypassed (the user can self-rescue by enrolling a fresh
 *      factor). This is the pragmatic minimum — primary flow is TOTP.
 */
export async function verifyChallengeAction(_: FormState, fd: FormData): Promise<FormState> {
  if (!hasSupabase) return { error: "Supabase is not configured." };

  const factorId = String(fd.get("factorId") ?? "").trim();
  const codeRaw = String(fd.get("code") ?? "").trim();
  const next = safeNext(String(fd.get("next") ?? "") || null);

  if (!codeRaw) return { error: "Enter your authenticator code or a recovery code." };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: "Sign in first, then enter your code." };
  }

  // Determine if this looks like a TOTP code (6 digits) or a recovery code
  // (8-hex-8-hex with optional hyphen).
  const totpMatch = /^\d{6}$/.test(codeRaw);
  const recoveryMatch = /^[a-f0-9]{8}-?[a-f0-9]{8}$/i.test(codeRaw);

  if (totpMatch) {
    // Resolve a verified TOTP factor for this user. The form supplies one
    // when known; otherwise we look it up.
    let resolvedFactorId = factorId;
    if (!resolvedFactorId) {
      const factors = await getEnrolledFactors(userData.user.id);
      const verified = factors.find((f) => f.factorType === "totp" && f.status === "verified");
      if (!verified) return { error: "No active authenticator on file." };
      resolvedFactorId = verified.id;
    }
    const challenge = await supabase.auth.mfa.challenge({ factorId: resolvedFactorId });
    if (challenge.error || !challenge.data) {
      return { error: challenge.error?.message ?? "Couldn't issue MFA challenge" };
    }
    const verify = await supabase.auth.mfa.verify({
      factorId: resolvedFactorId,
      challengeId: challenge.data.id,
      code: codeRaw,
    });
    if (verify.error) return { error: "That code didn't match. Try again." };
    redirect(next);
  }

  if (recoveryMatch) {
    if (!isServiceClientAvailable()) {
      return { error: "Recovery codes aren't available — contact your admin." };
    }
    const normalized = codeRaw.toLowerCase().replace(/-/g, "");
    const reformatted = `${normalized.slice(0, 8)}-${normalized.slice(8)}`;
    const candidates = [normalized, reformatted];
    const admin = createServiceClient() as unknown as RecoveryCodesClient;
    const { data, error } = await admin
      .from("mfa_recovery_codes")
      .select("id, code_hash")
      .eq("user_id", userData.user.id)
      .is("used_at", null);
    if (error || !data) return { error: "Couldn't verify recovery code." };

    const hit = data.find((row) => candidates.some((c) => sha256(c) === row.code_hash));
    if (!hit) return { error: "That recovery code is invalid or already used." };

    // Conditional consume — only land the used_at stamp if the row is
    // still owned by THIS user AND still unused. Service-role bypasses
    // RLS so we have to belt-and-suspenders both filters here. Without
    // them, a race between two recovery-code attempts (or a stale form
    // re-submitted after the user already burned the code) could
    // re-stamp the row with a newer timestamp, hiding the original
    // consumption from the audit trail.
    const { data: claimed, error: claimErr } = await admin
      .from("mfa_recovery_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", hit.id)
      .eq("user_id", userData.user.id)
      .is("used_at", null)
      .select("id");
    if (claimErr) return { error: "Couldn't verify recovery code." };
    if (!claimed || claimed.length === 0) {
      return { error: "That recovery code is invalid or already used." };
    }

    // Limitation: we cannot elevate the session to aal2 from server-side
    // without minting a custom JWT. Instead we land the user on the security
    // page so they can re-enroll. Middleware exempts /me/security/two-factor
    // from the MFA-required redirect.
    redirect("/me/security/two-factor?recovery=1");
  }

  return { error: "Enter the 6-digit code from your app, or a recovery code." };
}
