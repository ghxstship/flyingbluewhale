import { NextResponse, type NextRequest } from "next/server";
import { verifyRegistrationResponse, type RegistrationResponseJSON } from "@simplewebauthn/server";
import { z } from "zod";
import { apiError, apiOk, parseJson } from "@/lib/api";
import { emitAudit } from "@/lib/audit";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn";

const Schema = z.object({
  response: z.unknown(),
  deviceName: z.string().max(80).optional(),
});

export async function POST(req: NextRequest) {
  const parsed = await parseJson(req, Schema);
  if (parsed instanceof NextResponse) return parsed;

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in to register a passkey");

  const { rpID, origin } = getRpConfig();

  const { data: challengeRow } = await supabase
    .from("webauthn_challenges")
    .select("id, challenge")
    .eq("user_id", u.user.id)
    .eq("type", "registration")
    .eq("consumed", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) return apiError("bad_request", "Registration challenge expired or missing");

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: parsed.response as RegistrationResponseJSON,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });
  } catch (e) {
    return apiError("bad_request", e instanceof Error ? e.message : "Verification failed");
  }

  if (!verification.verified || !verification.registrationInfo) {
    return apiError("bad_request", "Couldn't verify passkey");
  }

  const info = verification.registrationInfo;
  const credentialId = info.credential.id;
  const publicKey = info.credential.publicKey;
  const counter = info.credential.counter;

  // public_key is a bytea column. PostgREST accepts bytea as the Postgres
  // hex escape format (`\x<hex>`). Previously we stored base64 TEXT into
  // bytea, which Postgres then treated as raw bytes of the base64 string —
  // a silent data-integrity bug that would fail every subsequent sign-in.
  const publicKeyHex = "\\x" + Buffer.from(publicKey).toString("hex");

  await supabase.from("user_passkeys").insert({
    user_id: u.user.id,
    credential_id: credentialId,
    public_key: publicKeyHex,
    counter,
    device_name: parsed.deviceName ?? null,
  });

  await supabase
    .from("webauthn_challenges")
    .update({ consumed: true })
    .eq("id", challengeRow.id);

  // H2-07 — audit the passkey registration. user_passkeys is not covered by
  // the SSOT audit trigger, so we emit manually.
  const session = await getSession();
  if (session?.orgId) {
    await emitAudit({
      actorId: u.user.id,
      orgId: session.orgId,
      actorEmail: session.email,
      action: "auth.passkey.registered",
      targetTable: "user_passkeys",
      metadata: { device_name: parsed.deviceName ?? null },
      requestId: req.headers.get("x-request-id"),
    });
    const { notify } = await import("@/lib/notify");
    await notify({
      orgId: session.orgId,
      userId: u.user.id,
      eventType: "passkey.registered",
      title: `Passkey registered${parsed.deviceName ? `: ${parsed.deviceName}` : ""}`,
      href: `/me/security`,
      data: { deviceName: parsed.deviceName ?? null },
    });
  }

  return apiOk({ verified: true });
}
