-- Fix: restore the event_guides SELECT policy dropped by a CASCADE.
--
-- ROOT CAUSE
-- `0066_unified_assignments_drop_legacy.sql` ran `DROP TABLE IF EXISTS public.tickets CASCADE;`.
-- The pre-existing SELECT policy `event_guides_select_consolidated` (from the 0001
-- snapshot) had an `EXISTS (SELECT 1 FROM public.tickets ...)` clause, so the CASCADE
-- silently dropped that policy along with the table. That left `public.event_guides`
-- with RLS enabled but NO permissive SELECT policy → default-deny on every read.
--
-- SYMPTOM (found via RLS/browser testing, not the service-role E2E sim)
-- The Event Guides / Boarding Pass CMS save (`upsertGuideAction`) uses an upsert with
-- `return=representation`. Postgres applies INSERT WITH CHECK (which still passed) AND
-- then must SELECT the row back for RETURNING. With no SELECT policy, the read was
-- denied and the whole statement failed with 42501:
--   "new row violates row-level security policy for table \"event_guides\"".
-- Org owners could not author guides at all, and org members could not read guides
-- through the app (portal `/p/[slug]/guide`, mobile `/m/guide`). Service-role paths
-- (seed + e2e-lifecycle-sim) bypassed RLS, so this was invisible to the data-layer run.
--
-- FIX
-- Recreate the SELECT policy WITHOUT the dead `public.tickets` dependency. The original
-- policy's third operand (`OR published = true`) already granted public read of published
-- guides, which made the `tickets` EXISTS clause fully redundant even before the drop.
-- Per the 0061+ advancing canon, guest entitlement now lives in the `assignments` domain;
-- guide visibility is correctly gated by `published = true`, not by legacy ticket rows.
--
-- Net semantics (unchanged intent): org members read their org's guides; everyone may
-- read a guide once it is published.

drop policy if exists "event_guides_select_consolidated" on "public"."event_guides";
drop policy if exists "event_guides_select" on "public"."event_guides";

create policy "event_guides_select" on "public"."event_guides"
  for select
  using (
    private.is_org_member(org_id)
    or published = true
  );
