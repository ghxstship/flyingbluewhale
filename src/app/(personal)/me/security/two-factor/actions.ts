"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { emitAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";

// Server actions for /me/security/two-factor.
//
// Conventions per CLAUDE.md:
//   * `"use server"` actions live next to the page that calls them
//   * Each action returns `State = { error?: string } | null` so it plugs
//     directly into `useActionState` on the client.
//
// Recovery codes:
//   We generate 10 single-use recovery codes after a TOTP factor is verified
//   (or on demand via `regenerateRecoveryCodesAction`). Codes are sha256'd
//   before storage; plaintext is shown ONCE and returned in the action result
//   so the client can offer "Download codes". Re-generating discards the old
//   set entirely, matching every popular MFA implementation (Stripe, GitHub).

export type State = { error?: string } | null;

export type EnrollResult =
  | { error: string }
  | { ok: true; factorId: string; secret: string; qrSvg: string; uri: string };

export type VerifyResult = { error: string } | { ok: true; recoveryCodes: string[] };

export type RegenerateResult = { error: string } | { ok: true; recoveryCodes: string[] };

// `mfa_recovery_codes` is added by 20260504000024 — types haven't been
// regenerated yet, so we type the relevant slice of the client locally and
// cast at the call site (mirrors the push_subscriptions pattern).
type RecoveryCodesClient = {
  from: (table: "mfa_recovery_codes") => {
    delete: () => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>;
    };
    insert: (rows: Array<{ user_id: string; code_hash: string }>) => Promise<{ error: { message: string } | null }>;
  };
};

const RECOVERY_CODE_COUNT = 10;

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

/**
 * Generate `count` recovery codes. Each code is 16 hex chars (64 bits) split
 * with a hyphen for readability — enough entropy that brute-forcing is
 * infeasible against the unauthenticated rate-limit, and short enough to type.
 */
function generateRecoveryCodes(count: number): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(8).toString("hex"); // 16 hex chars
    return `${raw.slice(0, 8)}-${raw.slice(8)}`;
  });
}

/**
 * Render a TOTP otpauth URI as an inline-safe SVG. Using `qrcode` (already a
 * dep) so the QR is generated server-side and the markup is stable across
 * SSR + client. We return a `data:` URI as the simplest universal embed.
 */
async function renderQrSvg(uri: string): Promise<string> {
  // Dynamic import keeps the qrcode bundle out of the rest of the action graph.
  const QRCode = await import("qrcode");
  return QRCode.toString(uri, { type: "svg", margin: 1, width: 240 });
}

// ────────────────────────────────────────────────────────────────────
// Enrollment — step 1: enroll a TOTP factor and return QR + secret
// ────────────────────────────────────────────────────────────────────

export async function enrollMfaAction(): Promise<EnrollResult> {
  if (!hasSupabase) return { error: "Supabase is not configured." };
  const session = await getSession();
  if (!session) return { error: "Sign in to enroll a second factor." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Authenticator (${new Date().toISOString().slice(0, 10)})`,
  });
  if (error || !data) {
    return { error: error?.message ?? "Couldn't start enrollment" };
  }

  const totp = data.totp;
  if (!totp) return { error: "Supabase did not return TOTP details" };

  let qrSvg = "";
  try {
    qrSvg = await renderQrSvg(totp.uri);
  } catch {
    // Fall back to text-only display in the client. The secret is the
    // canonical input — most authenticator apps accept a manual secret entry.
    qrSvg = "";
  }

  return { ok: true, factorId: data.id, secret: totp.secret, qrSvg, uri: totp.uri };
}

// ────────────────────────────────────────────────────────────────────
// Enrollment — step 2: verify the 6-digit code, generate recovery codes
// ────────────────────────────────────────────────────────────────────

export async function verifyEnrollmentAction(factorId: string, code: string): Promise<VerifyResult> {
  if (!hasSupabase) return { error: "Supabase is not configured." };
  if (!factorId) return { error: "Missing factor — restart enrollment." };
  if (!/^\d{6}$/.test(code.trim())) return { error: "Enter the 6-digit code from your authenticator app." };

  const session = await getSession();
  if (!session) return { error: "Sign in to verify your second factor." };

  const supabase = await createClient();
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) {
    return { error: challenge.error?.message ?? "Couldn't issue MFA challenge" };
  }
  const verify = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.data.id,
    code: code.trim(),
  });
  if (verify.error) {
    return { error: verify.error.message };
  }

  // Generate recovery codes — only stored hashed.
  const codes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  if (isServiceClientAvailable()) {
    const admin = createServiceClient() as unknown as RecoveryCodesClient;
    // Wipe any prior codes (e.g. if the user re-enrolled after unenroll).
    await admin.from("mfa_recovery_codes").delete().eq("user_id", session.userId);
    await admin
      .from("mfa_recovery_codes")
      .insert(codes.map((c) => ({ user_id: session.userId, code_hash: sha256(c) })));
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.mfa.enabled",
    targetTable: "auth.mfa_factors",
    targetId: factorId,
    metadata: { factorType: "totp" },
  });

  revalidatePath("/me/security");
  revalidatePath("/me/security/two-factor");

  return { ok: true, recoveryCodes: codes };
}

// ────────────────────────────────────────────────────────────────────
// Unenroll — remove a factor
// ────────────────────────────────────────────────────────────────────

export async function unenrollMfaAction(factorId: string): Promise<State> {
  if (!hasSupabase) return { error: "Supabase is not configured." };
  if (!factorId) return { error: "Missing factor id" };

  const session = await getSession();
  if (!session) return { error: "Sign in to remove a second factor." };

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) return { error: error.message };

  // Drop recovery codes once the last TOTP factor is gone. Done after the
  // unenroll succeeds so a partial failure leaves the codes in place.
  if (isServiceClientAvailable()) {
    const admin = createServiceClient() as unknown as RecoveryCodesClient;
    await admin.from("mfa_recovery_codes").delete().eq("user_id", session.userId);
  }

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "auth.mfa.disabled",
    targetTable: "auth.mfa_factors",
    targetId: factorId,
  });

  revalidatePath("/me/security");
  revalidatePath("/me/security/two-factor");
  return null;
}

// ────────────────────────────────────────────────────────────────────
// Regenerate recovery codes
// ────────────────────────────────────────────────────────────────────

export async function regenerateRecoveryCodesAction(): Promise<RegenerateResult> {
  if (!hasSupabase) return { error: "Supabase is not configured." };
  const session = await getSession();
  if (!session) return { error: "Sign in to regenerate recovery codes." };

  if (!isServiceClientAvailable()) {
    return { error: "Recovery codes require the service-role client. Set SUPABASE_SERVICE_ROLE_KEY." };
  }

  const codes = generateRecoveryCodes(RECOVERY_CODE_COUNT);
  const admin = createServiceClient() as unknown as RecoveryCodesClient;
  await admin.from("mfa_recovery_codes").delete().eq("user_id", session.userId);
  const { error } = await admin
    .from("mfa_recovery_codes")
    .insert(codes.map((c) => ({ user_id: session.userId, code_hash: sha256(c) })));
  if (error) return { error: error.message };

  return { ok: true, recoveryCodes: codes };
}
