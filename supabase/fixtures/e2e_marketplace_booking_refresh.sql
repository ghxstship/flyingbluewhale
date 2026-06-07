-- E2E fixture refresh — marketplace + booking specs
-- =================================================
-- The booking-canon / marketplace-canon Playwright specs depend on fixture
-- records (offers, talent, open_calls, etc.) seeded into the four Test orgs.
-- This script makes the *environmental* prerequisites reproducible — the parts
-- that drift over time or were never enabled — so a fresh checkout can run the
-- specs green. Idempotent; safe to re-run. Apply with the Supabase MCP
-- `apply_migration`/`execute_sql` or psql against the test project.
--
-- Discovered while driving the suite to green (2026-06-06): three classes of
-- non-product breakage —
--   1. orgs.marketplace_enabled defaulted false → the /console/marketplace/*
--      /new pages render the enablement gate instead of the form, so the
--      create-flow specs' fields never mount.
--   2. Fixture open_calls had a deadline_at in the past; public_open_calls
--      filters `deadline_at > now()`, so the public detail page 404'd as the
--      clock advanced past the seeded deadline.
--   3. Accumulated E2E rows (availability_slots holds, settlements) from
--      repeated runs broke the detail pages' `.maybeSingle()` reads and the
--      paginated holds list. (Cleaned below; the durable fix is a UNIQUE
--      constraint on settlements.talent_offer_id — see note at bottom.)

-- The four canonical Test orgs.
-- Portal 39c5b82a · Starter 0443cdf4 · Professional f4509a5f · Enterprise e901f2c4

-- 1. Enable marketplace on every Test org (required for the marketplace /new forms).
update public.orgs
set marketplace_enabled = true
where id in (
  '39c5b82a-29fa-47ff-a43c-fe9c116cd27e',
  '0443cdf4-384c-44ea-8de7-25e5de77d2c8',
  'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7',
  'e901f2c4-0c3c-496d-8d30-16e98f2eb809'
);

-- 2. Keep the fixture open_call discoverable (future deadline + published).
update public.open_calls
set deadline_at    = timestamptz '2030-06-01 00:00:00+00',
    status         = 'published',
    open_call_phase = 'published',
    deleted_at     = null,
    published_at   = coalesce(published_at, now())
where public_slug = 'fixture-festival-headliner-casting-pro';

-- 3. Clear accumulated per-run E2E artifacts in the Professional org so the
--    detail/list reads aren't polluted by prior runs.
delete from public.availability_slots
where org_id = 'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7'
  and kind = 'hold'
  and label like 'E2E Hold%';

delete from public.settlements
where talent_offer_id = 'ffffffff-0001-4001-8001-000000000001';

-- NOTE (data-integrity follow-up): public.settlements has no UNIQUE constraint
-- on talent_offer_id, so the settlement upsert action can accumulate duplicate
-- rows for one deal; the settlement detail page reads `.maybeSingle()` and goes
-- blank once duplicates exist. A `unique (talent_offer_id)` + an ON CONFLICT
-- upsert in the action would make this self-healing. Tracked separately.

-- Portal client-proposal lifecycle fixture: a proposal in test-professional-show
-- so the client fixture user can reach /p/<slug>/client/proposals/[id]/* (the
-- portal-proposal-lifecycle.spec render coverage). Idempotent on the fixed id.
insert into public.proposals (id, org_id, project_id, title, amount_cents)
select '3e7fbd4f-0f30-4cb0-b1e0-57ff7ae727b5'::uuid,  -- matches portal-proposal-lifecycle.spec PROPOSAL_ID
       'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7', 'f62d1228-dd83-49bf-baa4-b82242bd3056',
       'E2E Portal Proposal — Fixture', 5000000
where not exists (
  select 1 from public.proposals where project_id='f62d1228-dd83-49bf-baa4-b82242bd3056'
    and title='E2E Portal Proposal — Fixture'
);

-- Accreditation fixture (Professional org) so console-modules-b7's
-- accreditation-change create can resolve the required accreditation_id FK.
insert into public.accreditations (org_id, person_name)
select 'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7', 'E2E Accreditation Holder'
where not exists (select 1 from public.accreditations
  where org_id='f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7' and person_name='E2E Accreditation Holder');
