-- Unified Assignment Domain — Step 5/7
-- Backfill asset_links → assignment_scan_codes.
--
-- asset_links binds a physical chip (NFC/RFID/barcode/QR) to a
-- credentials.id. After this migration, the same binding is expressed as
-- an assignment_scan_codes row pointing at the credential's assignment.
--
-- We can only backfill links whose credentials.crew_member_id resolves
-- through crew_members.user_id to an assignment with party_user_id =
-- that user. Links to legacy credentials with no matching assignment
-- get logged and dropped — they're orphan bindings to chips for
-- credentials that were never issued as advancing assignments.

DO $BACKFILL$
DECLARE
  r record;
  v_assignment_id uuid;
  v_user_id uuid;
  v_code_kind public.assignment_scan_code_kind;
  v_linked int := 0;
  v_orphan int := 0;
BEGIN
  -- Alias the table to `link` (not `al`) because PL/pgSQL would conflict
  -- the table alias with the loop record variable if both were `al`.
  FOR r IN
    SELECT link.id, link.org_id, link.credential_id, link.asset_kind, link.asset_serial,
           link.issued_at, link.revoked_at, c.crew_member_id
    FROM public.asset_links link
    JOIN public.credentials c ON c.id = link.credential_id
  LOOP
    SELECT cm.user_id INTO v_user_id FROM public.crew_members cm WHERE cm.id = r.crew_member_id;

    v_assignment_id := NULL;
    IF v_user_id IS NOT NULL THEN
      SELECT a.id INTO v_assignment_id
      FROM public.assignments a
      WHERE a.org_id = r.org_id
        AND a.catalog_kind = 'credential'
        AND a.party_user_id = v_user_id
      ORDER BY a.created_at DESC LIMIT 1;
    END IF;

    IF v_assignment_id IS NULL THEN v_orphan := v_orphan + 1; CONTINUE; END IF;

    v_code_kind := CASE r.asset_kind
      WHEN 'nfc_tag'   THEN 'nfc'::public.assignment_scan_code_kind
      WHEN 'rfid_card' THEN 'rfid'::public.assignment_scan_code_kind
      WHEN 'barcode'   THEN 'barcode'::public.assignment_scan_code_kind
      WHEN 'qr_code'   THEN 'qr'::public.assignment_scan_code_kind
    END;

    INSERT INTO public.assignment_scan_codes (
      assignment_id, org_id, kind, code, active, issued_at, voided_at
    ) VALUES (
      v_assignment_id, r.org_id, v_code_kind, r.asset_serial,
      r.revoked_at IS NULL, r.issued_at, r.revoked_at
    );
    v_linked := v_linked + 1;
  END LOOP;

  RAISE NOTICE 'asset_links backfill: % bound to assignments, % orphans skipped', v_linked, v_orphan;
END $BACKFILL$;
