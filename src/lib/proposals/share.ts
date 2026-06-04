import "server-only";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { signShareToken, verifyShareToken } from "@/lib/share/tokens";

/**
 * Proposal share-link resolver — modelled on `consumeShareLink` from
 * `src/lib/share/links.ts`. Differences vs the generic share_links flow:
 *
 *  - Resource is always a proposal (single FK), so the return shape is
 *    proposal-specific (no resource_table dispatch).
 *  - Backward compatibility: outstanding non-HMAC tokens minted before
 *    migration 0064 are still accepted via the `legacyTokenResolver`
 *    fallback. The fallback runs only when HMAC verification fails AND
 *    the caller opts in. The rate-limiter at the action layer is the
 *    only thing standing between scrapers and legacy tokens.
 *
 * Resolution flow:
 *   1. HMAC-verify the URL token. Bail with `invalid` on bad sig or expiry.
 *   2. Read the row via service-role (anon has no Supabase session; HMAC sig
 *      is the authorization).
 *   3. Defense-in-depth re-checks of revoked / expired / exhausted.
 *   4. Atomic consume via `consume_proposal_share_link` RPC. Race-safe.
 */

export type ResolvedProposalLink = {
  ok: true;
  link: {
    id: string;
    proposal_id: string;
    audience: string | null;
    expires_at: string | null;
    revoked_at: string | null;
    uses: number;
    view_count: number | null;
  };
};

export type FailedProposalLink = {
  ok: false;
  reason: "invalid" | "revoked" | "expired" | "exhausted" | "passcode_required" | "passcode_wrong";
};

export type ProposalLinkResult = ResolvedProposalLink | FailedProposalLink;

/**
 * Mint the HMAC-signed URL token for a freshly inserted share-link row.
 * The plain `token` column stays in the DB for backward-compat reads;
 * this function returns the URL-shaped string that goes in the email +
 * marketing href.
 */
export function mintProposalShareUrlToken(opts: { linkId: string; expiresAt: Date | null }): string {
  return signShareToken({ id: opts.linkId, expiresAt: opts.expiresAt ?? undefined });
}

type ShareLinkRow = {
  id: string;
  proposal_id: string;
  audience: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  uses: number;
  view_count: number | null;
  max_uses: number | null;
};

export async function resolveProposalShareLink(opts: {
  token: string;
  /**
   * When set, attempts a fallback read by the plain-text `token` column
   * for outstanding non-HMAC tokens minted before migration 0064. The
   * caller MUST apply rate-limiting before invoking with this option;
   * without it the legacy path is a credential-stuffing target.
   */
  allowLegacyTokenFallback?: boolean;
}): Promise<ProposalLinkResult> {
  if (!isServiceClientAvailable()) return { ok: false, reason: "invalid" };
  const svc = createServiceClient();

  const SELECT_COLS = "id, proposal_id, audience, expires_at, revoked_at, uses, view_count, max_uses";

  async function consume(rowId: string): Promise<ShareLinkRow | null> {
    const { data, error } = await (
      svc.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: ShareLinkRow | null; error: { message: string } | null }>
    )("consume_proposal_share_link", { p_id: rowId });
    if (error || !data) return null;
    return data;
  }

  function rowToLink(row: ShareLinkRow): ResolvedProposalLink {
    return {
      ok: true,
      link: {
        id: row.id,
        proposal_id: row.proposal_id,
        audience: row.audience,
        expires_at: row.expires_at,
        revoked_at: row.revoked_at,
        uses: row.uses,
        view_count: row.view_count,
      },
    };
  }

  // ── Path A: HMAC token ────────────────────────────────────────────────
  const verified = verifyShareToken(opts.token);
  if (verified) {
    const { data: row, error } = await svc
      .from("proposal_share_links")
      .select(SELECT_COLS)
      .eq("id", verified.id)
      .maybeSingle();
    if (error || !row) return { ok: false, reason: "invalid" };
    const r = row as unknown as ShareLinkRow;
    if (r.revoked_at) return { ok: false, reason: "revoked" };
    if (r.expires_at && new Date(r.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
    if (r.max_uses !== null && r.uses >= r.max_uses) return { ok: false, reason: "exhausted" };

    const claimed = await consume(r.id);
    if (!claimed) return { ok: false, reason: "exhausted" };
    return rowToLink(claimed);
  }

  // ── Path B: legacy raw token (back-compat) ─────────────────────────────
  if (!opts.allowLegacyTokenFallback) return { ok: false, reason: "invalid" };

  const { data: legacy, error: legacyErr } = await svc
    .from("proposal_share_links")
    .select(SELECT_COLS)
    .eq("token", opts.token)
    .maybeSingle();
  if (legacyErr || !legacy) return { ok: false, reason: "invalid" };
  const l = legacy as unknown as ShareLinkRow;
  if (l.revoked_at) return { ok: false, reason: "revoked" };
  if (l.expires_at && new Date(l.expires_at).getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (l.max_uses !== null && l.uses >= l.max_uses) return { ok: false, reason: "exhausted" };

  const claimed = await consume(l.id);
  if (!claimed) return { ok: false, reason: "exhausted" };
  return rowToLink(claimed);
}
