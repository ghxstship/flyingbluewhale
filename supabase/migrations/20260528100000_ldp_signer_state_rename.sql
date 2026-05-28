-- LDP remediation: rename contract_envelope_signers.status → signer_state
-- The original migration (20260526100011) used the banned `status` column name.
-- Per LDP §NAMING DISCIPLINE, cyclical operational state must be `*_state`.

ALTER TABLE public.contract_envelope_signers
  RENAME COLUMN status TO signer_state;
