-- Unified Assignment Domain — Step 3/7
-- Backfill per-individual deliverable rows → assignments.
--
-- Rules:
--   1. Every per-individual deliverable (assignee_id IS NOT NULL AND type
--      matches one of the 9 catalog kinds added by 0049) becomes an
--      assignments row with party_kind='user'.
--   2. Orphans (catalog_item_id IS NULL) get an auto-created legacy
--      master_catalog_items row so the new NOT NULL FK is satisfied.
--   3. Credential rows additionally populate credential_assignment_details.
--      (Other 8 kinds carry no structured data beyond title/notes → use
--      assignments.data JSONB.)
--   4. After copying, DELETE the backfilled per-individual deliverables.
--      Their content is now in assignments — keeping them would be the
--      "legacy" the user explicitly rejected.

DO $BACKFILL$
DECLARE
  d record;
  v_catalog_id uuid;
  v_catalog_kind public.catalog_kind;
  v_assignment_id uuid;
  v_count int := 0;
BEGIN
  FOR d IN
    SELECT id, org_id, project_id, type, assignee_id, catalog_item_id,
           atom_id, title, data, fulfillment_state, deadline, version,
           created_at, updated_at, deleted_at, closed_at, closed_by,
           submitted_by, submitted_at
    FROM public.deliverables
    WHERE assignee_id IS NOT NULL
      AND type IN (
        'credential_assignment','catering_assignment','radio_assignment',
        'tool_assignment','equipment_assignment','uniform_assignment',
        'travel_assignment','lodging_assignment','vehicle_assignment'
      )
  LOOP
    v_catalog_kind := substring(d.type::text from '^(.*)_assignment$')::public.catalog_kind;

    IF d.catalog_item_id IS NULL THEN
      INSERT INTO public.master_catalog_items (org_id, kind, code, name, description, active)
      VALUES (
        d.org_id,
        v_catalog_kind,
        'legacy-' || left(d.id::text, 8),
        COALESCE(d.title, v_catalog_kind::text || ' (legacy)'),
        'Auto-created during 0063 backfill from deliverables.' || d.id,
        true
      )
      RETURNING id INTO v_catalog_id;
    ELSE
      v_catalog_id := d.catalog_item_id;
    END IF;

    INSERT INTO public.assignments (
      org_id, project_id, catalog_item_id, party_kind, party_user_id,
      fulfillment_state, title, data, atom_id, deadline, version,
      created_at, created_by, updated_at, deleted_at, closed_at, closed_by
    ) VALUES (
      d.org_id, d.project_id, v_catalog_id, 'user', d.assignee_id,
      d.fulfillment_state, d.title, d.data, d.atom_id, d.deadline, d.version,
      d.created_at, d.submitted_by, d.updated_at, d.deleted_at, d.closed_at, d.closed_by
    )
    RETURNING id INTO v_assignment_id;

    IF v_catalog_kind = 'credential' THEN
      INSERT INTO public.credential_assignment_details (assignment_id, must_return)
      VALUES (v_assignment_id, true);
    END IF;

    -- Carry the original submit timestamp into the event journal so the
    -- audit trail survives the table move.
    IF d.submitted_at IS NOT NULL AND d.submitted_by IS NOT NULL THEN
      INSERT INTO public.assignment_events (assignment_id, org_id, event_kind, actor_user_id, payload, at)
      VALUES (
        v_assignment_id, d.org_id, 'version', d.submitted_by,
        jsonb_build_object('source','deliverable_backfill','deliverable_id', d.id),
        d.submitted_at
      );
    END IF;

    DELETE FROM public.deliverables WHERE id = d.id;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled % per-individual deliverables into assignments', v_count;
END $BACKFILL$;
