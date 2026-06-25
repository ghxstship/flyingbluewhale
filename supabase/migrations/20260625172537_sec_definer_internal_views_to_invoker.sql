-- SECURITY: convert internal (non-marketplace) SECURITY DEFINER views to
-- security_invoker=on so they respect the querying user's RLS, and revoke the
-- default anon SELECT grant. These views were DEFINER + GRANT SELECT TO anon,
-- which let logged-out users read EVERY org's offer letters (with signatures,
-- PII, IPs), MSAs, consolidated AR/financials, site-plan acceptance, and full
-- XPMS cost rollups — a cross-tenant leak. Every underlying table has RLS +
-- org-scoped SELECT policies, and the app reads these views only via the
-- authenticated cookie client (createClient()), so invoker mode returns the
-- correct org-scoped rows for legit users and nothing for anon/cross-tenant.
--
-- The 8 public_* marketplace discovery views are intentionally anon-readable
-- and are deliberately left as SECURITY DEFINER (their base tables — vendors,
-- crew_members, rfqs, orgs — have NO anon RLS policy by design; the curated
-- view + hardcoded published/public WHERE filter IS the public surface).
-- Flipping those to invoker would break anon marketplace reads. They are
-- documented as intentional/verified, not changed here.

ALTER VIEW public.offer_letters_resolved                SET (security_invoker = on);
ALTER VIEW public.independent_contractor_msas_resolved  SET (security_invoker = on);
ALTER VIEW public.v_consolidated_ar                     SET (security_invoker = on);
ALTER VIEW public.v_xpms_atom_rollup                    SET (security_invoker = on);
ALTER VIEW public.v_xpms_atom_rollup_recursive          SET (security_invoker = on);
ALTER VIEW public.v_siteplan_sheet_acceptance           SET (security_invoker = on);
ALTER VIEW public.v_package_band_check                  SET (security_invoker = on);
ALTER VIEW public.v_line_permit_flags                   SET (security_invoker = on);

-- Revoke the anon SELECT grant: these are internal, authenticated-only surfaces.
REVOKE SELECT ON public.offer_letters_resolved                FROM anon;
REVOKE SELECT ON public.independent_contractor_msas_resolved  FROM anon;
REVOKE SELECT ON public.v_consolidated_ar                     FROM anon;
REVOKE SELECT ON public.v_xpms_atom_rollup                    FROM anon;
REVOKE SELECT ON public.v_xpms_atom_rollup_recursive          FROM anon;
REVOKE SELECT ON public.v_siteplan_sheet_acceptance           FROM anon;
REVOKE SELECT ON public.v_package_band_check                  FROM anon;
REVOKE SELECT ON public.v_line_permit_flags                   FROM anon;
