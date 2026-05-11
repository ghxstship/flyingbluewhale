import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { mintToken } from "@/lib/api-keys";
import { createClient } from "@/lib/supabase/server";
import { keyFromRequest, ratelimit, RATE_BUDGETS } from "@/lib/ratelimit";

/**
 * Org-scoped programmatic access tokens.
 *
 * GET  — list the org's tokens (RLS: any org member; secret never returned).
 * POST — issue a new token. Plaintext returned ONCE; only the prefix +
 *        sha256 are persisted. Cookie-auth only and owner/admin-gated —
 *        a token cannot mint another token (issuance trust boundary).
 *
 * Path naming note: this lives at `/me/api-keys` because it's the surface
 * for "the keys I can see right now." The keys themselves are org-shared
 * (anyone on the org can list, only owner/admin can mutate).
 */

const PostSchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(z.string().max(64)).max(32).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, prefix, scopes, last_used_at, expires_at, revoked_at, created_at, created_by")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false });
    if (error) return apiError("internal", error.message);
    return apiOk({ keys: data ?? [] });
  });
}

export async function POST(req: NextRequest) {
  // Token minting is a privileged write — gate on the write bucket
  // (60/min). Without it a compromised owner session could spew tokens
  // faster than the audit log can catch.
  const rl = await ratelimit({
    key: keyFromRequest(req, "api-keys:mint"),
    ...RATE_BUDGETS.write,
  });
  if (!rl.ok) return apiError("rate_limited", "Too many token-mint requests");

  const input = await parseJson(req, PostSchema);
  if (input instanceof Response) return input;
  return withAuth(async (session) => {
    if (!session.orgId) return apiError("forbidden", "User is not in an organization");
    // Mirror the console-UI invariant: only owner/admin can issue.
    const denial = assertCapability(session, "billing:write");
    if (denial) return denial;
    const { token, prefix, hashedSecret } = mintToken();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        org_id: session.orgId,
        name: input.name,
        prefix,
        hashed_secret: hashedSecret,
        scopes: input.scopes ?? [],
        expires_at: input.expiresAt ?? null,
        created_by: session.userId,
      })
      .select("id, name, prefix, scopes, expires_at, created_at, created_by")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ key: data, token });
  });
}
