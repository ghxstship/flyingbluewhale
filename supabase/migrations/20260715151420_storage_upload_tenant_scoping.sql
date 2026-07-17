-- SECURITY — close the cross-tenant storage write hole.
--
-- See docs/compvss/SECURITY_FINDING_storage_upload_policy.md for the
-- discovery. In short:
--
--   storage_service_role_buckets_upload
--     applies_to : {authenticated}        ← not service_role, despite the name
--     with_check : bucket_id = ANY (ARRAY['proposals','receipts','credentials',
--                                         'branding','procore-parity',
--                                         'personal-documents'])
--
-- Bucket and nothing else. No org scoping, no ownership, no path constraint.
-- Any authenticated user of any tenant could write an object under any path
-- in six buckets — including another org's prefix in `credentials` and
-- `personal-documents`, which hold passports, licences and tax forms.
-- Verified by behaviour under a real member JWT before writing this.
--
-- ── Why it can be dropped outright ───────────────────────────────────────
--
-- `service_role` has rolbypassrls = true (verified against pg_roles). RLS
-- policies DO NOT APPLY to it. So a policy named for the service role and
-- granted to `authenticated` never did anything for service callers — it
-- was pure liability. Dropping it costs those callers nothing.
--
-- Audited every writer into the six buckets first, because a policy change
-- is only safe if you know who it breaks:
--
--   receipts            ap-ocr, vendor-invoices        SERVICE  → unaffected
--   personal-documents  workforce/docs-action          SERVICE  → unaffected
--   proposals           (no upload caller anywhere)             → unaffected
--   credentials         (no upload caller anywhere)             → unaffected
--   procore-parity      daily-log photo, photos/upload  USER    → needs a policy
--   branding            api/v1/branding/upload          USER    → needs a policy
--
-- The two USER-client buckets already write `{org_id}/…` as segment 1, so
-- they satisfy the org-scoped rule as-is. No application change is needed.
--
-- ── The model ────────────────────────────────────────────────────────────
--
-- Tenant isolation is expressed ONE way, in ONE place:
--
--     storage.foldername(name)[1] = an org the caller is an active member of
--
-- A helper carries the rule so adding a bucket is a one-line list change and
-- can never accidentally ship without the tenant check — which is exactly
-- how the hole was born (someone wrote a bucket list and attached it to the
-- wrong role).
--
-- Buckets split cleanly by WHO WRITES THEM:
--
--   USER-WRITABLE   the app writes as the signed-in user. Must be org-scoped.
--                   advancing · incident-photos · procore-parity · branding
--   SERVICE-ONLY    only a server-side service client writes. Needs NO policy
--                   at all (bypassrls) — and having one is how this happened.
--                   receipts · proposals · credentials · personal-documents ·
--                   exports · forms · site-plans
--
-- Adding a bucket later: if a USER client writes it, add it to the helper's
-- list AND make the caller write `{org_id}/…`. If only a service client
-- writes it, add NOTHING. The guard test
-- (src/lib/db/storage-tenant-scoping.test.ts) fails any INSERT policy that
-- grants `authenticated` without going through the helper.

-- ── The rule, in one place ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION "storage"."caller_owns_org_prefix"("object_name" "text")
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'storage'
AS $$
  -- Segment 1 of the path must be an org the caller is an ACTIVE member of.
  -- A soft-deleted membership is an offboarded person; they keep nothing.
  select exists (
    select 1
    from public.memberships m
    where m.user_id = (select auth.uid())
      and m.org_id::text = (storage.foldername(object_name))[1]
      and m.deleted_at is null
  );
$$;

COMMENT ON FUNCTION "storage"."caller_owns_org_prefix"("text") IS
  'Tenant isolation for storage writes: path segment 1 must be an org the caller actively belongs to. The single expression of the rule — every authenticated storage policy routes through it.';

-- ── USER-writable buckets: one policy, always tenant-scoped ─────────────
DROP POLICY IF EXISTS "storage_org_scoped_upload" ON "storage"."objects";

CREATE POLICY "storage_org_scoped_upload" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK (
    "bucket_id" = ANY (ARRAY[
      'advancing',          -- portal advancing uploads
      'incident-photos',    -- COMPVSS incident + lost & found capture
      'procore-parity',     -- daily-log photos, site photo log, handover
      'branding',           -- org logo (public READ; write stays org-scoped)
      -- Added after the fact: a concurrent session created this bucket an
      -- hour before this migration landed, so this list could not have known
      -- about it, and the DROP/CREATE below silently removed it from the
      -- policy — breaking /m/market uploads in production. Restored live by
      -- 20260715220000; kept here so a replay of this file doesn't break it
      -- again.
      'listing-photos'      -- COMPVSS marketplace listing photos
    ])
    AND "storage"."caller_owns_org_prefix"("name")
  );

-- ── Close the hole ───────────────────────────────────────────────────────
-- Granted every authenticated user unscoped write to six buckets. Service
-- callers bypass RLS and never needed it.
DROP POLICY IF EXISTS "storage_service_role_buckets_upload" ON "storage"."objects";

-- Same shape, smaller blast radius: `bucket_id = 'branding'` with no tenant
-- check let any user overwrite any org's logo. Folded into the policy above.
DROP POLICY IF EXISTS "branding_authenticated_write" ON "storage"."objects";
