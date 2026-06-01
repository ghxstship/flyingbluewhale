-- =============================================================================
-- Competitive Feature Pack — 10 features derived from competitor gap analysis
-- Competitors: Connecteam, Deputy, Rentman, Propared, Gigwell, Surreal, Bizzabo
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Feature 3: Geofence Auto Clock-Out
-- Add opt-in column to time_clock_zones; COMPVSS client reads this flag and
-- calls /api/v1/time-clock/auto-clockout when classifyPunch returns 'outside'.
-- ---------------------------------------------------------------------------
ALTER TABLE public.time_clock_zones
  ADD COLUMN IF NOT EXISTS auto_clockout_on_exit boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.time_clock_zones.auto_clockout_on_exit
  IS 'When true, COMPVSS auto-closes the open time_entry when the device leaves the geofence radius.';

-- ---------------------------------------------------------------------------
-- Feature 4: Crew Availability Request Flow
-- Operators send availability checks to crew; crew respond via /m/availability.
-- Push notification fired on insert (kind: availability_request).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crew_availability_requests (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id    uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  requested_by  uuid        NOT NULL REFERENCES public.users(id),
  assignee_id   uuid        NOT NULL REFERENCES public.users(id),
  shift_date    date        NOT NULL,
  shift_start   time,
  shift_end     time,
  role_note     text,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','available','unavailable','expired')),
  response_note text,
  responded_at  timestamptz,
  expires_at    timestamptz NOT NULL DEFAULT now() + interval '48 hours',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crew_availability_requests_org_id_idx
  ON public.crew_availability_requests(org_id);
CREATE INDEX IF NOT EXISTS crew_availability_requests_assignee_id_idx
  ON public.crew_availability_requests(assignee_id);
CREATE INDEX IF NOT EXISTS crew_availability_requests_project_id_idx
  ON public.crew_availability_requests(project_id);

ALTER TABLE public.crew_availability_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage availability requests"
  ON public.crew_availability_requests
  FOR ALL
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Feature 5: Projected Sales vs. Labor %
-- Attach a per-project revenue target so ATLVS schedule view can compute
-- the labor-cost-to-revenue ratio (Connecteam "projected sales & labor%").
-- ---------------------------------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS projected_revenue_cents bigint,
  ADD COLUMN IF NOT EXISTS projected_revenue_currency text NOT NULL DEFAULT 'USD';

COMMENT ON COLUMN public.projects.projected_revenue_cents
  IS 'Operator-entered revenue target for labor% calculation in schedule view.';

-- ---------------------------------------------------------------------------
-- Feature 6: Timesheet Audit Log
-- Tamper-evident log of all INSERT/UPDATE/DELETE on time_entries.
-- Mirrors Connecteam's "timesheet audit log export" (Jan 2026).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_entry_audit_log (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL,
  time_entry_id uuid        NOT NULL,
  actor_id      uuid,
  action        text        NOT NULL CHECK (action IN ('insert','update','delete')),
  old_data      jsonb,
  new_data      jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS time_entry_audit_log_org_id_idx
  ON public.time_entry_audit_log(org_id);
CREATE INDEX IF NOT EXISTS time_entry_audit_log_time_entry_id_idx
  ON public.time_entry_audit_log(time_entry_id);
CREATE INDEX IF NOT EXISTS time_entry_audit_log_created_at_idx
  ON public.time_entry_audit_log(created_at DESC);

ALTER TABLE public.time_entry_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read audit log"
  ON public.time_entry_audit_log FOR SELECT
  USING (private.is_org_member(org_id));

-- Trigger function to auto-populate the audit log on time_entries changes
CREATE OR REPLACE FUNCTION private.tg_time_entry_audit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.time_entry_audit_log(org_id, time_entry_id, action, new_data)
    VALUES (NEW.org_id, NEW.id, 'insert', to_jsonb(NEW));
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.time_entry_audit_log(org_id, time_entry_id, action, old_data, new_data)
    VALUES (NEW.org_id, NEW.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.time_entry_audit_log(org_id, time_entry_id, action, old_data)
    VALUES (OLD.org_id, OLD.id, 'delete', to_jsonb(OLD));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tg_time_entry_audit ON public.time_entries;
CREATE TRIGGER tg_time_entry_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION private.tg_time_entry_audit();

-- ---------------------------------------------------------------------------
-- Feature 7: Hiring Pipeline Phase (ATS Kanban)
-- Adds pipeline_phase to job_applications so operators can drag cards
-- through a hiring funnel — mirrors Connecteam's March 2026 hiring feature.
-- ---------------------------------------------------------------------------
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS pipeline_phase text NOT NULL DEFAULT 'applied'
    CHECK (pipeline_phase IN ('applied','screening','interview','offer','hired','rejected')),
  ADD COLUMN IF NOT EXISTS pipeline_note text,
  ADD COLUMN IF NOT EXISTS pipeline_moved_at timestamptz;

CREATE INDEX IF NOT EXISTS job_applications_pipeline_phase_idx
  ON public.job_applications(pipeline_phase);

-- ---------------------------------------------------------------------------
-- Feature 8: Magic Link Talent Onboarding
-- One-time signed tokens that let talent onboard without a full account
-- creation flow — mirrors Surreal's "magic link" artist onboarding.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.talent_invite_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  posting_id  uuid        REFERENCES public.job_postings(id) ON DELETE SET NULL,
  email       text        NOT NULL,
  token       text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role_hint   text,
  message     text,
  used_at     timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS talent_invite_tokens_org_id_idx
  ON public.talent_invite_tokens(org_id);
CREATE INDEX IF NOT EXISTS talent_invite_tokens_token_idx
  ON public.talent_invite_tokens(token);

ALTER TABLE public.talent_invite_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage invite tokens"
  ON public.talent_invite_tokens FOR ALL
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

-- Public read for token validation at the auth route (no session yet)
CREATE POLICY "token validation read"
  ON public.talent_invite_tokens FOR SELECT
  USING (used_at IS NULL AND expires_at > now());

-- ---------------------------------------------------------------------------
-- Feature 9: Contract Templates + Rider Builder
-- Operators define reusable contract/rider templates; one click generates
-- an offer contract — mirrors Gigwell's one-click contract + rider builder.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid    NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  body_markdown   text    NOT NULL DEFAULT '',
  rider_sections  jsonb   NOT NULL DEFAULT '[]',
  deposit_pct     integer NOT NULL DEFAULT 60 CHECK (deposit_pct BETWEEN 0 AND 100),
  is_default      boolean NOT NULL DEFAULT false,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_templates_org_id_idx
  ON public.contract_templates(org_id)
  WHERE deleted_at IS NULL;

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage contract templates"
  ON public.contract_templates FOR ALL
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

-- Ensure only one default per org
CREATE UNIQUE INDEX IF NOT EXISTS contract_templates_one_default_per_org
  ON public.contract_templates(org_id)
  WHERE is_default = true AND deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS public.offer_contracts (
  id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid  NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  offer_id              uuid  REFERENCES public.talent_offers(id) ON DELETE SET NULL,
  template_id           uuid  REFERENCES public.contract_templates(id) ON DELETE SET NULL,
  rendered_markdown     text  NOT NULL,
  status                text  NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','sent','countersigned','voided')),
  sent_at               timestamptz,
  signed_by_org_at      timestamptz,
  signed_by_talent_at   timestamptz,
  voided_at             timestamptz,
  void_reason           text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS offer_contracts_org_id_idx
  ON public.offer_contracts(org_id);
CREATE INDEX IF NOT EXISTS offer_contracts_offer_id_idx
  ON public.offer_contracts(offer_id);

ALTER TABLE public.offer_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage offer contracts"
  ON public.offer_contracts FOR ALL
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

-- ---------------------------------------------------------------------------
-- Feature 10: Overtime Rules
-- Configurable OT rules applied automatically to time_entries — mirrors
-- Propared's overtime calculation automation and Deputy's jurisdiction rules.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.overtime_rules (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name                  text        NOT NULL,
  daily_ot_after_hours  numeric(5,2) NOT NULL DEFAULT 8,
  daily_dt_after_hours  numeric(5,2),
  weekly_ot_after_hours numeric(5,2) NOT NULL DEFAULT 40,
  ot_multiplier         numeric(4,2) NOT NULL DEFAULT 1.5,
  dt_multiplier         numeric(4,2) DEFAULT 2.0,
  seventh_day_rule      boolean     NOT NULL DEFAULT false,
  applies_to_roles      text[]      NOT NULL DEFAULT '{}',
  is_default            boolean     NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS overtime_rules_org_id_idx
  ON public.overtime_rules(org_id);

ALTER TABLE public.overtime_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage overtime rules"
  ON public.overtime_rules FOR ALL
  USING (private.is_org_member(org_id))
  WITH CHECK (private.is_org_member(org_id));

CREATE UNIQUE INDEX IF NOT EXISTS overtime_rules_one_default_per_org
  ON public.overtime_rules(org_id)
  WHERE is_default = true;

-- Link time_entries to overtime rule applied
ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS overtime_rule_id uuid REFERENCES public.overtime_rules(id),
  ADD COLUMN IF NOT EXISTS regular_minutes  integer,
  ADD COLUMN IF NOT EXISTS ot_minutes       integer,
  ADD COLUMN IF NOT EXISTS dt_minutes       integer;
