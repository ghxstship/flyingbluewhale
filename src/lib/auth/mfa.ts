import "server-only";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import type { PlatformRole } from "@/lib/supabase/types";

// ────────────────────────────────────────────────────────────────────
// MFA helpers — server-only.
//
// We sit on top of Supabase Auth's native MFA primitives:
//   * `supabase.auth.mfa.enroll/challenge/verify/unenroll`   (user session)
//   * `supabase.auth.admin.mfa.listFactors({ userId })`      (service role)
//   * `supabase.auth.mfa.getAuthenticatorAssuranceLevel()`   (current session)
//
// The org-level "require MFA for these roles" knob lives in
// `orgs.require_2fa_for jsonb` (added in 20260504000024). Empty object means
// MFA is optional for everyone in that org.
// ────────────────────────────────────────────────────────────────────

export type MfaFactor = {
  id: string;
  factorType: "totp" | "phone" | "webauthn";
  status: "verified" | "unverified";
  friendlyName: string | null;
  createdAt: string;
};

/**
 * List ALL of a user's MFA factors (verified + unverified). Requires the
 * service-role client because Supabase only exposes self-listing through the
 * authenticated session, which we may not have when this is called from the
 * security page server component (we do, but we keep the API stable).
 *
 * Returns an empty array when the service client isn't configured — the
 * security page should show "MFA unavailable" rather than crash.
 */
export async function getEnrolledFactors(userId: string): Promise<MfaFactor[]> {
  if (!isServiceClientAvailable()) return [];
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.mfa.listFactors({ userId });
  if (error || !data) return [];
  return (data.factors ?? []).map((f) => ({
    id: f.id,
    // Supabase types factorType as `string`; narrow to our union.
    factorType: f.factor_type as MfaFactor["factorType"],
    status: f.status as MfaFactor["status"],
    friendlyName: f.friendly_name ?? null,
    createdAt: f.created_at,
  }));
}

/**
 * Current session's authenticator assurance level. `aal1` = single factor
 * (password / passkey / magic-link). `aal2` = two factors satisfied this
 * session (e.g. password then TOTP). Returns `aal1` when offline / not signed
 * in — callers should pair this with a session check.
 */
export async function getCurrentAal(): Promise<"aal1" | "aal2"> {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const level = data?.currentLevel;
  return level === "aal2" ? "aal2" : "aal1";
}

/**
 * Whether the org requires MFA for the given platform role. Returns false on
 * any read failure so a Supabase outage doesn't lock people out of their
 * accounts.
 */
export async function requireMfaFor(orgId: string, role: PlatformRole): Promise<boolean> {
  if (!orgId) return false;
  try {
    const supabase = await createClient();
    // `require_2fa_for` lives outside the generated database.types.ts (the
    // column is added in 20260504000024 and types haven't been regenerated
    // yet). Cast the builder so the typed select doesn't reject the column.
    const result = await (
      supabase.from("orgs") as unknown as {
        select: (cols: string) => {
          eq: (
            col: string,
            val: string,
          ) => {
            maybeSingle: () => Promise<{
              data: { require_2fa_for: Record<string, boolean> | null } | null;
              error: { message: string } | null;
            }>;
          };
        };
      }
    )
      .select("require_2fa_for")
      .eq("id", orgId)
      .maybeSingle();
    if (result.error || !result.data) return false;
    const map = result.data.require_2fa_for ?? {};
    return map[role] === true;
  } catch {
    return false;
  }
}

/**
 * Combined check: returns true if the user is allowed to access org resources
 * under the org's current MFA policy. False means the caller should bounce the
 * user to `/mfa/challenge`.
 *
 *   ok if:
 *     - org doesn't require MFA for this role, OR
 *     - the user has a verified TOTP factor AND the current session aal is aal2
 *
 * Note: the user having an enrolled factor isn't enough — they have to have
 * actually challenged it during this session. Otherwise the session is
 * single-factor and we must elevate it.
 */
export async function isMfaSatisfied(userId: string, orgId: string, role: PlatformRole): Promise<boolean> {
  const required = await requireMfaFor(orgId, role);
  if (!required) return true;

  const aal = await getCurrentAal();
  if (aal === "aal2") return true;

  // Has a verified factor enrolled? If not we still consider MFA "unsatisfied"
  // — the user needs to enroll first. The middleware redirects them to
  // /me/security/two-factor in that case (see proxy.ts), not /mfa/challenge.
  const factors = await getEnrolledFactors(userId);
  void factors; // tracked for future "must-enroll" branch in middleware
  return false;
}

/**
 * Cheap variant for the middleware hot path — skips the service-role round
 * trip when we already know the org doesn't require MFA. Returns the policy
 * decision and the current AAL so the caller can decide redirect target
 * (challenge vs enroll) without re-querying.
 */
export async function evaluateMfaForRequest(
  orgId: string,
  role: PlatformRole,
): Promise<{ required: boolean; aal: "aal1" | "aal2" }> {
  const required = await requireMfaFor(orgId, role);
  if (!required) return { required: false, aal: "aal1" };
  const aal = await getCurrentAal();
  return { required: true, aal };
}
