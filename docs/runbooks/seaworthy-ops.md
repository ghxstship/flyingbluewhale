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

## 2 · Auth: enable HaveIBeenPwned password leak protection

Project-level toggle, not in code.

**Click path:** Supabase Dashboard → Project → Authentication → Policies
→ Password Strength → enable "Check passwords against HaveIBeenPwned".

After enabling, the Supabase security advisor's
`auth_leaked_password_protection` finding clears.

## 3 · (Optional) Schedule the `job-worker` edge function

`job-worker` was deployed in commit `3cd8059` but isn't on a recurring
schedule yet. To wire it to the documented 1-minute cadence:

```bash
supabase functions schedule create job-worker "*/1 * * * *"
```

(Requires the Supabase CLI installed locally; the dashboard equivalent
is Project → Edge Functions → job-worker → Schedule → New schedule.)
