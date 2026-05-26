-- Round 50 — Polish bundle: submittal review chains + email-in + auto-punch
--
-- Per construction-pm-parity matrix:
--   - G-034: Multi-step submittal review chains (configurable per project).
--   - G-026: Email-in inbound correspondence (per-project email address).
--   - G-037: Auto-promote inspection_items.fail → punch_item.
--
-- Three small spines tied together because they share the "polish" theme —
-- closing the long tail of P2 items in the parity matrix.

BEGIN;

-- =============================================================================
-- 1. SUBMITTAL REVIEW CHAINS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.submittal_step_state AS ENUM (
    'pending',
    'in_review',
    'approved',
    'approved_as_noted',
    'revise_resubmit',
    'rejected',
    'skipped'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.submittal_review_chains (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Scope: org-default chain, or per-project, or per-submittal type.
  project_id      uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  -- Matches chains to submittals by spec division or submittal type.
  match_spec_division text,
  match_submittal_type text,
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (org_id, project_id, name)
);

CREATE INDEX IF NOT EXISTS submittal_review_chains_org_idx
  ON public.submittal_review_chains (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS submittal_review_chains_project_idx
  ON public.submittal_review_chains (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS submittal_review_chains_default_idx
  ON public.submittal_review_chains (project_id, is_default) WHERE is_default = true;

COMMENT ON TABLE public.submittal_review_chains IS
  'Named review chains. Scope precedence: per-(project, submittal_type) > project default > org default. match_* columns drive auto-attach when a submittal is created.';

CREATE TABLE IF NOT EXISTS public.submittal_review_chain_steps (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  chain_id        uuid NOT NULL REFERENCES public.submittal_review_chains(id) ON DELETE CASCADE,
  step_ordinal    int NOT NULL,
  step_name       text NOT NULL,                  -- e.g. "GC Review", "Architect Review", "Engineer Review"
  -- Reviewer assignment: exactly one of user_id / role / vendor_id /
  -- external_email is non-null at the step level.
  reviewer_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewer_role   text,
  reviewer_vendor_id uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  reviewer_external_email text,
  due_days        int NOT NULL DEFAULT 14,        -- SLA in calendar days
  is_required     boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chain_id, step_ordinal)
);

CREATE INDEX IF NOT EXISTS submittal_chain_steps_chain_idx ON public.submittal_review_chain_steps (chain_id);
CREATE INDEX IF NOT EXISTS submittal_chain_steps_org_idx ON public.submittal_review_chain_steps (org_id);
CREATE INDEX IF NOT EXISTS submittal_chain_steps_reviewer_user_idx
  ON public.submittal_review_chain_steps (reviewer_user_id) WHERE reviewer_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS submittal_chain_steps_reviewer_vendor_idx
  ON public.submittal_review_chain_steps (reviewer_vendor_id) WHERE reviewer_vendor_id IS NOT NULL;

COMMENT ON TABLE public.submittal_review_chain_steps IS
  'Ordered steps in a review chain. Each step has one reviewer (user/role/vendor/external_email) and an SLA.';

-- Instances — per-submittal review chain state.
CREATE TABLE IF NOT EXISTS public.submittal_review_instances (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  submittal_id    uuid NOT NULL REFERENCES public.submittals(id) ON DELETE CASCADE,
  chain_id        uuid NOT NULL REFERENCES public.submittal_review_chains(id) ON DELETE SET NULL,
  -- Per-step state for this instance.
  step_id         uuid NOT NULL REFERENCES public.submittal_review_chain_steps(id) ON DELETE CASCADE,
  step_state      public.submittal_step_state NOT NULL DEFAULT 'pending',
  due_at          timestamptz,
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  comments        text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submittal_id, step_id)
);

CREATE INDEX IF NOT EXISTS submittal_review_instances_submittal_idx
  ON public.submittal_review_instances (submittal_id);
CREATE INDEX IF NOT EXISTS submittal_review_instances_org_idx ON public.submittal_review_instances (org_id);
CREATE INDEX IF NOT EXISTS submittal_review_instances_state_idx
  ON public.submittal_review_instances (step_state) WHERE step_state IN ('pending','in_review');
CREATE INDEX IF NOT EXISTS submittal_review_instances_due_idx
  ON public.submittal_review_instances (due_at) WHERE step_state IN ('pending','in_review');
CREATE INDEX IF NOT EXISTS submittal_review_instances_reviewed_by_idx ON public.submittal_review_instances (reviewed_by);

COMMENT ON TABLE public.submittal_review_instances IS
  'Per-submittal-per-step review state. due_at = created_at + step.due_days. The router promotes the next step from pending → in_review when prior steps land approved.';

-- =============================================================================
-- 2. EMAIL-IN (project correspondence inbox)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.project_emails (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Per-project unique address local-part — used in the receiver address:
  -- {local_part}@in.atlvs.pro. Unique per org.
  inbound_local_part text NOT NULL,
  notes           text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, inbound_local_part)
);

CREATE INDEX IF NOT EXISTS project_emails_project_idx ON public.project_emails (project_id);
CREATE INDEX IF NOT EXISTS project_emails_org_idx ON public.project_emails (org_id);
CREATE INDEX IF NOT EXISTS project_emails_active_idx ON public.project_emails (is_active) WHERE is_active = true;

COMMENT ON TABLE public.project_emails IS
  'Per-project email-in addresses. The inbound handler routes {inbound_local_part}@in.atlvs.pro to this project, then files the message in inbound_email_messages.';

CREATE TABLE IF NOT EXISTS public.inbound_email_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_email_id uuid REFERENCES public.project_emails(id) ON DELETE SET NULL,
  project_id      uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  -- Headers.
  message_id      text NOT NULL,                  -- RFC 5322 Message-ID
  in_reply_to     text,
  thread_id       text,
  -- People.
  from_email      text NOT NULL,
  from_name       text,
  to_emails       text[] NOT NULL DEFAULT '{}',
  cc_emails       text[] NOT NULL DEFAULT '{}',
  -- Body.
  subject         text,
  body_text       text,
  body_html       text,
  -- Attachments stored separately in inbound_email_attachments.
  -- Status.
  received_at     timestamptz NOT NULL DEFAULT now(),
  processed_at    timestamptz,
  routed_to       text,                            -- 'rfi' | 'submittal' | 'transmittal' | 'note' | null
  routed_id       uuid,                            -- target record id once promoted
  spam_score      numeric(5,2),
  raw_size_bytes  bigint,
  raw_path        text,                            -- storage object key for raw .eml
  UNIQUE (org_id, message_id)
);

CREATE INDEX IF NOT EXISTS inbound_email_messages_org_idx ON public.inbound_email_messages (org_id);
CREATE INDEX IF NOT EXISTS inbound_email_messages_project_idx ON public.inbound_email_messages (project_id);
CREATE INDEX IF NOT EXISTS inbound_email_messages_received_idx
  ON public.inbound_email_messages (received_at DESC);
CREATE INDEX IF NOT EXISTS inbound_email_messages_thread_idx
  ON public.inbound_email_messages (thread_id) WHERE thread_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS inbound_email_messages_routed_idx
  ON public.inbound_email_messages (routed_to, routed_id) WHERE routed_to IS NOT NULL;

COMMENT ON TABLE public.inbound_email_messages IS
  'Inbound emails captured against a project. The router (separate worker) sets routed_to + routed_id once a human promotes the message into a structured record.';

-- =============================================================================
-- 3. AUTO-PROMOTE inspection_items.fail → punch_items
-- =============================================================================

-- inspection_items columns: id, org_id, inspection_id, template_item_id,
-- position, prompt, result, photo_path, notes, created_at.
-- result is free text — when it transitions to 'fail', auto-create a
-- punch_item with the prompt as title.
CREATE OR REPLACE FUNCTION public.tg_inspection_item_to_punch()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_inspection RECORD;
  v_project_id uuid;
  v_org_id uuid;
  v_punch_code text;
BEGIN
  -- Only fire on transition INTO 'fail'.
  IF NEW.result IS NULL OR NEW.result <> 'fail' THEN RETURN NEW; END IF;
  IF (TG_OP = 'UPDATE' AND OLD.result = 'fail') THEN RETURN NEW; END IF;

  -- Hydrate parent inspection + org/project context.
  SELECT i.id, i.org_id, i.project_id INTO v_inspection
  FROM public.inspections i WHERE i.id = NEW.inspection_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_org_id := v_inspection.org_id;
  v_project_id := v_inspection.project_id;

  -- Skip if no project context.
  IF v_project_id IS NULL THEN RETURN NEW; END IF;

  -- Stub code keyed off the inspection_item id slug; UNIQUE (org_id, code)
  -- on punch_items + ON CONFLICT DO NOTHING makes the trigger idempotent.
  v_punch_code := 'PUNCH-INSP-' || substr(NEW.id::text, 1, 8);

  INSERT INTO public.punch_items (
    org_id, project_id, code, title, description, priority,
    status, photo_path, created_at
  ) VALUES (
    v_org_id, v_project_id, v_punch_code,
    COALESCE(NEW.prompt, 'Inspection failure'),
    NEW.notes,
    'normal',
    'open',
    NEW.photo_path,
    now()
  )
  ON CONFLICT (org_id, code) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspection_item_to_punch ON public.inspection_items;
CREATE TRIGGER trg_inspection_item_to_punch
  AFTER INSERT OR UPDATE OF result ON public.inspection_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_inspection_item_to_punch();

-- =============================================================================
-- 4. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_round50_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_submittal_review_chains_touch ON public.submittal_review_chains;
CREATE TRIGGER trg_submittal_review_chains_touch BEFORE UPDATE ON public.submittal_review_chains
  FOR EACH ROW EXECUTE FUNCTION public.touch_round50_updated_at();

DROP TRIGGER IF EXISTS trg_submittal_review_chain_steps_touch ON public.submittal_review_chain_steps;
CREATE TRIGGER trg_submittal_review_chain_steps_touch BEFORE UPDATE ON public.submittal_review_chain_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_round50_updated_at();

DROP TRIGGER IF EXISTS trg_submittal_review_instances_touch ON public.submittal_review_instances;
CREATE TRIGGER trg_submittal_review_instances_touch BEFORE UPDATE ON public.submittal_review_instances
  FOR EACH ROW EXECUTE FUNCTION public.touch_round50_updated_at();

DROP TRIGGER IF EXISTS trg_project_emails_touch ON public.project_emails;
CREATE TRIGGER trg_project_emails_touch BEFORE UPDATE ON public.project_emails
  FOR EACH ROW EXECUTE FUNCTION public.touch_round50_updated_at();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE public.submittal_review_chains       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submittal_review_chain_steps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submittal_review_instances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_emails                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_email_messages        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submittal_review_chains_org_select ON public.submittal_review_chains;
CREATE POLICY submittal_review_chains_org_select ON public.submittal_review_chains FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS submittal_review_chains_org_write ON public.submittal_review_chains;
CREATE POLICY submittal_review_chains_org_write ON public.submittal_review_chains FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS submittal_review_chain_steps_org_select ON public.submittal_review_chain_steps;
CREATE POLICY submittal_review_chain_steps_org_select ON public.submittal_review_chain_steps FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS submittal_review_chain_steps_org_write ON public.submittal_review_chain_steps;
CREATE POLICY submittal_review_chain_steps_org_write ON public.submittal_review_chain_steps FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS submittal_review_instances_org_select ON public.submittal_review_instances;
CREATE POLICY submittal_review_instances_org_select ON public.submittal_review_instances FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS submittal_review_instances_org_write ON public.submittal_review_instances;
CREATE POLICY submittal_review_instances_org_write ON public.submittal_review_instances FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS project_emails_org_select ON public.project_emails;
CREATE POLICY project_emails_org_select ON public.project_emails FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS project_emails_org_write ON public.project_emails;
CREATE POLICY project_emails_org_write ON public.project_emails FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS inbound_email_messages_org_select ON public.inbound_email_messages;
CREATE POLICY inbound_email_messages_org_select ON public.inbound_email_messages FOR SELECT USING (private.is_org_member(org_id));
-- Writes happen via the SES inbound webhook (service role).

COMMIT;
