-- Sweep 17 — same auth_rls_initplan optimization for storage.objects
-- policies. 4 policies rewritten.

DROP POLICY IF EXISTS exports_select ON storage.objects;
CREATE POLICY exports_select ON storage.objects FOR SELECT TO authenticated
USING ((bucket_id = 'exports'::text) AND ((storage.foldername(name))[1] = ((SELECT auth.jwt()) ->> 'sub'::text)));

DROP POLICY IF EXISTS storage_authenticated_upload ON storage.objects;
CREATE POLICY storage_authenticated_upload ON storage.objects FOR INSERT TO public
WITH CHECK (((SELECT auth.role()) = 'authenticated'::text) AND (bucket_id = ANY (ARRAY['advancing'::text, 'receipts'::text, 'proposals'::text, 'credentials'::text, 'branding'::text, 'incident-photos'::text, 'procore-parity'::text])));

DROP POLICY IF EXISTS storage_owner_delete ON storage.objects;
CREATE POLICY storage_owner_delete ON storage.objects FOR DELETE TO public
USING (owner = (SELECT auth.uid()));

DROP POLICY IF EXISTS storage_owner_modify ON storage.objects;
CREATE POLICY storage_owner_modify ON storage.objects FOR UPDATE TO public
USING (owner = (SELECT auth.uid()));
