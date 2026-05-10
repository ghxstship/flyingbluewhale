-- Enforce org-folder layout for buckets that accept user-direct uploads.
--
-- ⚠️ Cannot be applied via MCP / supabase migrate — modifying policies on
-- storage.objects requires the `supabase_admin` role. Run via Dashboard
-- → SQL Editor (entry added to docs/runbooks/seaworthy-ops.md).
--
-- Buckets in scope (path[1] must be one of the user's org_ids):
--   - incident-photos   (api/v1/incidents/photo-upload — already correct)
--   - advancing         (portal/p/[slug]/artist/advancing/actions.ts — refactored)
--
-- Buckets out of scope (only written by service-role server jobs):
--   - proposals, receipts, credentials, branding, procore-parity
--   These keep a permissive contract because compileAndStore writes via
--   the service-role client and never targets them from a session-scoped
--   createClient() pathway.

drop policy if exists storage_authenticated_upload on storage.objects;

create policy storage_service_role_buckets_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any (array[
      'proposals'::text,
      'receipts'::text,
      'credentials'::text,
      'branding'::text,
      'procore-parity'::text
    ])
  );

create policy storage_org_scoped_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any (array['advancing'::text, 'incident-photos'::text])
    and exists (
      select 1
      from public.memberships m
      where m.user_id = (select auth.uid())
        and m.org_id::text = (storage.foldername(name))[1]
    )
  );

comment on policy storage_service_role_buckets_upload on storage.objects is
  'Permissive insert for service-role-only buckets (PDF generators write '
  'via compileAndStore in src/lib/pdf/render.ts).';

comment on policy storage_org_scoped_upload on storage.objects is
  'Org-folder enforcement for user-direct upload buckets. Path[1] must be '
  'one of the user''s org_ids — prevents cross-org folder spam.';
