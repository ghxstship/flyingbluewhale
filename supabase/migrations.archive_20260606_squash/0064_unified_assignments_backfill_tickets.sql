-- Unified Assignment Domain — Step 4/7
-- Backfill tickets + ticket_types + ticket_scans → assignments + sibling
-- tables + scan codes + event journal. Idempotent and zero-row safe.
--
-- Mapping:
--   ticket_types  → master_catalog_items (kind='ticket')  — one per (org, name)
--   tickets       → assignments + ticket_assignment_details + assignment_scan_codes
--                   party_kind: 'user' if holder_email matches an auth.users
--                   row (case-insensitive), else 'external_holder' with a
--                   new assignment_external_holders row.
--   ticket_scans  → assignment_events (event_kind='scan')

DO $BACKFILL$
DECLARE
  tt record;
  t record;
  ts record;
  v_catalog_id uuid;
  v_assignment_id uuid;
  v_external_id uuid;
  v_party_user_id uuid;
  v_scan_code_id uuid;
  v_ticket_count int := 0;
  v_scan_count int := 0;
  v_type_count int := 0;
BEGIN
  -- Tier-based catalog: one master_catalog_items row per (org, tier).
  -- Use a synthetic code that survives ticket_types being absent.
  FOR tt IN
    SELECT DISTINCT org_id, tier
    FROM public.tickets
    WHERE NOT EXISTS (
      SELECT 1 FROM public.master_catalog_items mci
      WHERE mci.org_id = tickets.org_id
        AND mci.kind = 'ticket'
        AND mci.code = 'ticket-' || lower(replace(tickets.tier, ' ', '-'))
    )
  LOOP
    INSERT INTO public.master_catalog_items (org_id, kind, code, name, active)
    VALUES (tt.org_id, 'ticket', 'ticket-' || lower(replace(tt.tier, ' ', '-')), tt.tier, true);
    v_type_count := v_type_count + 1;
  END LOOP;

  -- Pre-existing ticket_types (priced allocations) also become catalog rows.
  FOR tt IN
    SELECT id, org_id, name, channel, price_cents, currency, allocation
    FROM public.ticket_types
  LOOP
    INSERT INTO public.master_catalog_items (org_id, kind, code, name, unit_cost_cents, currency, inventory_qty, active)
    VALUES (
      tt.org_id, 'ticket', 'ticket-type-' || left(tt.id::text, 8),
      tt.name, NULLIF(tt.price_cents, 0), COALESCE(tt.currency, 'USD'), NULLIF(tt.allocation, 0), true
    )
    ON CONFLICT (org_id, code) DO NOTHING;
    v_type_count := v_type_count + 1;
  END LOOP;

  -- Tickets → assignments
  FOR t IN
    SELECT id, org_id, project_id, code, holder_name, holder_email, tier,
           status, issued_at, scanned_at, scanned_by, updated_at
    FROM public.tickets
  LOOP
    -- Resolve catalog row by tier (created above).
    SELECT id INTO v_catalog_id
    FROM public.master_catalog_items
    WHERE org_id = t.org_id
      AND kind = 'ticket'
      AND code = 'ticket-' || lower(replace(t.tier, ' ', '-'));

    -- Resolve party: registered user wins; else external holder.
    v_party_user_id := NULL;
    v_external_id := NULL;
    IF t.holder_email IS NOT NULL THEN
      SELECT u.id INTO v_party_user_id
      FROM auth.users u
      WHERE lower(u.email) = lower(t.holder_email)
      LIMIT 1;
    END IF;

    IF v_party_user_id IS NULL THEN
      INSERT INTO public.assignment_external_holders (org_id, project_id, holder_name, holder_email)
      VALUES (t.org_id, t.project_id, t.holder_name, t.holder_email)
      RETURNING id INTO v_external_id;
    END IF;

    INSERT INTO public.assignments (
      org_id, project_id, catalog_item_id,
      party_kind, party_user_id, party_external_id,
      fulfillment_state, title, issued_at, fulfilled_at, updated_at
    ) VALUES (
      t.org_id, t.project_id, v_catalog_id,
      CASE WHEN v_party_user_id IS NOT NULL THEN 'user'::public.assignment_party_kind ELSE 'external_holder'::public.assignment_party_kind END,
      v_party_user_id, v_external_id,
      CASE t.status::text
        WHEN 'issued'      THEN 'issued'::public.fulfillment_state
        WHEN 'transferred' THEN 'transferred'::public.fulfillment_state
        WHEN 'scanned'     THEN 'redeemed'::public.fulfillment_state
        WHEN 'voided'      THEN 'voided'::public.fulfillment_state
      END,
      COALESCE(t.holder_name, t.tier || ' ticket'),
      t.issued_at, t.scanned_at, t.updated_at
    )
    RETURNING id INTO v_assignment_id;

    INSERT INTO public.ticket_assignment_details (assignment_id, tier_code, transferable)
    VALUES (v_assignment_id, t.tier, true);

    -- Carry the ticket's barcode forward as the active scan code.
    INSERT INTO public.assignment_scan_codes (
      assignment_id, org_id, kind, code, active, issued_at,
      voided_at, voided_by
    ) VALUES (
      v_assignment_id, t.org_id, 'barcode', t.code,
      t.status::text <> 'voided',
      t.issued_at,
      CASE WHEN t.status::text = 'voided' THEN COALESCE(t.scanned_at, t.updated_at) END,
      CASE WHEN t.status::text = 'voided' THEN t.scanned_by END
    )
    RETURNING id INTO v_scan_code_id;

    -- For each historical scan event, replay into assignment_events.
    FOR ts IN
      SELECT id, scanner_id, scanned_at, location, result
      FROM public.ticket_scans
      WHERE ticket_id = t.id
    LOOP
      INSERT INTO public.assignment_events (
        assignment_id, org_id, event_kind, actor_user_id, scan_code_id,
        result, location, at
      ) VALUES (
        v_assignment_id, t.org_id, 'scan', ts.scanner_id, v_scan_code_id,
        ts.result::public.assignment_scan_result, ts.location, ts.scanned_at
      );
      v_scan_count := v_scan_count + 1;
    END LOOP;

    v_ticket_count := v_ticket_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled % ticket_types/tiers → catalog, % tickets → assignments, % scans → events',
    v_type_count, v_ticket_count, v_scan_count;
END $BACKFILL$;
