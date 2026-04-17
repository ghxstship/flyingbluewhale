-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 048: Canonize Operating Hours
-- Drop unstructured JSONB column from locations in favor
-- of the Master Schedule architecture with RRULE.
-- ═══════════════════════════════════════════════════════

alter table locations
  drop column if exists operating_hours;
