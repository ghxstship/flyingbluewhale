-- Sweep 16 — switch public discovery views from SECURITY DEFINER (creator's
-- RLS) to SECURITY INVOKER (caller's RLS). Without this the views bypass
-- the per-row visibility rules of whatever client is reading. PostgreSQL
-- 15+ supports `security_invoker=on` view option.
ALTER VIEW public.public_open_calls SET (security_invoker = on);
ALTER VIEW public.public_agency_directory SET (security_invoker = on);
ALTER VIEW public.tour_p_and_l SET (security_invoker = on);
ALTER VIEW public.public_event_calendar SET (security_invoker = on);
ALTER VIEW public.public_job_board SET (security_invoker = on);
ALTER VIEW public.public_rfq_marketplace SET (security_invoker = on);
ALTER VIEW public.public_insights_pool SET (security_invoker = on);
ALTER VIEW public.public_vendor_directory SET (security_invoker = on);
ALTER VIEW public.public_crew_directory SET (security_invoker = on);
ALTER VIEW public.public_talent_directory SET (security_invoker = on);
