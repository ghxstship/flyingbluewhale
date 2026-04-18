import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { apiError } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn";

/**
 * Begin passkey registration. Returns the options object the browser passes to
 * navigator.credentials.create(). Stores the challenge for later verification.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in to register a passkey");

  const { rpID, rpName } = getRpConfig();

  // Existing credentials so the browser can prevent re-registering the same authenticator
  const { data: existing } = await supabase
    .from("user_passkeys")
    .select("credential_id")
    .eq("user_id", u.user.id);

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(u.user.id),
    userName: u.user.email ?? u.user.id,
    userDisplayName: (u.user.user_metadata?.name as string | undefined) ?? u.user.email ?? "user",
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({
      id: c.credential_id,
      type: "public-key",
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await supabase.from("webauthn_challenges").insert({
    user_id: u.user.id,
    challenge: options.challenge,
    type: "registration",
  });

  return NextResponse.json({ ok: true, data: options });
}
