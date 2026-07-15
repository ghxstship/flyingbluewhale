-- Close a cross-tenant storage write hole, and add the listing-photos bucket.
--
-- THE HOLE
--
-- `storage_service_role_buckets_upload` was granted to `authenticated`, not
-- to service_role, and its entire predicate was a bucket_id list:
--
--   bucket_id = ANY (ARRAY['proposals','receipts','credentials','branding',
--                          'procore-parity','personal-documents'])
--
-- No org check, no user check, no path check. Any authenticated user — a crew
-- member of any unrelated org — could create objects in those six buckets at
-- ANY path, including under another org's folder prefix. Not a read leak
-- (`storage_org_scoped_read` is properly org-scoped) and not an overwrite
-- (`storage_owner_modify` is owner-scoped), but planting content in another
-- tenant's namespace in `credentials` / `personal-documents` / `receipts` is
-- an integrity problem: any surface listing or signing by prefix renders the
-- attacker's object as that org's own. It was also unbounded storage-cost
-- abuse by any logged-in user.
--
-- The name records the intent — this was meant to be service-role-only. But
-- `service_role` has rolbypassrls = true, so RLS never applies to it and the
-- policy granted it nothing. The policy's ONLY effect was the hole, which is
-- why it can simply be dropped rather than re-scoped.
--
-- `branding_authenticated_write` had the same shape (`bucket_id = 'branding'`,
-- no predicate, granted to authenticated) and is superseded below.
--
-- WHAT LEGITIMATELY NEEDS AUTHENTICATED INSERT
--
-- Audited every caller-client upload site. All of them already write under
-- `${session.orgId}/...`, so the org-membership predicate fits with no code
-- change:
--   advancing        p/[slug]/artist/advancing/actions.ts
--   incident-photos  api/v1/incidents/photo-upload, lib/mobile/photo-upload
--   procore-parity   studio/photos/upload, studio/operations/daily-log/[id],
--                    m/daily-log (via uploadFieldPhotos)
--   branding         api/v1/branding/upload, me/talent/actions
--   listing-photos   m/market (new, below)
-- proposals / receipts / credentials / personal-documents have NO caller-client
-- uploads — they are written only through the service client, which bypasses
-- RLS. They therefore lose nothing by dropping the policy.
--
-- ALTER rather than DROP+CREATE so the existing role grants and command are
-- preserved exactly; a re-created policy that guessed `TO authenticated` wrong
-- would silently deny every read.

-- Marketplace listing photos. Private: /m/market is the internal crew
-- marketplace, so listings are org-scoped and read through signed URLs, the
-- same as incident evidence. Not `branding` (that bucket is public).
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', false)
on conflict (id) do nothing;

-- The one org-scoped upload path, now covering every bucket that takes a
-- caller-client write.
alter policy "storage_org_scoped_upload" on storage.objects
  with check (
    bucket_id = any (array['advancing', 'incident-photos', 'procore-parity', 'branding', 'listing-photos'])
    and exists (
      select 1
      from public.memberships m
      where m.user_id = (select auth.uid())
        and m.org_id::text = (storage.foldername(name))[1]
        and m.deleted_at is null
    )
  );

-- Reads: same org-scoped rule, plus the new bucket.
alter policy "storage_org_scoped_read" on storage.objects
  using (
    bucket_id = any (array['advancing', 'receipts', 'proposals', 'credentials', 'branding',
                           'incident-photos', 'procore-parity', 'personal-documents', 'listing-photos'])
    and exists (
      select 1
      from public.memberships m
      where m.user_id = (select auth.uid())
        and m.org_id::text = (storage.foldername(name))[1]
        and m.deleted_at is null
    )
  );

-- Both are now redundant with the org-scoped policy above, and both were
-- unpredicated grants to `authenticated`. RLS is permissive-OR, so leaving
-- either in place would keep the hole open regardless of the policy above.
drop policy if exists "storage_service_role_buckets_upload" on storage.objects;
drop policy if exists "branding_authenticated_write" on storage.objects;
