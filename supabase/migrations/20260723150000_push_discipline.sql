-- ============================================================================
-- Push discipline engine (T1-2, docs/compvss/MOBILE_BEST_PRACTICES_2026-07.md
-- Rank 2) — sender-side deferral queue + quiet-hours canon.
--
-- 1. `push_deferred` — pushes the discipline gate parked instead of sending:
--    `ambient`-tier pushes caught inside the recipient's quiet hours (flushed
--    at quiet-hours end) and `digest`-tier accruals (flushed as ONE summary
--    push per window). Drained by `evaluateDeferredPushes()`
--    (src/lib/push/flush.ts) riding the existing automations worker tick
--    (/api/v1/internal/automations/schedule) — no new cron.
--
-- 2. Quiet hours ride the EXISTING `notification_preferences.quiet_hours`
--    jsonb column (present since the baseline, never consumed until now).
--    This migration canonizes its shape via COMMENT rather than adding
--    parallel scalar columns — the preferences store is jsonb-shaped
--    (`matrix` jsonb beside it) and the reader (src/lib/push/tiers.ts
--    #parseQuietHours) validates defensively.
--
-- LDP note: `sent_at` is a nullable claim timestamp, not a lifecycle column;
-- `tier` is a facet of the payload (interrupt never enqueues). No `status`.
-- ============================================================================

create table if not exists public.push_deferred (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: payloads without org context (system-adjacent kinds) can still
  -- defer; org_id exists for scoping/analytics, not authorization (writes are
  -- service-role only).
  org_id uuid references public.orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- The PushKind the payload carried ('system' for kindless — in practice the
  -- gate exempts kindless payloads, so this is belt-and-braces).
  kind text not null,
  -- Discipline tier that parked the row. `interrupt` delivers immediately by
  -- definition and never lands here.
  tier text not null check (tier in ('ambient', 'digest')),
  -- The full PushPayload as enqueued (title/body/url/kind/scope/...). The
  -- flush worker replays ambient rows verbatim and folds digest rows into
  -- one summary push per user per window.
  payload jsonb not null,
  -- When the row becomes due: quiet-hours end for ambient, the next digest
  -- window (quiet end / midday) for digest.
  defer_until timestamptz not null,
  -- Claim/flush timestamp — set by the worker when the row is drained
  -- (single UPDATE claim, so a racing tick can't double-send).
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.push_deferred is
  'Push-discipline deferral queue (T1-2): ambient pushes parked during a user''s quiet hours + digest-tier accruals. Service-role writes only; drained on the automations worker tick by evaluateDeferredPushes() (src/lib/push/flush.ts).';

-- The worker's drain read: due, unsent, oldest first.
create index if not exists idx_push_deferred_due
  on public.push_deferred (defer_until)
  where sent_at is null;

-- FK indexes (DB-advisor convention: every FK gets one).
create index if not exists idx_push_deferred_user on public.push_deferred (user_id);
create index if not exists idx_push_deferred_org on public.push_deferred (org_id);

alter table public.push_deferred enable row level security;

-- Reads: a user may see their own pending/flushed pushes (transparency —
-- "what's waiting for quiet hours to end"). No authenticated write policies:
-- only the service-role sender/flush worker mutates the queue.
create policy push_deferred_select_own on public.push_deferred
  for select using (user_id = (select auth.uid()));

-- pg default ACLs grant anon SELECT on new tables in this project — revoke
-- explicitly (queue payloads are private).
revoke all on table public.push_deferred from anon;
grant select on table public.push_deferred to authenticated;
grant all on table public.push_deferred to service_role;

-- ----------------------------------------------------------------------------
-- Quiet-hours shape canon on the existing column.
-- ----------------------------------------------------------------------------
comment on column public.notification_preferences.quiet_hours is
  'Push quiet hours (T1-2 discipline engine): {"enabled": bool, "start_min": 0-1439, "end_min": 0-1439, "tz": "IANA/Zone"}. Wall-clock minutes since midnight in tz; the window may wrap midnight (start 1320 / end 420 = 22:00-07:00). During the window: interrupt-tier pushes deliver, ambient defers to push_deferred until end_min, digest accrues. Written by /m/settings/notifications; read by src/lib/push/tiers.ts#parseQuietHours.';
