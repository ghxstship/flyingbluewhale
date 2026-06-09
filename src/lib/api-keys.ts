import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createServiceClient, isServiceClientAvailable } from "./supabase/server";
import { personaForRole } from "./auth";
import type { Session } from "./auth";
import type { PlatformRole, Tier } from "./supabase/types";

/**
 * Org-scoped programmatic access tokens.
 *
 * Token format: `sk_<8-char-prefix>_<43-char-secret>` — same format the
 * console UI at /console/settings/api/actions.ts mints. We re-derive both
 * the prefix and the hash here so an external caller (CI bot, partner
 * integration) can authenticate the token they were given.
 *
 * Schema: api_keys (org_id, prefix, hashed_secret, scopes, created_by,
 * last_used_at, expires_at, revoked_at). RLS allows org-members to read,
 * owner/admin to write/revoke.
 *
 * On verify:
 *   1. Parse `Authorization: Bearer sk_<8>_<rest>`.
 *   2. Look up by prefix (`sk_<8>` is the indexed handle).
 *   3. Constant-time compare sha256(full token) against hashed_secret.
 *   4. Refuse if revoked or expired.
 *   5. Resolve `created_by` → memberships(org_id) into a Session.
 *
 * Tokens with `created_by IS NULL` cannot be used for auth — there's no
 * user to map to a Session. This is intentional: a token's blast radius
 * is bounded by the issuing user's role.
 */

// Prefix group accepts the full base64url alphabet (incl. `-` and `_`):
// tokens minted before 2026-06 sliced the prefix from base64url output, so
// ~22% of live tokens carry `-`/`_` in the prefix — a narrower class here
// silently 401'd every one of them. The group is fixed-width (8), so an
// embedded `_` can't be confused with the prefix/secret separator.
const TOKEN_RE = /^sk_([A-Za-z0-9_-]{8})_[A-Za-z0-9_-]{20,}$/;

export type ApiKeyRow = {
  id: string;
  org_id: string;
  created_by: string | null;
  prefix: string;
  hashed_secret: string;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
};

export function mintToken(): { token: string; prefix: string; hashedSecret: string } {
  // Prefix from hex (alphanumeric-only) so the visible handle never
  // contains `-`/`_` — keeps `sk_<prefix>_<secret>` visually unambiguous.
  // The secret keeps base64url density (~43 chars from 32 random bytes).
  const prefix = `sk_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(32).toString("base64url").slice(8);
  const token = `${prefix}_${secret}`;
  const hashedSecret = sha256(token);
  return { token, prefix, hashedSecret };
}

export function parseToken(input: string): { prefix: string; full: string } | null {
  const m = TOKEN_RE.exec(input);
  if (!m) return null;
  return { prefix: `sk_${m[1]}`, full: input };
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

function constantTimeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function verifyApiKey(authorizationHeader: string | null | undefined): Promise<Session | null> {
  if (!authorizationHeader) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authorizationHeader);
  if (!m) return null;
  const parsed = parseToken(m[1].trim());
  if (!parsed) return null;
  if (!isServiceClientAvailable()) return null;

  const svc = createServiceClient();
  const { data: row, error } = await svc
    .from("api_keys")
    .select("id, org_id, created_by, prefix, hashed_secret, scopes, expires_at, revoked_at")
    .eq("prefix", parsed.prefix)
    .maybeSingle();
  if (error || !row) return null;

  const k = row as unknown as ApiKeyRow;
  if (k.revoked_at) return null;
  if (k.expires_at && new Date(k.expires_at) < new Date()) return null;
  if (!k.created_by) return null;
  if (!constantTimeEq(sha256(parsed.full), k.hashed_secret)) return null;

  // .is("deleted_at", null) — a soft-deleted membership (offboarded
  // user / pending account purge) must NOT yield an authenticated
  // session via API key. Without this filter an offboarded user's
  // un-revoked API key would still authenticate and bypass the
  // offboarding entirely.
  const { data: membership } = await svc
    .from("memberships")
    .select("role, is_developer, orgs(slug, tier)")
    .eq("user_id", k.created_by)
    .eq("org_id", k.org_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!membership) return null;
  const mem = membership as {
    role: PlatformRole;
    is_developer: boolean;
    orgs: { slug: string; tier: Tier } | null;
  };
  const role = mem.role;
  const tier = (mem.orgs?.tier ?? "access") as Tier;
  const orgSlug = mem.orgs?.slug ?? "";

  // Best-effort write-behind. Failures don't fail the auth.
  void svc
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", k.id)
    .then(() => undefined);

  let email = "";
  try {
    const { data } = await svc.auth.admin.getUserById(k.created_by);
    email = data.user?.email ?? "";
  } catch {
    // Email is informational; auth still succeeds.
  }

  return {
    userId: k.created_by,
    email,
    orgId: k.org_id,
    orgSlug,
    role,
    isDeveloper: mem.is_developer,
    tier,
    persona: personaForRole(role),
    // Propagate the stored scopes. Cookie sessions leave this undefined
    // (= wildcard). Tokens minted with no scopes also surface an empty
    // array which `assertScope` treats as wildcard, matching mint UX.
    scopes: k.scopes ?? [],
  };
}
