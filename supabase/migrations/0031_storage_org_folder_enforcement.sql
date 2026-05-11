-- Enforce org-folder layout for buckets that accept user-direct uploads.
--
-- ⚠️ Cannot be applied via MCP / supabase migrate — modifying policies on
-- storage.objects requires the `supabase_admin` role. Run via Dashboard
-- → SQL Editor (entry added to docs/runbooks/seaworthy-ops.md).
--
-- This 0031 form was authored but never actually applied to the remote
-- (Supabase migrate hit 42501). The canonical replacement lives at
-- 0045_storage_org_folder_enforcement_v2.sql. We keep the file in the
-- migration chain for audit, but wrap every storage.objects statement
-- in DO blocks that catch insufficient_privilege so:
--   - local Docker `supabase db reset` no-ops the block (postgres
--     can't touch storage.objects either; the dev env doesn't need
--     these policies)
--   - the remote tracker has it recorded as applied (it's a no-op
--     either way; the actual policies live in 0045 once an operator
--     runs that via Dashboard)

DO $sa$ BEGIN
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
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping storage.objects policies — current role lacks supabase_admin. Apply via Dashboard SQL Editor.';
END $sa$;
