-- Extend storage RLS to include the procore-parity bucket so the
-- /console/photos/upload flow (and other procore-parity attachments)
-- can write through authenticated server actions. The bucket itself
-- already exists (created in 20260430_000038_procore_parity.sql) but
-- was never added to the read/write whitelist, leaving it inert.
--
-- Same approach as the incident-photos extension migration: drop and
-- recreate the two policies with the bucket added to the IN list.

drop policy if exists storage_signed_read on storage.objects;
create policy storage_signed_read on storage.objects for select
  using (bucket_id in ('advancing','receipts','proposals','credentials','branding','incident-photos','procore-parity'));

drop policy if exists storage_authenticated_upload on storage.objects;
create policy storage_authenticated_upload on storage.objects for insert
  with check (auth.role() = 'authenticated'
              and bucket_id in ('advancing','receipts','proposals','credentials','branding','incident-photos','procore-parity'));
