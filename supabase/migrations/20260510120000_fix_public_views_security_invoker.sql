-- Fix public_event_calendar and public_agency_directory returning zero rows for anon.
--
-- 20260509100003 set security_invoker=on on all discovery views to prevent SUID
-- privilege escalation. 20260510000003 correctly reverted the six marketplace
-- discovery views back to security_invoker=off, but two views were missed:
--
--   public_event_calendar  — INNER JOINs orgs which has no anon SELECT policy.
--                            Under invoker security, anon gets zero org rows → zero
--                            calendar rows (INNER JOIN eliminates all).
--
--   public_agency_directory — correlated subquery on agency_artists has no anon
--                             policy → artist_count returns 0 for every row.
--
-- Both views contain only explicitly public data (visibility='public' guard in WHERE
-- clause) and are safe to run under definer security for the same reason the six
-- corrected marketplace views are.

ALTER VIEW public.public_event_calendar SET (security_invoker = off);
ALTER VIEW public.public_agency_directory SET (security_invoker = off);

COMMENT ON VIEW public.public_event_calendar IS
  'Public marketing calendar. security_invoker=off (definer mode): anon visitors
   need to read event_milestones + orgs without a public RLS policy on orgs.
   WHERE clause guards: visibility=''public'' AND occurs_at >= now()-7 days.';

COMMENT ON VIEW public.public_agency_directory IS
  'Public agency directory. security_invoker=off: anon reads bypass orgs RLS.
   artist_count subquery on agency_artists returns accurate count under definer
   mode. Only published agencies exposed (is_public_profile=true WHERE guard).';
