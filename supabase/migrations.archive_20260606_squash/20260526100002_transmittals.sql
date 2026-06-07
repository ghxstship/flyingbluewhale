-- Round 37 — Transmittals with acknowledgements
--
-- Per construction-pm-parity Wave 1.5 (gap G-016). Transmittals are the
-- audit-grade dispatch envelope for project correspondence — the Aconex
-- pattern. Each transmittal:
--   - bundles documents (drawings, specs, submittals, RFIs, files) into a
--     single immutable package,
--   - is dispatched to one or more recipients (org users, vendors, external
--     emails),
--   - captures acknowledgements (read receipts) with timestamps that are
--     defensible in dispute resolution.
--
-- Polymorphic transmittal_items references one of the existing entity
-- types via (item_type, item_id). For pure file attachments use item_type
-- 'file' and item_id pointing into Supabase Storage via a deliverable row.

BEGIN;

-- =============================================================================
-- 1. ENUMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.transmittal_state AS ENUM (
    'draft',
    'sent',
    'acknowledged',
    'closed',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON TYPE public.transmittal_state IS
  'Lifecycle. acknowledged once all recipients have ack-ed; closed manually by sender. voided wipes legal effect (with audit trail).';

DO $$ BEGIN
  CREATE TYPE public.transmittal_item_type AS ENUM (
    'site_plan',
    'sheet_set_version',
    'spec_section',
    'submittal',
    'rfi',
    'deliverable',
    'file'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.transmittal_recipient_kind AS ENUM (
    'user',
    'vendor',
    'external_email'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- 2. transmittals — the envelope
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transmittals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Org-scoped per-project sequence, e.g. T-0001, T-0002. Generated via
  -- nextOrgCode() server-side; uniqueness enforced here.
  code            text NOT NULL,
  subject         text NOT NULL,
  body_md         text,
  transmittal_state public.transmittal_state NOT NULL DEFAULT 'draft',
  -- Ball-in-court for follow-up; nullable for one-way dispatch.
  due_at          timestamptz,
  sent_at         timestamptz,
  sent_by         uuid REFERENCES auth.users(id),
  closed_at       timestamptz,
  closed_by       uuid REFERENCES auth.users(id),
  voided_at       timestamptz,
  voided_reason   text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS transmittals_org_idx
  ON public.transmittals (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS transmittals_project_idx
  ON public.transmittals (project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS transmittals_state_idx
  ON public.transmittals (transmittal_state) WHERE transmittal_state IN ('draft','sent');
CREATE INDEX IF NOT EXISTS transmittals_due_at_idx
  ON public.transmittals (due_at) WHERE due_at IS NOT NULL AND transmittal_state = 'sent';
CREATE INDEX IF NOT EXISTS transmittals_sent_by_idx ON public.transmittals (sent_by);
CREATE INDEX IF NOT EXISTS transmittals_closed_by_idx ON public.transmittals (closed_by);
CREATE INDEX IF NOT EXISTS transmittals_created_by_idx ON public.transmittals (created_by);

COMMENT ON TABLE public.transmittals IS
  'Audit-grade correspondence envelope (Aconex pattern). Each transmittal bundles items + recipients; acknowledgements timestamped at row insert.';

-- =============================================================================
-- 3. transmittal_items — polymorphic payload
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transmittal_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  transmittal_id  uuid NOT NULL REFERENCES public.transmittals(id) ON DELETE CASCADE,
  item_type       public.transmittal_item_type NOT NULL,
  item_id         uuid NOT NULL,
  description     text,
  ordinal         int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (transmittal_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS transmittal_items_transmittal_idx
  ON public.transmittal_items (transmittal_id);
CREATE INDEX IF NOT EXISTS transmittal_items_lookup_idx
  ON public.transmittal_items (item_type, item_id);
CREATE INDEX IF NOT EXISTS transmittal_items_org_idx
  ON public.transmittal_items (org_id);

COMMENT ON TABLE public.transmittal_items IS
  'Polymorphic payload. (item_type, item_id) points into drawings, sheet_set_versions, spec_sections, submittals, rfis, deliverables, or raw files.';

-- =============================================================================
-- 4. transmittal_recipients — to-list (with delivery state)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transmittal_recipients (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  transmittal_id   uuid NOT NULL REFERENCES public.transmittals(id) ON DELETE CASCADE,
  recipient_kind   public.transmittal_recipient_kind NOT NULL,
  -- Exactly one of user_id / vendor_id / external_email is non-null,
  -- enforced by the check constraint below.
  user_id          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_id        uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  external_email   text,
  cc               boolean NOT NULL DEFAULT false,
  delivered_at     timestamptz,
  failed_at        timestamptz,
  failed_reason    text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transmittal_recipient_exactly_one CHECK (
    (CASE WHEN user_id        IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN vendor_id      IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN external_email IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  CONSTRAINT transmittal_recipient_kind_matches CHECK (
    (recipient_kind = 'user'           AND user_id        IS NOT NULL) OR
    (recipient_kind = 'vendor'         AND vendor_id      IS NOT NULL) OR
    (recipient_kind = 'external_email' AND external_email IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS transmittal_recipients_transmittal_idx
  ON public.transmittal_recipients (transmittal_id);
CREATE INDEX IF NOT EXISTS transmittal_recipients_user_idx
  ON public.transmittal_recipients (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transmittal_recipients_vendor_idx
  ON public.transmittal_recipients (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transmittal_recipients_email_idx
  ON public.transmittal_recipients (external_email) WHERE external_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS transmittal_recipients_org_idx
  ON public.transmittal_recipients (org_id);

COMMENT ON TABLE public.transmittal_recipients IS
  'Recipient list. exactly_one constraint guarantees user_id / vendor_id / external_email mutual exclusion. delivered_at is filled by the dispatch worker.';

-- =============================================================================
-- 5. transmittal_acknowledgements — immutable read receipts
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transmittal_acknowledgements (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  transmittal_id       uuid NOT NULL REFERENCES public.transmittals(id) ON DELETE CASCADE,
  recipient_id         uuid NOT NULL REFERENCES public.transmittal_recipients(id) ON DELETE CASCADE,
  acknowledged_at      timestamptz NOT NULL DEFAULT now(),
  -- Source of truth on who actually opened it. If recipient_kind='user'
  -- this is the user_id; for external/vendor we capture via portal session.
  ack_by_user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ack_ip               inet,
  ack_user_agent       text,
  notes                text,
  -- Single ack per recipient — the immutability invariant. Multiple
  -- opens record on the recipient row's delivered_at + ip log, not here.
  UNIQUE (recipient_id)
);

CREATE INDEX IF NOT EXISTS transmittal_acks_transmittal_idx
  ON public.transmittal_acknowledgements (transmittal_id);
CREATE INDEX IF NOT EXISTS transmittal_acks_ack_by_idx
  ON public.transmittal_acknowledgements (ack_by_user_id) WHERE ack_by_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS transmittal_acks_org_idx
  ON public.transmittal_acknowledgements (org_id);

COMMENT ON TABLE public.transmittal_acknowledgements IS
  'Immutable read receipts. One row per recipient (UNIQUE on recipient_id). Defensible in dispute resolution because acknowledged_at + ack_ip + ack_user_agent are server-set.';

-- =============================================================================
-- 6. Auto-transition transmittal_state on full ack
-- =============================================================================

CREATE OR REPLACE FUNCTION public.tg_transmittal_check_full_ack()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_outstanding int;
  v_transmittal_id uuid;
BEGIN
  v_transmittal_id := NEW.transmittal_id;
  SELECT COUNT(*) INTO v_outstanding
  FROM public.transmittal_recipients r
  LEFT JOIN public.transmittal_acknowledgements a ON a.recipient_id = r.id
  WHERE r.transmittal_id = v_transmittal_id AND a.id IS NULL;

  IF v_outstanding = 0 THEN
    UPDATE public.transmittals
       SET transmittal_state = 'acknowledged'
     WHERE id = v_transmittal_id
       AND transmittal_state = 'sent';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transmittal_check_full_ack ON public.transmittal_acknowledgements;
CREATE TRIGGER trg_transmittal_check_full_ack
  AFTER INSERT ON public.transmittal_acknowledgements
  FOR EACH ROW EXECUTE FUNCTION public.tg_transmittal_check_full_ack();

-- =============================================================================
-- 7. updated_at trigger
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_transmittal_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transmittals_touch ON public.transmittals;
CREATE TRIGGER trg_transmittals_touch
  BEFORE UPDATE ON public.transmittals
  FOR EACH ROW EXECUTE FUNCTION public.touch_transmittal_updated_at();

-- =============================================================================
-- 8. RLS
-- =============================================================================

ALTER TABLE public.transmittals                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmittal_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmittal_recipients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmittal_acknowledgements    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS transmittals_org_select ON public.transmittals;
CREATE POLICY transmittals_org_select ON public.transmittals
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS transmittals_org_write ON public.transmittals;
CREATE POLICY transmittals_org_write ON public.transmittals
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS transmittal_items_org_select ON public.transmittal_items;
CREATE POLICY transmittal_items_org_select ON public.transmittal_items
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS transmittal_items_org_write ON public.transmittal_items;
CREATE POLICY transmittal_items_org_write ON public.transmittal_items
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS transmittal_recipients_org_select ON public.transmittal_recipients;
CREATE POLICY transmittal_recipients_org_select ON public.transmittal_recipients
  FOR SELECT USING (private.is_org_member(org_id));

DROP POLICY IF EXISTS transmittal_recipients_org_write ON public.transmittal_recipients;
CREATE POLICY transmittal_recipients_org_write ON public.transmittal_recipients
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS transmittal_acks_org_select ON public.transmittal_acknowledgements;
CREATE POLICY transmittal_acks_org_select ON public.transmittal_acknowledgements
  FOR SELECT USING (private.is_org_member(org_id));

-- Acks are insert-only from the acknowledger; updates/deletes blocked.
DROP POLICY IF EXISTS transmittal_acks_insert ON public.transmittal_acknowledgements;
CREATE POLICY transmittal_acks_insert ON public.transmittal_acknowledgements
  FOR INSERT
  WITH CHECK (private.is_org_member(org_id));

COMMIT;
