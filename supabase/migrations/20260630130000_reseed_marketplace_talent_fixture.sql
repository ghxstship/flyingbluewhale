-- Restore the deterministic marketplace talent fixture the e2e suite reads
-- (e2e/marketplace-canon-actions). It is a "remote-only" seed that a mutation
-- test side-effect had deleted from prod (the linked offer survived). Idempotent
-- upsert so re-running restores published + verified state and can't drift.
insert into public.talent_profiles (id, org_id, user_id, created_by, public_handle, act_name, tagline, is_public, verified_at)
values (
  'aaaaaaaa-0001-4001-8001-000000000001',
  'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7',
  '781d6818-5f1b-4b41-b5a7-aa3b2cf1732a',
  '781d6818-5f1b-4b41-b5a7-aa3b2cf1732a',
  'fixture-band-alpha-pro',
  'Fixture Band Alpha',
  'Deterministic e2e marketplace fixture.',
  true,
  now()
)
on conflict (id) do update set
  public_handle = excluded.public_handle,
  act_name      = excluded.act_name,
  is_public     = true,
  verified_at   = coalesce(public.talent_profiles.verified_at, now()),
  deleted_at    = null;
