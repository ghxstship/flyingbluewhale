-- SECURITY:
-- A) proposal_views had an INSERT policy with WITH CHECK (true) for any
--    authenticated user — letting anyone forge proposal-open rows into ANY
--    org / proposal / viewer (tenant-integrity hole; SELECT was already
--    org-scoped). Replace with a check that (a) the logged row is attributed
--    to the caller (viewer_user_id = auth.uid()) and (b) org_id matches the
--    referenced proposal's real org — so the org_id can't be forged and a
--    user can only log their own opens. Preserves the documented portal-write
--    flow (the portal user opening the proposal is authenticated).
--
-- B) The public `branding` bucket has a broad SELECT (list) policy on
--    storage.objects granted to PUBLIC, letting anyone enumerate every object
--    key in the bucket. Public buckets serve object content via the CDN public
--    URL regardless of this policy (getPublicUrl), and no app code calls
--    .list() on branding — only getPublicUrl + createSignedUploadUrl. Drop the
--    list policy to stop key enumeration without affecting public logo reads.

-- ── A. proposal_views INSERT ────────────────────────────────────────────────
DROP POLICY IF EXISTS "proposal_views_insert_authenticated" ON public.proposal_views;

CREATE POLICY "proposal_views_insert_self"
  ON public.proposal_views
  FOR INSERT
  TO authenticated
  WITH CHECK (
    viewer_user_id = (SELECT auth.uid())
    AND org_id = (SELECT p.org_id FROM public.proposals p WHERE p.id = proposal_id)
  );

-- ── B. branding bucket list policy ──────────────────────────────────────────
DROP POLICY IF EXISTS "branding_public_read" ON storage.objects;
