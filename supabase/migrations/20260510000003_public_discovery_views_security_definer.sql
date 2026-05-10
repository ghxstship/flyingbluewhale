-- Revert security_invoker=on for the 6 public discovery views.
--
-- Migration 20260509100003 set security_invoker=on across every public
-- view to silence the supabase advisor's `security_definer_view` warning.
-- That was the right move for INTERNAL views (which gate by RLS on the
-- caller). It was the WRONG move for these 6 views — they ARE the
-- explicit public-read surface for the marketplace canon (per
-- supabase/migrations/0002_marketplace_canon.sql §"Public discovery
-- views"). Running them as the view owner bypasses caller RLS, which is
-- exactly what we want: any anon visitor on /marketplace/* can read
-- what the view's WHERE clause exposes, no underlying-table policy
-- required.
--
-- The advisor warning that re-appears is accepted-by-design for these
-- six specifically — added to budgets/supabase-advisor.json.

alter view public.public_rfq_marketplace set (security_invoker=off);
alter view public.public_talent_directory set (security_invoker=off);
alter view public.public_crew_directory set (security_invoker=off);
alter view public.public_vendor_directory set (security_invoker=off);
alter view public.public_job_board set (security_invoker=off);
alter view public.public_open_calls set (security_invoker=off);

comment on view public.public_rfq_marketplace is
  'Public RFQ discovery feed. security_invoker=off (definer mode) so '
  'anon visitors can read public RFQ rows + their org metadata without '
  'requiring a public-read policy on the underlying rfqs/orgs tables. '
  'WHERE clause is the public-read contract: visibility=public AND '
  'status=sent.';
comment on view public.public_talent_directory is 'Public talent EPK feed — definer mode, see public_rfq_marketplace.';
comment on view public.public_crew_directory is 'Public crew profile feed — definer mode, see public_rfq_marketplace.';
comment on view public.public_vendor_directory is 'Public vendor profile feed — definer mode, see public_rfq_marketplace.';
comment on view public.public_job_board is 'Public job posting feed — definer mode, see public_rfq_marketplace.';
comment on view public.public_open_calls is 'Public open-call feed — definer mode, see public_rfq_marketplace.';
