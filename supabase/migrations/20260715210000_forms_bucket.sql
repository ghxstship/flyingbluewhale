-- The `forms` bucket never existed.
--
-- `submitFormAction` has always uploaded file answers to `storage.from("forms")`,
-- and there is no such bucket — so every upload returned "Bucket not found",
-- and because that path `return`s an error, ANY public form with a file field
-- was impossible to submit at all. Not a silent drop this time: the form was
-- simply broken, for anyone who tried, for as long as it has shipped.
--
-- Uploads run through the SERVICE client (anonymous visitors submit these,
-- after captcha + a closed MIME allowlist), and service_role bypasses RLS, so
-- this bucket deliberately gets NO insert policy. An authenticated INSERT
-- grant here would hand every logged-in user a writable public-facing bucket
-- for nothing — the exact shape of the hole closed in 20260715180000.
--
-- Reads are the console reviewing submissions, so they ride the standard
-- org-scoped read policy. That requires the object's first path segment to be
-- the org id, which is why the upload path gains an org prefix in the same
-- change (it was `form-uploads/<form_id>/...` — org-less, and therefore
-- unreadable by any policy we would want to write).

insert into storage.buckets (id, name, public)
values ('forms', 'forms', false)
on conflict (id) do nothing;

alter policy "storage_org_scoped_read" on storage.objects
  using (
    bucket_id = any (array['advancing', 'receipts', 'proposals', 'credentials', 'branding',
                           'incident-photos', 'procore-parity', 'personal-documents',
                           'listing-photos', 'forms'])
    and exists (
      select 1
      from public.memberships m
      where m.user_id = (select auth.uid())
        and m.org_id::text = (storage.foldername(name))[1]
        and m.deleted_at is null
    )
  );
