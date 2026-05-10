# Seaworthy ops runbook

Items that can't be applied via `apply_migration` because they require
either the `supabase_admin` role (storage policies) or the Supabase
Dashboard (project-level auth config). Each entry below is the exact
SQL or click-path an operator runs once.

## 1 · Storage: extend `storage_authenticated_upload` + `storage_signed_read` to cover `procore-parity`

The `procore-parity` storage bucket was created by the
`20260430_000038_procore_parity.sql` migration as the upload target for
project photos, daily-log photos, and inspection evidence under the
procore-parity feature set, but no upload/read policy was added.

**Run via Supabase Dashboard → SQL Editor (logged in as service_role):**

```sql
drop policy if exists storage_authenticated_upload on storage.objects;
create policy storage_authenticated_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any (array[
      'advancing','receipts','proposals','credentials',
      'branding','incident-photos','procore-parity'
    ])
  );

drop policy if exists storage_signed_read on storage.objects;
create policy storage_signed_read on storage.objects
  for select
  using (
    bucket_id = any (array[
      'advancing','receipts','proposals','credentials',
      'branding','incident-photos','procore-parity'
    ])
  );
```

After running, `select count(*) from pg_policies where schemaname='storage'`
should still be 5; only the array contents change.

## 1b · Storage: enforce org-folder layout for user-direct uploads

The buckets that accept user-direct uploads (`advancing`, `incident-photos`)
must require the path's first folder to be one of the uploader's org_ids
— otherwise a user in Org A can upload into Org B's prefix. The companion
file is `supabase/migrations/20260509100009_storage_org_folder_enforcement.sql`.

**Run via Supabase Dashboard → SQL Editor (logged in as service_role):**

```sql
drop policy if exists storage_authenticated_upload on storage.objects;

create policy storage_service_role_buckets_upload on storage.objects
  for insert to authenticated
  with check (
    bucket_id = any (array[
      'proposals'::text, 'receipts'::text, 'credentials'::text,
      'branding'::text, 'procore-parity'::text
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
```

After running, the existing `storage_authenticated_upload` policy is
gone and two replacements own the surface. Verify with
`select policyname from pg_policies where schemaname='storage'` —
expect `storage_service_role_buckets_upload`,
`storage_org_scoped_upload`, plus the unchanged `storage_signed_read`,
`storage_owner_modify`, `storage_owner_delete`, `exports_select`.

## 2 · Auth: enable HaveIBeenPwned password leak protection

Project-level toggle, not in code.

**Click path:** Supabase Dashboard → Project → Authentication → Policies
→ Password Strength → enable "Check passwords against HaveIBeenPwned".

After enabling, the Supabase security advisor's
`auth_leaked_password_protection` finding clears.

## 3 · `job-worker` edge function — redeploy + token + schedule

The local source was hardened to require `JOB_WORKER_TOKEN`. Redeploy and
set the secret:

```bash
# 1. Set the secret (any random ≥32-byte value)
TOKEN=$(openssl rand -base64 32)
supabase secrets set JOB_WORKER_TOKEN="$TOKEN"

# 2. Redeploy with the hardened source (jwt off — token is the new gate)
supabase functions deploy job-worker --no-verify-jwt

# 3. Wire to cron with the token in the Authorization header
supabase functions schedule create job-worker "*/1 * * * *" \
  --headers "Authorization=Bearer $TOKEN"
```

Without `JOB_WORKER_TOKEN` set the function will fail-closed with a 503,
which is the desired behaviour — better to under-process the queue than
to expose a publicly-triggerable run loop.
