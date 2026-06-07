DO $migrate$ BEGIN
  -- Restore SELECT for org members on talent_offers. The original
-- talent_offers_org_rw policy (FOR ALL) covered SELECT/INSERT/UPDATE/
-- DELETE for org members. Migration 20260509100012 split it into
-- specific FOR <cmd> policies but only emitted INSERT/UPDATE/DELETE —
-- losing the SELECT path. The only remaining SELECT was
-- talent_offers_recipient_select (filters to the talent recipient
-- only), so org members couldn't read their own org's talent_offers.
--
-- Symptom: the offer state-machine e2e test ("draft → sent → accepted")
-- fails because the redirect to /console/marketplace/offers/[id] hits a
-- page that selects the row and gets nothing back. The INSERT also
-- silently failed in some cases because the post-insert .select("id")
-- couldn't read the row it just wrote (the policy applies pre-RETURNING
-- in some Postgres versions).

drop policy if exists talent_offers_org_select on public.talent_offers;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy talent_offers_org_select on public.talent_offers
  for select using (private.is_org_member(org_id));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  comment on policy talent_offers_org_select on public.talent_offers is
  'Org members read all of their org''s talent_offers. Companion to '
  'talent_offers_recipient_select (which lets the talent recipient see '
  'offers addressed to them across orgs).';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
