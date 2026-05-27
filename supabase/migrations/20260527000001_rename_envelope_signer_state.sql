-- LDP remediation: rename `status` → `signer_state` on contract_envelope_signers.
-- The original migration (20260526100011_accounting_envelopes.sql) was corrected
-- to use `signer_state` per the Lifecycle Decomposition Protocol §NAMING DISCIPLINE.
-- This migration renames the column if it was already applied with the old name.
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
