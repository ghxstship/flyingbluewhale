-- Security hardening pass.
-- 1. Pin search_path on every public function (Supabase linter 0011).
-- 2. Tighten the two permissive `WITH CHECK (true)` policies on
--    proposal_events + proposal_signatures (Supabase linter 0024):
--    require a matching non-revoked, non-expired share link.

-- ─── 1. Pin function search_path ─────────────────────────────────────
alter function public.current_request_id()                set search_path = public, pg_temp;
alter function public.tg_set_updated_at()                 set search_path = public, pg_temp;
alter function public.bump_updated_at()                   set search_path = public, pg_temp;
alter function public.touch_updated_at()                  set search_path = public, pg_temp;
alter function public.snapshot_deliverable_on_submit()    set search_path = public, pg_temp;
alter function public.enforce_deliverable_deadline()      set search_path = public, pg_temp;
alter function public.claim_jobs(int, int, text)          set search_path = public, pg_temp;
alter function public.reclaim_stuck_jobs()                set search_path = public, pg_temp;

-- emit_notification was added in 20260420_000027 with security definer +
-- an explicit search_path; re-assert here to be idempotent.
alter function public.emit_notification(uuid, uuid, text, text, text, text, jsonb)
  set search_path = public, pg_temp;

-- ─── 2. Tighten permissive INSERT policies on anon-writable tables ───
-- proposal_events: a pageview from the token-gated /proposals/[token]
-- page only lands when a non-revoked, non-expired share link exists.
drop policy if exists proposal_events_insert on public.proposal_events;
create policy proposal_events_insert on public.proposal_events
  for insert with check (
    exists (
      select 1 from public.proposal_share_links l
      where l.proposal_id = proposal_events.proposal_id
        and l.revoked_at is null
        and (l.expires_at is null or l.expires_at > now())
    )
  );

-- proposal_signatures: a signature from the public page only lands when
-- a non-revoked, non-expired share link exists for that proposal.
drop policy if exists proposal_signatures_insert on public.proposal_signatures;
create policy proposal_signatures_insert on public.proposal_signatures
  for insert with check (
    exists (
      select 1 from public.proposal_share_links l
      where l.proposal_id = proposal_signatures.proposal_id
        and l.revoked_at is null
        and (l.expires_at is null or l.expires_at > now())
    )
  );
