-- Kit 34 seed-org canon: rename the demo org to "Black Pearl Co." (was
-- "Demo Events Co."). The Pirates / Port Royal seed content already lives in
-- this org (68672cc3…, slug 'demo' — its first project "MMW26 — Open Air at
-- the Racetrack" carries the kit-34 project_tasks/events/milestones), so the
-- rename simply associates that seed with the canonical name. The slug stays
-- 'demo' — seed helpers (seed_cornbread_abbey_road / seed_salvage_city_ssot
-- default p_org_slug 'demo') and routing/e2e key off it. Idempotent.
update public.orgs
set name = 'Black Pearl Co.'
where id = '68672cc3-0667-4234-ad77-49325e173175'
  and name = 'Demo Events Co.';
