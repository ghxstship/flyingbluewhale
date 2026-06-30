-- Security Advisor (security_definer_view ERROR) — Phase 1a.
-- Convert ONLY the public_* views whose base-table RLS already grants anon the
-- published rows, so security_invoker preserves anon access. Verified with a
-- rollback probe: anon row count is identical under DEFINER vs INVOKER
--   public_talent_directory  5 == 5
--   public_agency_directory  2 == 2
-- This makes RLS the authorization boundary (defense in depth) and clears the
-- lint for these two.
--
-- The other 6 flagged views (vendor/crew/rfq/open_calls/job_board/event_calendar)
-- DROP TO 0 rows for anon under security_invoker — their base tables have no anon
-- SELECT policy and the views rely on DEFINER to expose published rows. They must
-- get a published-gated anon policy on each base table BEFORE flipping (verify with
-- the same probe: invoker count must equal definer count). Tracked in
-- reports/SECURITY_ADVISOR_REMEDIATION.md.
alter view public.public_talent_directory set (security_invoker = on);
alter view public.public_agency_directory set (security_invoker = on);
