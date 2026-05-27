-- Round 46 — Accounting connectors + DocuSign / Adobe Sign envelopes
--
-- Per construction-pm-parity Wave 3.5 + 3.6 (gaps G-013, G-024).
-- Two clusters bundled — both are "external integration spines" that the
-- runtime services connect to.
--
-- Accounting connectors:
--   - accounting_connections: per-org OAuth + tenant payload for the target
--     accounting system (QB Online, Sage 300 CRE, Foundation, Viewpoint
--     Vista, Acumatica).
--   - accounting_sync_runs: append-only sync-job audit (count_in/out/error).
--   - accounting_mapping_rules: per-connection field mapping
--     (atlvs.cost_codes → remote.cost_categories etc.).
--
-- Contract envelopes:
--   - contract_envelopes: polymorphic envelope row (target = offer letter,
--     MSA, proposal, lien waiver, change order, prime contract, sub
--     contract). Tracks DocuSign/Adobe Sign envelope id + state.
--   - contract_envelope_signers: per-signer routing order + sign timestamp.

BEGIN;

-- =============================================================================
-- 1. ACCOUNTING CONNECTORS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.accounting_system AS ENUM (
    'qb_online',
    'qb_desktop',
    'sage_300_cre',
    'sage_100_contractor',
    'foundation',
    'viewpoint_vista',
    'viewpoint_spectrum',
    'acumatica',
    'xero'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.accounting_connection_state AS ENUM (
    'pending_auth',
    'connected',
    'expired',
    'revoked',
    'error'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.accounting_sync_run_state AS ENUM (
    'running',
    'succeeded',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.accounting_connections (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  system          public.accounting_system NOT NULL,
  -- The remote tenant / company / db name. Free text — QB has realmId, Sage
  -- has company name, Viewpoint has DB instance, etc.
  tenant_id       text NOT NULL,
  display_name    text NOT NULL,
  -- Encrypted at rest via Supabase Vault or app-layer envelope encryption.
  -- We store the ciphertext + a key reference; service-role only.
  auth_ciphertext text,
  auth_key_ref    text,
  connection_state public.accounting_connection_state NOT NULL DEFAULT 'pending_auth',
  last_sync_at    timestamptz,
  last_error      text,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (org_id, system, tenant_id)
);

CREATE INDEX IF NOT EXISTS accounting_connections_org_idx
  ON public.accounting_connections (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS accounting_connections_system_idx ON public.accounting_connections (system);
CREATE INDEX IF NOT EXISTS accounting_connections_state_idx
  ON public.accounting_connections (connection_state) WHERE connection_state IN ('connected','expired','error');
CREATE INDEX IF NOT EXISTS accounting_connections_created_by_idx ON public.accounting_connections (created_by);

COMMENT ON TABLE public.accounting_connections IS
  'Per-org connection to an external accounting system. auth_ciphertext stores encrypted OAuth tokens / connection strings; service-role-only access via dedicated worker.';

CREATE TABLE IF NOT EXISTS public.accounting_sync_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  connection_id   uuid NOT NULL REFERENCES public.accounting_connections(id) ON DELETE CASCADE,
  -- Which entity bucket this run handled: 'cost_codes' | 'vendors' |
  -- 'invoices' | 'bills' | 'pay_apps' | 'gl_entries' | 'time_records' | 'all'.
  entity_type     text NOT NULL,
  direction       text NOT NULL CHECK (direction IN ('pull','push','two_way')),
  run_state       public.accounting_sync_run_state NOT NULL DEFAULT 'running',
  started_at      timestamptz NOT NULL DEFAULT now(),
  finished_at     timestamptz,
  count_in        int NOT NULL DEFAULT 0,
  count_out       int NOT NULL DEFAULT 0,
  error_count     int NOT NULL DEFAULT 0,
  error_summary   text,
  -- Cursor for incremental syncs (the remote system's "since this point" token).
  cursor_in       text,
  cursor_out      text,
  triggered_by    uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS accounting_sync_runs_connection_idx ON public.accounting_sync_runs (connection_id);
CREATE INDEX IF NOT EXISTS accounting_sync_runs_org_idx ON public.accounting_sync_runs (org_id);
CREATE INDEX IF NOT EXISTS accounting_sync_runs_started_idx
  ON public.accounting_sync_runs (started_at DESC);
CREATE INDEX IF NOT EXISTS accounting_sync_runs_state_idx
  ON public.accounting_sync_runs (run_state) WHERE run_state IN ('running','failed');
CREATE INDEX IF NOT EXISTS accounting_sync_runs_triggered_by_idx ON public.accounting_sync_runs (triggered_by);

COMMENT ON TABLE public.accounting_sync_runs IS
  'Append-only audit of sync jobs. cursor_in / cursor_out support incremental syncs (since-token, modified-after) without re-shipping the whole dataset.';

CREATE TABLE IF NOT EXISTS public.accounting_mapping_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  connection_id   uuid NOT NULL REFERENCES public.accounting_connections(id) ON DELETE CASCADE,
  -- ATLVS side.
  atlvs_entity    text NOT NULL,          -- 'cost_codes' | 'vendors' | 'invoices' | ...
  atlvs_field     text NOT NULL,          -- 'code' | 'name' | 'amount' | ...
  -- Remote side.
  remote_entity   text NOT NULL,
  remote_field    text NOT NULL,
  -- Optional transform expression. Conventions:
  --   'identity' (default)
  --   'uppercase' / 'lowercase' / 'trim'
  --   'cents_to_dollars' / 'dollars_to_cents'
  --   'date_iso' / 'date_remote'
  --   'lookup:<table>:<field>' for FK joins
  transform       text NOT NULL DEFAULT 'identity',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connection_id, atlvs_entity, atlvs_field, remote_entity, remote_field)
);

CREATE INDEX IF NOT EXISTS accounting_mapping_rules_connection_idx
  ON public.accounting_mapping_rules (connection_id);
CREATE INDEX IF NOT EXISTS accounting_mapping_rules_org_idx
  ON public.accounting_mapping_rules (org_id);
CREATE INDEX IF NOT EXISTS accounting_mapping_rules_active_idx
  ON public.accounting_mapping_rules (connection_id, is_active) WHERE is_active = true;

COMMENT ON TABLE public.accounting_mapping_rules IS
  'Per-connection field mapping. The sync worker walks active rules and applies transforms while shuttling records between systems.';

-- =============================================================================
-- 2. CONTRACT ENVELOPES (DocuSign / Adobe Sign)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.envelope_provider AS ENUM (
    'docusign',
    'adobe_sign',
    'hellosign',
    'pandadoc',
    'manual'         -- captured signature uploaded by hand
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.envelope_state AS ENUM (
    'drafted',
    'sent',
    'delivered',
    'partially_signed',
    'signed',
    'completed',
    'declined',
    'voided',
    'expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.envelope_signer_state AS ENUM (
    'pending',
    'sent',
    'delivered',
    'signed',
    'declined',
    'voided'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.envelope_target_type AS ENUM (
    'proposal',
    'offer_letter',
    'msa',
    'prime_contract',
    'sub_contract',
    'change_order',
    'lien_waiver',
    'nda',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.contract_envelopes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  -- Polymorphic target: (target_type, target_id) points into one of the
  -- entity tables. No FK because the target table varies.
  target_type     public.envelope_target_type NOT NULL,
  target_id       uuid NOT NULL,
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  provider        public.envelope_provider NOT NULL,
  provider_envelope_id text,
  envelope_state  public.envelope_state NOT NULL DEFAULT 'drafted',
  subject         text NOT NULL,
  body_md         text,
  document_path   text,                       -- storage object key (PDF as sent)
  sent_at         timestamptz,
  completed_at    timestamptz,
  expires_at      timestamptz,
  webhook_received_at timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);

CREATE INDEX IF NOT EXISTS contract_envelopes_org_idx
  ON public.contract_envelopes (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS contract_envelopes_target_idx
  ON public.contract_envelopes (target_type, target_id);
CREATE INDEX IF NOT EXISTS contract_envelopes_project_idx
  ON public.contract_envelopes (project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contract_envelopes_provider_envelope_idx
  ON public.contract_envelopes (provider_envelope_id) WHERE provider_envelope_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contract_envelopes_state_idx
  ON public.contract_envelopes (envelope_state)
  WHERE envelope_state IN ('drafted','sent','delivered','partially_signed','signed');
CREATE INDEX IF NOT EXISTS contract_envelopes_created_by_idx ON public.contract_envelopes (created_by);

COMMENT ON TABLE public.contract_envelopes IS
  'Polymorphic e-signature envelope. (target_type, target_id) routes the completed PDF back to the originating record (offer letter, lien waiver, sub contract, etc.).';

CREATE TABLE IF NOT EXISTS public.contract_envelope_signers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  envelope_id     uuid NOT NULL REFERENCES public.contract_envelopes(id) ON DELETE CASCADE,
  routing_order   int NOT NULL DEFAULT 1,
  -- Either an org user or an external email.
  user_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_id       uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  external_email  text,
  signer_role     text,                  -- 'signer' | 'cc' | 'witness' | 'approver' | 'in_person_signer'
  signer_state    public.envelope_signer_state NOT NULL DEFAULT 'pending',
  signed_at       timestamptz,
  signed_name     text,
  signed_title    text,
  ip              inet,
  user_agent      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT envelope_signer_exactly_one CHECK (
    (CASE WHEN user_id        IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN vendor_id      IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN external_email IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS contract_envelope_signers_envelope_idx ON public.contract_envelope_signers (envelope_id);
CREATE INDEX IF NOT EXISTS contract_envelope_signers_org_idx ON public.contract_envelope_signers (org_id);
CREATE INDEX IF NOT EXISTS contract_envelope_signers_user_idx ON public.contract_envelope_signers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contract_envelope_signers_vendor_idx ON public.contract_envelope_signers (vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS contract_envelope_signers_external_email_idx ON public.contract_envelope_signers (external_email) WHERE external_email IS NOT NULL;

COMMENT ON TABLE public.contract_envelope_signers IS
  'Routing order + signer state. Exactly one of user_id / vendor_id / external_email is non-null. IP + user_agent captured at signature for audit.';

-- =============================================================================
-- 3. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_round46_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_accounting_connections_touch ON public.accounting_connections;
CREATE TRIGGER trg_accounting_connections_touch BEFORE UPDATE ON public.accounting_connections
  FOR EACH ROW EXECUTE FUNCTION public.touch_round46_updated_at();

DROP TRIGGER IF EXISTS trg_accounting_mapping_rules_touch ON public.accounting_mapping_rules;
CREATE TRIGGER trg_accounting_mapping_rules_touch BEFORE UPDATE ON public.accounting_mapping_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_round46_updated_at();

DROP TRIGGER IF EXISTS trg_contract_envelopes_touch ON public.contract_envelopes;
CREATE TRIGGER trg_contract_envelopes_touch BEFORE UPDATE ON public.contract_envelopes
  FOR EACH ROW EXECUTE FUNCTION public.touch_round46_updated_at();

-- =============================================================================
-- 4. RLS
-- =============================================================================

ALTER TABLE public.accounting_connections     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_sync_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_mapping_rules   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_envelopes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_envelope_signers  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS accounting_connections_org_select ON public.accounting_connections;
CREATE POLICY accounting_connections_org_select ON public.accounting_connections
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS accounting_connections_org_write ON public.accounting_connections;
CREATE POLICY accounting_connections_org_write ON public.accounting_connections
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS accounting_sync_runs_org_select ON public.accounting_sync_runs;
CREATE POLICY accounting_sync_runs_org_select ON public.accounting_sync_runs
  FOR SELECT USING (private.is_org_member(org_id));
-- Sync runs are written by the service-role worker only; no user-facing
-- write policy needed (service role bypasses RLS).

DROP POLICY IF EXISTS accounting_mapping_rules_org_select ON public.accounting_mapping_rules;
CREATE POLICY accounting_mapping_rules_org_select ON public.accounting_mapping_rules
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS accounting_mapping_rules_org_write ON public.accounting_mapping_rules;
CREATE POLICY accounting_mapping_rules_org_write ON public.accounting_mapping_rules
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin']));

DROP POLICY IF EXISTS contract_envelopes_org_select ON public.contract_envelopes;
CREATE POLICY contract_envelopes_org_select ON public.contract_envelopes
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS contract_envelopes_org_write ON public.contract_envelopes;
CREATE POLICY contract_envelopes_org_write ON public.contract_envelopes
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS contract_envelope_signers_org_select ON public.contract_envelope_signers;
CREATE POLICY contract_envelope_signers_org_select ON public.contract_envelope_signers
  FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS contract_envelope_signers_org_write ON public.contract_envelope_signers;
CREATE POLICY contract_envelope_signers_org_write ON public.contract_envelope_signers
  FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
