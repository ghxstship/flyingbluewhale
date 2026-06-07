-- =============================================================================
-- R-LDP-v2-5 Wave A :: Rename rfq_responses.status -> response_state, type it.
--
-- Source plan
--   reports/LDP_REMEDIATION_PLAN_v2.md §"R-LDP-v2-5 — Untyped text status
--   columns (~58) → typed enum promotion". This is the first table in the
--   batch; chosen because blast radius is the smallest of the ~58 untyped
--   text-status columns (4 src/ call sites, 0 prod rows, no dependent views).
--
-- LDP rule applied
--   LDP §NAMING DISCIPLINE bans `status` as a column name in new schema;
--   cyclical operational lifecycles use `*_state`. The RFQ-response machine
--   (invited → viewed → responded → awarded | declined | withdrawn | no_bid)
--   is cyclical-operational, so `response_state` is the canonical name.
--
-- Strategy
--   1. Create typed enum `rfq_response_state` from the existing CHECK values.
--   2. Drop the CHECK constraint + default on the existing `status text` col.
--   3. Rename status -> response_state and cast type to the new enum.
--   4. Set default 'invited'::rfq_response_state.
--
--   The remediation plan's standard pattern adds a read-only generated
--   `status text` column for a deprecation window. That pattern doesn't work
--   here because Postgres treats enum::text casts as STABLE not IMMUTABLE
--   (label-rename via ALTER TYPE would invalidate stored values) — it
--   rejects the generation expression. Live table has 0 rows and all 5
--   src/ call sites are refactored in the same commit; trunk-based deploy
--   means there's no window where old code reads against the new schema.
--   The back-compat shim has no purchase here, so we do a clean rename.
--
-- Affected objects
--   - public.rfq_responses (column rename + retyped)
--   - public.rfq_responses_status_check (dropped)
--   - public.rfq_response_state (new enum type)
--
-- Rollback (manual, run inside a transaction)
--   BEGIN;
--   ALTER TABLE public.rfq_responses ALTER COLUMN response_state DROP DEFAULT;
--   ALTER TABLE public.rfq_responses
--     ALTER COLUMN response_state TYPE text USING (response_state::text);
--   ALTER TABLE public.rfq_responses RENAME COLUMN response_state TO status;
--   ALTER TABLE public.rfq_responses ALTER COLUMN status SET DEFAULT 'invited'::text;
--   ALTER TABLE public.rfq_responses ADD CONSTRAINT rfq_responses_status_check
--     CHECK (status = ANY (ARRAY['invited','viewed','responded','no_bid',
--                                'withdrawn','awarded','declined']));
--   DROP TYPE public.rfq_response_state;
--   COMMIT;
-- =============================================================================

BEGIN;

-- (1) Create the typed enum.
CREATE TYPE public.rfq_response_state AS ENUM (
  'invited',
  'viewed',
  'responded',
  'no_bid',
  'withdrawn',
  'awarded',
  'declined'
);

ALTER TYPE public.rfq_response_state OWNER TO postgres;

-- (2) Drop the CHECK + default so the column can be retyped.
ALTER TABLE public.rfq_responses
  DROP CONSTRAINT rfq_responses_status_check;

ALTER TABLE public.rfq_responses
  ALTER COLUMN status DROP DEFAULT;

-- (3) Rename and retype.
ALTER TABLE public.rfq_responses
  RENAME COLUMN status TO response_state;

ALTER TABLE public.rfq_responses
  ALTER COLUMN response_state TYPE public.rfq_response_state
  USING (response_state::public.rfq_response_state);

-- (4) New default.
ALTER TABLE public.rfq_responses
  ALTER COLUMN response_state SET DEFAULT 'invited'::public.rfq_response_state;

COMMIT;
