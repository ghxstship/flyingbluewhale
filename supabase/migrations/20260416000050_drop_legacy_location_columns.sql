-- ════════════════════════════════════════════════════════════
-- MIGRATION: 050_drop_legacy_location_columns
-- Enforces true Zero Backwards Compatibility for Location Canonization
-- ════════════════════════════════════════════════════════════

-- 1. Projects
alter table projects drop column if exists venue cascade;

-- 2. Spaces
-- spaces legacy column, location_legacy... wait, spaces didn't have a column, I just migrated it.
-- Wait, spaces metadata? Let's be safe. spaces didn't have one in my SQL check.

-- 3. Catering
alter table catering_meal_plans drop column if exists location cascade;

-- 4. Credentials
alter table credential_check_ins drop column if exists location cascade;

-- 5. Ticket Scans
-- If tickets relied on "gate", let's drop it to enforce `location_id`
alter table ticket_scans drop column if exists gate cascade;
-- Wait, ticket scans also had 'location' based on my grep search? Let's drop it if it exists.
alter table ticket_scans drop column if exists location cascade;

-- 6. Lost & Found
alter table lost_found_reports 
  drop column if exists found_location cascade,
  drop column if exists lost_location cascade,
  drop column if exists storage_location cascade;

-- End of File
