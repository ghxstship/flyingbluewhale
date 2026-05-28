-- LDP remediation: rename contract_envelope_signers.status → signer_state
-- `status` is banned in new tables per LIFECYCLE_DECOMPOSITION_PROTOCOL.md.
-- `signer_state` is the cyclical-operational name for this column.
-- Idempotent: only renames if the old column still exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'contract_envelope_signers'
      AND column_name  = 'status'
  ) THEN
    ALTER TABLE public.contract_envelope_signers
      RENAME COLUMN status TO signer_state;
  END IF;
END $$;
