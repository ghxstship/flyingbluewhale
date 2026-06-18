-- Check-in time windows for scan codes (Competitive Edge Drop v1 —
-- Eventbrite 2026 "check-in window" parity). Adds valid_from / valid_until
-- to assignment_scan_codes so operators can gate entry to a specific time
-- range (e.g. doors open at 17:00, no entry before 16:30 or after 23:00).
-- The application layer (scanAssignment) enforces the window on every scan;
-- attempting to scan outside the window returns before_window / after_window
-- and logs the attempt without redeeming the assignment.

ALTER TABLE "public"."assignment_scan_codes"
  ADD COLUMN IF NOT EXISTS "valid_from"  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "valid_until" TIMESTAMPTZ;

COMMENT ON COLUMN "public"."assignment_scan_codes"."valid_from"
  IS 'Earliest timestamp at which this scan code is accepted at the gate. NULL = no lower bound.';

COMMENT ON COLUMN "public"."assignment_scan_codes"."valid_until"
  IS 'Latest timestamp at which this scan code is accepted at the gate. NULL = no upper bound.';

-- Optional index: operators typically query upcoming-window codes for display
-- in the gate app.
CREATE INDEX IF NOT EXISTS "asc_valid_from_idx"
  ON "public"."assignment_scan_codes" ("org_id", "valid_from")
  WHERE "valid_from" IS NOT NULL AND "active" = true;
