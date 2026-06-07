-- ============================================================================
-- proposal_share_links — HMAC + atomic consume
-- ============================================================================
-- Brings proposals onto the same security pattern as `share_links`:
--   * URL tokens are HMAC-SHA256 signed (id + expiry + nonce). The plain
--     `token` column is preserved for backward-compat reads only; new mints
--     use HMAC tokens via `signShareToken` (lib/share/tokens.ts).
--   * Resolution uses the service-role client + an atomic consume RPC. A
--     racing visitor + signer cannot see + claim the same view-count slot
--     twice.
--   * Optional passcode_hash + max_uses + uses + last_used_at, mirroring
--     `share_links`. The passcode gate is unused at first; the column
--     exists so a future "send + passcode" UX is a one-line change.
--
-- The `consume_proposal_share_link(p_id)` RPC is SECURITY DEFINER and
-- granted to anon — matching the `consume_share_link` precedent. Public
-- proposal links must be reachable without a session. The RPC's
-- predicates (revoked / expired / exhausted) gate the write so an anon
-- caller cannot advance counters on a dead link.
-- ============================================================================

alter table public.proposal_share_links
  add column if not exists passcode_hash text,
  add column if not exists max_uses      integer,
  add column if not exists uses          integer not null default 0,
  add column if not exists last_used_at  timestamptz;

-- Atomic consume. UPDATE+RETURNING with predicates that gate revocation
-- + expiry + exhaustion. Two concurrent calls cannot both see + claim
-- the same slot.
create or replace function public.consume_proposal_share_link(p_id uuid)
returns public.proposal_share_links
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.proposal_share_links;
begin
  update public.proposal_share_links
     set uses = uses + 1,
         view_count = coalesce(view_count, 0) + 1,
         last_used_at = now(),
         last_viewed_at = now()
   where id = p_id
     and revoked_at is null
     and (expires_at is null or expires_at > now())
     and (max_uses is null or uses < max_uses)
  returning * into v_row;
  return v_row;  -- null when no row matched
end;
$$;

revoke all on function public.consume_proposal_share_link(uuid) from public;
grant execute on function public.consume_proposal_share_link(uuid) to anon, authenticated;

comment on function public.consume_proposal_share_link(uuid) is
  'Public proposal-share consumer. Anon-callable by design — /proposals/[token] is unauthenticated and the HMAC token signature is the authorization. Atomic UPDATE+RETURNING gates revocation/expiry/exhaustion.';
