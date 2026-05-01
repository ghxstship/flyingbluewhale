import { generateRegistrationOptions } from "@simplewebauthn/server";
import { apiError, apiOk } from "@/lib/api";
import { createClient } from "@/lib/supabase/server";
import { getRpConfig } from "@/lib/webauthn";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Begin passkey registration. Returns the options object the browser passes to
 * navigator.credentials.create(). Stores the challenge for later verification.
 */
export async function POST(req: Request) {
  // Auth-bucket rate limit — passkey enrolment is high-value, low-frequency.
  // 10 attempts/min/user (or per IP for unauth) is generous for the legit
  // flow and tight enough to deter enumeration.
  const rl = await ratelimit({
    key: keyFromRequest(req, "auth:passkey:register-options"),
    ...RATE_BUDGETS.auth,
  });
  if (!rl.ok) return apiError("rate_limited", "Too many registration attempts");

  const supabase = await createClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return apiError("unauthorized", "Sign in to register a passkey");

  const { rpID, rpName } = getRpConfig();

  // Existing credentials so the browser can prevent re-registering the same authenticator
  const { data: existing } = await supabase.from("user_passkeys").select("credential_id").eq("user_id", u.user.id);

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

  return apiOk(options);
}
