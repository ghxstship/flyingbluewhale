-- Private bucket for incident report attachments (photos).
-- Path convention: {bucket}/{org_id}/{incident_id_or_draft}/{filename}.
-- Reads go through signed URLs served by the app layer, so we only
-- need to permit the standard authenticated write path + owner modify.

insert into storage.buckets (id, name, public)
  values ('incident-photos', 'incident-photos', false)
  on conflict (id) do nothing;

-- Extend the existing signed-read policy to cover the new bucket. We
-- drop + recreate since CREATE POLICY IF NOT EXISTS isn't portable.
drop policy if exists storage_signed_read on storage.objects;
create policy storage_signed_read on storage.objects for select
  using (bucket_id in ('advancing','receipts','proposals','credentials','branding','incident-photos'));

drop policy if exists storage_authenticated_upload on storage.objects;
create policy storage_authenticated_upload on storage.objects for insert
  with check (auth.role() = 'authenticated'
              and bucket_id in ('advancing','receipts','proposals','credentials','branding','incident-photos'));
