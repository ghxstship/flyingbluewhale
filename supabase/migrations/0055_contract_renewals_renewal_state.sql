-- R-LDP-v2-5 Wave A: contract_renewals.status -> renewal_state, typed.
-- 0 rows, 0 src/ refs. Clean rename.

BEGIN;

CREATE TYPE public.contract_renewal_state AS ENUM (
  'pending',
  'reminded',
  'renewed',
  'lapsed',
  'declined'
);
ALTER TYPE public.contract_renewal_state OWNER TO postgres;

ALTER TABLE public.contract_renewals
  DROP CONSTRAINT contract_renewals_status_check;

ALTER TABLE public.contract_renewals
  RENAME COLUMN status TO renewal_state;

ALTER TABLE public.contract_renewals
  ALTER COLUMN renewal_state TYPE public.contract_renewal_state
  USING (renewal_state::public.contract_renewal_state);

COMMIT;
