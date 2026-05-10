-- LDP Wave 2 — deliverables: add canonical deliverable_state column.
--
-- Source plan
--   reports/LDP_LIFECYCLE_AUDIT_v2.md §4 Deliverable Lifecycle verdict:
--   "PARTIAL — column should be renamed `state` (R-LDP-2 Wave 2);
--    enum should add BRIEFED + DELIVERED."
--
-- Live DB discovery (2026-05-10):
--   USNP canon (pre-applied) already:
--     - renamed deliverable_status → deliverable_state enum
--     - added 'briefed' (before 'draft') and 'delivered' (after 'approved')
--     - created deliverable_state_transitions append-only log table
--   The only remaining Wave 2 item is adding the canonical deliverable_state
--   column alongside the legacy status column (still typed as deliverable_state
--   enum but named "status"). Follows the accounting_periods / fabrication_orders
--   parallel-column pattern.
--
-- Idempotent — safe to re-run.

ALTER TABLE public.deliverables
  ADD COLUMN IF NOT EXISTS deliverable_state public.deliverable_state
    NOT NULL DEFAULT 'draft'::public.deliverable_state;

UPDATE public.deliverables
   SET deliverable_state = status
 WHERE deliverable_state <> status;

CREATE OR REPLACE FUNCTION private.sync_deliverable_state() RETURNS trigger
  LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.deliverable_state := NEW.status;
  ELSIF NEW.deliverable_state IS DISTINCT FROM OLD.deliverable_state THEN
    NEW.status := NEW.deliverable_state;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS deliverables_sync_state ON public.deliverables;
CREATE TRIGGER deliverables_sync_state
  BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION private.sync_deliverable_state();

CREATE INDEX IF NOT EXISTS idx_deliverables_deliverable_state
  ON public.deliverables (project_id, deliverable_state)
  WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.deliverables.deliverable_state IS
  'LDP §NAMING DISCIPLINE — canonical state column (Wave 2). Mirrors deliverables.status '
  '(enum: deliverable_state); use this column in new code. deliverables.status is deprecated '
  'and will be dropped in Wave 3 once all call-sites reference deliverable_state.';

COMMENT ON COLUMN public.deliverables.status IS
  'DEPRECATED — see deliverables.deliverable_state. Kept for back-compat; mirrored '
  'bidirectionally by trigger deliverables_sync_state. Do not add new references to this column.';
