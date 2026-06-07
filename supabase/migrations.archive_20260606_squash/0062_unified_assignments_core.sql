-- Unified Assignment Domain — Step 2/7
-- Core tables: the same system assigns/tracks tickets, credentials,
-- catering, radios, tools, equipment, uniforms, travel, lodging, vehicles.
--
-- Shape:
--   assignments                  — per-(party × project × catalog_item)
--   assignment_external_holders  — guest-ticket holders not yet on platform
--   assignment_scan_codes        — many barcodes/QR/NFC chips per assignment
--   assignment_events            — universal scan/audit/comment journal
--   <kind>_assignment_details    — 1:1 sibling tables for the 5 kinds that
--                                  carry structured per-kind fields
--                                  (ticket, credential, lodging, travel, vehicle).
--                                  Catering/radio/tool/equipment/uniform use
--                                  assignments.data JSONB until structured
--                                  requirements emerge.

-- ============================================================
-- 1. Discriminator + supporting enums
-- ============================================================

CREATE TYPE public.assignment_party_kind AS ENUM ('user', 'crew_member', 'external_holder');
CREATE TYPE public.assignment_scan_code_kind AS ENUM ('barcode', 'qr', 'nfc', 'rfid', 'wristband_serial');
CREATE TYPE public.assignment_event_kind AS ENUM ('scan', 'consume', 'state_change', 'comment', 'version', 'void', 'reissue');
CREATE TYPE public.assignment_scan_result AS ENUM ('accepted', 'duplicate', 'voided', 'not_found', 'expired', 'wrong_zone');

-- ============================================================
-- 2. External holders (guest tickets, comps to unknown email, etc.)
-- ============================================================

CREATE TABLE public.assignment_external_holders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  holder_name text,
  holder_email text,
  holder_phone text,
  claimed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (holder_email IS NOT NULL OR holder_phone IS NOT NULL OR holder_name IS NOT NULL)
);

-- Case-insensitive lookup so claim flow (".claim my tickets") finds the
-- holder row regardless of how the email was capitalized at sale time.
CREATE INDEX idx_assignment_external_holders_org_email_ci
  ON public.assignment_external_holders (org_id, lower(holder_email))
  WHERE holder_email IS NOT NULL;
CREATE INDEX idx_assignment_external_holders_claimed_user
  ON public.assignment_external_holders (claimed_user_id)
  WHERE claimed_user_id IS NOT NULL;
CREATE INDEX idx_assignment_external_holders_org_id
  ON public.assignment_external_holders (org_id);
CREATE INDEX idx_assignment_external_holders_project_id
  ON public.assignment_external_holders (project_id)
  WHERE project_id IS NOT NULL;

-- ============================================================
-- 3. assignments (the core row)
-- ============================================================

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- The catalog SKU drives kind, pricing, supplier, inventory. Required:
  -- every assignment is a concrete instance of a catalog item. Free-form
  -- one-offs author a catalog row first.
  catalog_item_id uuid NOT NULL REFERENCES public.master_catalog_items(id) ON DELETE RESTRICT,
  -- Denormalized via trigger from master_catalog_items.kind. Every UI
  -- filters by kind first; the join cost adds up.
  catalog_kind public.catalog_kind NOT NULL,

  -- Exactly-one-of polymorphism for assignee identity.
  party_kind public.assignment_party_kind NOT NULL,
  party_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  party_crew_id uuid REFERENCES public.crew_members(id) ON DELETE SET NULL,
  party_external_id uuid REFERENCES public.assignment_external_holders(id) ON DELETE SET NULL,
  CHECK (
    (party_kind = 'user'            AND party_user_id IS NOT NULL     AND party_crew_id IS NULL          AND party_external_id IS NULL)
    OR (party_kind = 'crew_member'  AND party_crew_id IS NOT NULL     AND party_user_id IS NULL          AND party_external_id IS NULL)
    OR (party_kind = 'external_holder' AND party_external_id IS NOT NULL AND party_user_id IS NULL        AND party_crew_id IS NULL)
  ),

  fulfillment_state public.fulfillment_state NOT NULL DEFAULT 'briefed',
  title text,
  notes text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,

  atom_id uuid REFERENCES public.xpms_atoms(id) ON DELETE SET NULL,

  issued_at timestamptz,
  deadline timestamptz,
  fulfilled_at timestamptz,
  version integer NOT NULL DEFAULT 1,

  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Keep catalog_kind in sync with master_catalog_items.kind on every write.
-- This is the trade-off for the denormalization: instead of a JOIN on every
-- list query, we pay a single-row lookup on each assignment INSERT/UPDATE.
CREATE OR REPLACE FUNCTION public.tg_assignments_sync_catalog_kind()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT kind INTO NEW.catalog_kind
  FROM public.master_catalog_items
  WHERE id = NEW.catalog_item_id;
  IF NEW.catalog_kind IS NULL THEN
    RAISE EXCEPTION 'catalog_item_id % not found', NEW.catalog_item_id;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.tg_assignments_sync_catalog_kind() FROM PUBLIC;

CREATE TRIGGER assignments_sync_catalog_kind
  BEFORE INSERT OR UPDATE OF catalog_item_id ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.tg_assignments_sync_catalog_kind();

CREATE TRIGGER assignments_touch_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_assignments_org_project ON public.assignments (org_id, project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_party_user ON public.assignments (party_user_id) WHERE party_user_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_assignments_party_crew ON public.assignments (party_crew_id) WHERE party_crew_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_assignments_party_external ON public.assignments (party_external_id) WHERE party_external_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_assignments_catalog_item ON public.assignments (catalog_item_id);
CREATE INDEX idx_assignments_kind_state ON public.assignments (org_id, catalog_kind, fulfillment_state) WHERE deleted_at IS NULL;
CREATE INDEX idx_assignments_atom ON public.assignments (atom_id) WHERE atom_id IS NOT NULL;
CREATE INDEX idx_assignments_created_by ON public.assignments (created_by);
CREATE INDEX idx_assignments_closed_by ON public.assignments (closed_by);

COMMENT ON TABLE public.assignments IS
  'Canonical per-individual entitlement table. Every ticket, credential, meal, radio, uniform, hotel room, tool, equipment kit, vehicle, travel itinerary, and visa packet is an assignment row. Project-document deliverables (riders, plots, lists) stay in public.deliverables — different shape (no party, file-centric).';
COMMENT ON COLUMN public.assignments.catalog_kind IS
  'Denormalized from master_catalog_items.kind via tg_assignments_sync_catalog_kind. SSOT is master_catalog_items.kind; this column exists so kind-filtered list queries never need a JOIN.';

-- ============================================================
-- 4. assignment_scan_codes (many codes per assignment)
-- ============================================================

CREATE TABLE public.assignment_scan_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  kind public.assignment_scan_code_kind NOT NULL,
  code text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  issued_at timestamptz NOT NULL DEFAULT now(),
  voided_at timestamptz,
  voided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One active code per (org, code). Voided codes can be reissued.
CREATE UNIQUE INDEX assignment_scan_codes_org_code_active_uniq
  ON public.assignment_scan_codes (org_id, code) WHERE active = true;
CREATE INDEX idx_assignment_scan_codes_assignment ON public.assignment_scan_codes (assignment_id);
CREATE INDEX idx_assignment_scan_codes_voided_by ON public.assignment_scan_codes (voided_by) WHERE voided_by IS NOT NULL;
CREATE INDEX idx_assignment_scan_codes_org_id ON public.assignment_scan_codes (org_id);

COMMENT ON TABLE public.assignment_scan_codes IS
  'Physical/digital scan tokens bound to an assignment. Many per assignment to support reprints, wristband re-bands at gate, multiple device tokens. UNIQUE (org_id, code) WHERE active enforces O(1) gate scans without losing audit trail.';

-- ============================================================
-- 5. assignment_events (universal journal — replaces ticket_scans +
--    deliverable_history + deliverable_comments)
-- ============================================================

CREATE TABLE public.assignment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  event_kind public.assignment_event_kind NOT NULL,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_code_id uuid REFERENCES public.assignment_scan_codes(id) ON DELETE SET NULL,
  result public.assignment_scan_result,            -- meaningful only when event_kind='scan'
  from_state public.fulfillment_state,              -- meaningful only when event_kind='state_change'
  to_state public.fulfillment_state,                -- meaningful only when event_kind='state_change'
  location jsonb,                                   -- {lat,lng,accuracy} for scans
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  body text,                                        -- meaningful only when event_kind='comment'
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignment_events_assignment ON public.assignment_events (assignment_id, at DESC);
CREATE INDEX idx_assignment_events_org_kind ON public.assignment_events (org_id, event_kind, at DESC);
CREATE INDEX idx_assignment_events_actor ON public.assignment_events (actor_user_id) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_assignment_events_scan_code ON public.assignment_events (scan_code_id) WHERE scan_code_id IS NOT NULL;
CREATE INDEX idx_assignment_events_org_at ON public.assignment_events (org_id, at DESC);

COMMENT ON TABLE public.assignment_events IS
  'Universal event journal for every assignment. event_kind discriminates: scan (with result+location), state_change (with from/to_state), comment (body), version (payload=snapshot), void, reissue, consume. Replaces ticket_scans + deliverable_history + deliverable_comments.';

-- ============================================================
-- 6. Per-kind detail siblings (1:1 with assignments.id)
-- ============================================================

CREATE TABLE public.ticket_assignment_details (
  assignment_id uuid PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
  tier_code text,
  zone_codes text[] NOT NULL DEFAULT '{}',
  gate_codes text[] NOT NULL DEFAULT '{}',
  transferable boolean NOT NULL DEFAULT false,
  valid_from timestamptz,
  valid_until timestamptz,
  seat_section text,
  seat_row text,
  seat_number text
);
COMMENT ON TABLE public.ticket_assignment_details IS
  'Ticket-only structured fields. Present iff assignments.catalog_kind = ticket.';

CREATE TABLE public.credential_assignment_details (
  assignment_id uuid PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
  access_level text,
  parent_assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  issued_on date,
  expires_on date,
  must_return boolean NOT NULL DEFAULT false,
  returned_at timestamptz
);
CREATE INDEX idx_credential_assignment_details_parent ON public.credential_assignment_details (parent_assignment_id) WHERE parent_assignment_id IS NOT NULL;
COMMENT ON TABLE public.credential_assignment_details IS
  'Credential-only structured fields. parent_assignment_id supports tiered/escort badges where one credential governs another.';

CREATE TABLE public.lodging_assignment_details (
  assignment_id uuid PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
  property_name text,
  room_number text,
  check_in date,
  check_out date,
  roommate_assignment_id uuid REFERENCES public.assignments(id) ON DELETE SET NULL,
  confirmation_code text
);
CREATE INDEX idx_lodging_assignment_details_roommate ON public.lodging_assignment_details (roommate_assignment_id) WHERE roommate_assignment_id IS NOT NULL;
COMMENT ON TABLE public.lodging_assignment_details IS
  'Lodging-only structured fields. roommate_assignment_id pairs two assignments to the same room.';

CREATE TABLE public.travel_assignment_details (
  assignment_id uuid PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
  mode text,                       -- flight|ground|rail|sea
  from_location text,
  to_location text,
  depart_at timestamptz,
  arrive_at timestamptz,
  carrier text,
  confirmation_code text,
  seat text
);
COMMENT ON TABLE public.travel_assignment_details IS
  'Travel-only structured fields. Use one row per leg; multi-leg itineraries are multiple assignments grouped by atom_id.';

CREATE TABLE public.vehicle_assignment_details (
  assignment_id uuid PRIMARY KEY REFERENCES public.assignments(id) ON DELETE CASCADE,
  vehicle_label text,
  plate text,
  picked_up_at timestamptz,
  returned_at timestamptz,
  mileage_start integer,
  mileage_end integer
);
COMMENT ON TABLE public.vehicle_assignment_details IS
  'Vehicle-only structured fields. mileage_start/end captures rental wear; null until pickup/return.';

-- ============================================================
-- 7. RLS — same pattern across all 9 tables
-- ============================================================

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_external_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_scan_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_assignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lodging_assignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_assignment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_assignment_details ENABLE ROW LEVEL SECURITY;

-- assignments: org members read; party_user_id reads their own; manager+ writes
CREATE POLICY assignments_select ON public.assignments FOR SELECT TO authenticated
USING (private.is_org_member(org_id) OR party_user_id = (SELECT auth.uid()));

CREATE POLICY assignments_insert ON public.assignments FOR INSERT TO authenticated
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

CREATE POLICY assignments_update ON public.assignments FOR UPDATE TO authenticated
USING (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']))
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

CREATE POLICY assignments_delete ON public.assignments FOR DELETE TO authenticated
USING (private.has_org_role(org_id, ARRAY['owner','admin']));

-- External holders: org members + the claimed user
CREATE POLICY assignment_external_holders_select ON public.assignment_external_holders FOR SELECT TO authenticated
USING (private.is_org_member(org_id) OR claimed_user_id = (SELECT auth.uid()));

CREATE POLICY assignment_external_holders_insert ON public.assignment_external_holders FOR INSERT TO authenticated
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

CREATE POLICY assignment_external_holders_update ON public.assignment_external_holders FOR UPDATE TO authenticated
USING (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']))
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

-- Scan codes: scanners (crew+) can update during gate ops; manager+ inserts/voids
CREATE POLICY assignment_scan_codes_select ON public.assignment_scan_codes FOR SELECT TO authenticated
USING (private.is_org_member(org_id));

CREATE POLICY assignment_scan_codes_insert ON public.assignment_scan_codes FOR INSERT TO authenticated
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator']));

CREATE POLICY assignment_scan_codes_update ON public.assignment_scan_codes FOR UPDATE TO authenticated
USING (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator','crew']))
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator','crew']));

-- Events: crew+ can insert (gate scans); org members read
CREATE POLICY assignment_events_select ON public.assignment_events FOR SELECT TO authenticated
USING (private.is_org_member(org_id));

CREATE POLICY assignment_events_insert ON public.assignment_events FOR INSERT TO authenticated
WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','controller','collaborator','crew']));

-- Sibling details: read inherits from parent assignment row; write requires manager+ on parent's org
DO $POL$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ticket','credential','lodging','travel','vehicle'] LOOP
    EXECUTE format($Q$
      CREATE POLICY %I ON public.%I FOR SELECT TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_id
          AND (private.is_org_member(a.org_id) OR a.party_user_id = (SELECT auth.uid()))
      ));
    $Q$, t || '_assignment_details_select', t || '_assignment_details');

    EXECUTE format($Q$
      CREATE POLICY %I ON public.%I FOR ALL TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_id
          AND private.has_org_role(a.org_id, ARRAY['owner','admin','controller','collaborator'])
      ))
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_id
          AND private.has_org_role(a.org_id, ARRAY['owner','admin','controller','collaborator'])
      ));
    $Q$, t || '_assignment_details_iud', t || '_assignment_details');
  END LOOP;
END $POL$;
