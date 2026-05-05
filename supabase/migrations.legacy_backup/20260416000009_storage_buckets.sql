-- flyingbluewhale · storage buckets + policies
-- Run with service role — modifies storage.objects RLS.

insert into storage.buckets (id, name, public) values
  ('advancing', 'advancing', false),
  ('receipts', 'receipts', false),
  ('proposals', 'proposals', false),
  ('credentials', 'credentials', false),
  ('branding', 'branding', true)
  on conflict (id) do nothing;

-- Signed-URL only; uploads gated by path prefix convention /{bucket}/{project_id | user_id}/...
create policy storage_signed_read on storage.objects for select
  using (bucket_id in ('advancing','receipts','proposals','credentials','branding'));

create policy storage_authenticated_upload on storage.objects for insert
  with check (auth.role() = 'authenticated'
               and bucket_id in ('advancing','receipts','proposals','credentials','branding'));

create policy storage_owner_modify on storage.objects for update
  using (owner = auth.uid()) with check (owner = auth.uid());

create policy storage_owner_delete on storage.objects for delete using (owner = auth.uid());
