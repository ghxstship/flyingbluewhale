-- Restore `listing-photos` to the authenticated upload allowlist.
--
-- TWO SESSIONS FIXED THE SAME HOLE, AND THE SECOND FIX ERASED PART OF THE
-- FIRST. Both independently found `storage_service_role_buckets_upload`
-- granted to {authenticated} with no tenant check, and both closed it. Mine
-- (20260715180000) ALTERed the existing policy and added the new
-- `listing-photos` bucket to it. Theirs (20260715190000) — which is the better
-- fix, and the one that survives — DROP/CREATEd the policy around a named
-- `caller_owns_org_prefix()` helper, with a bucket list that could not have
-- known about a bucket created an hour earlier by someone else.
--
-- Net effect on production: /m/market photo uploads were denied by RLS from
-- the moment their migration landed. The feature was shipped and broken in
-- the same afternoon, and nothing surfaced it — the upload failure lands as a
-- soft "N of N photos could not be uploaded" warning on an otherwise
-- successful listing.
--
-- This adds the one missing bucket back. It deliberately keeps THEIR shape:
-- the tenant rule stays in the helper, and this policy gains no predicate of
-- its own. ALTER rather than DROP/CREATE so their role grants survive
-- untouched — the same courtesy their DROP/CREATE couldn't extend to mine.
--
-- The helper is `private.caller_owns_org_prefix` because that is what is
-- actually installed; their migration FILE creates `storage.caller_owns_org_prefix`
-- and has diverged from the database. If that file is ever re-applied, it will
-- DROP/CREATE this policy again — `listing-photos` has been added to its array
-- too, so a replay keeps it rather than silently breaking the marketplace a
-- second time.

alter policy "storage_org_scoped_upload" on "storage"."objects"
  with check (
    "bucket_id" = any (array[
      'advancing',          -- portal advancing uploads
      'incident-photos',    -- COMPVSS incident + lost & found capture
      'procore-parity',     -- daily-log photos, site photo log, handover
      'branding',           -- org logo (public READ; write stays org-scoped)
      'listing-photos'      -- COMPVSS marketplace listing photos
    ])
    and "private"."caller_owns_org_prefix"("name")
  );
