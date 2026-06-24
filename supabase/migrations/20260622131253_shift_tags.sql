-- Competitive parity with the deskless-workforce suite "Shift Tags" (Nov 2025).
-- Adds free-text labels to time_entries so operators can mark shifts as
-- High Risk, Extra Pay, Training, etc. without a join table.
-- Array chosen over a junction table because tags are display-only metadata
-- (no FK constraints needed) and query patterns filter by @> operator.

ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS shift_tags text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.time_entries.shift_tags IS
  'Operator-defined labels for this shift (e.g. high_risk, extra_pay, training). Free-text; no enum constraint so orgs can define their own vocabulary.';

CREATE INDEX IF NOT EXISTS idx_time_entries_shift_tags
  ON public.time_entries USING GIN (shift_tags);
