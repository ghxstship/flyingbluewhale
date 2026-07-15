import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiCreated, apiError, apiOk, parseJson } from "@/lib/api";
import { assertCapability, withAuth } from "@/lib/auth";
import { mintToken } from "@/lib/api-keys";
import { API_SCOPES, isApiScope, suggestScope } from "@/lib/api-scopes";
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

/**
 * `scopes` is REQUIRED and validated against the real vocabulary.
 *
 * It used to be `z.array(z.string().max(64)).optional()`, which had two
 * sharp edges. A typo (`time:reed`) minted a token that authenticated fine
 * and silently granted nothing. And omitting `scopes` persisted `[]`, which
 * `assertScope` reads as WILDCARD — so the least-effort call minted the
 * most powerful token. That was tolerable when the API was projects and
 * tasks; it is not now that hours, timesheets, and payroll are reachable
 * through it. Least privilege has to be the default, not the opt-in.
 *
 * Callers who genuinely want a full-access token now say so: `["*"]`.
 */
const PostSchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z
    .array(z.string().max(64))
    .min(1, "Name at least one scope. Use [\"*\"] for a full-access token.")
    .max(32),
  expiresAt: z.string().datetime().optional(),
});

export async function GET() {
  return withAuth(async (session) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .select("id, name, prefix, scopes, last_used_at, expires_at, revoked_at, created_at, created_by")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(500);
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

    // Reject unknown scopes rather than minting a token that authenticates
    // and grants nothing. Name every offender and suggest the near miss —
    // a silent no-op is the worst possible answer to a typo.
    const unknown = input.scopes.filter((s) => !isApiScope(s));
    if (unknown.length > 0) {
      return apiError(
        "bad_request",
        `Unknown scope${unknown.length === 1 ? "" : "s"}: ${unknown.join(", ")}`,
        {
          unknown: unknown.map((s) => ({ scope: s, didYouMean: suggestScope(s) })),
          validScopes: API_SCOPES,
        },
      );
    }
    const scopes = Array.from(new Set(input.scopes));

    const { token, prefix, hashedSecret } = mintToken();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("api_keys")
      .insert({
        org_id: session.orgId,
        name: input.name,
        prefix,
        hashed_secret: hashedSecret,
        scopes,
        expires_at: input.expiresAt ?? null,
        created_by: session.userId,
      })
      .select("id, name, prefix, scopes, expires_at, created_at, created_by")
      .single();
    if (error) return apiError("internal", error.message);
    return apiCreated({ key: data, token });
  });
}
