-- incidents.report_kind — give the Lost & Found lens an honest discriminator.
--
-- Lost & Found (studio/safety/lost-found) filtered `incidents` on
-- `injury_type IS NULL` and called that "the property lens". It isn't: a
-- chemical spill, a near-miss, equipment damage, and a genuinely lost
-- backpack all have a null injury_type, so every non-injury report in the
-- org landed in Lost & Found. The COMPVSS incident intake made it total —
-- it never wrote injury_type at all, so 100% of field-filed reports,
-- injuries included, showed up as lost property.
--
-- `report_kind` is a facet, not a lifecycle, so it takes the `_kind` suffix
-- per the existing catalog_kind / assignment_event_kind convention rather
-- than the LDP `_state`/`_phase` naming reserved for lifecycles.
--
-- Backfill is deliberately conservative: everything existing becomes
-- 'safety' (the intake's meaning). Nothing is silently reclassified as lost
-- property — an operator reclassifies real property reports, or they get
-- re-filed through the lost & found intake.

ALTER TABLE "public"."incidents"
  ADD COLUMN IF NOT EXISTS "report_kind" "text" NOT NULL DEFAULT 'safety';

ALTER TABLE "public"."incidents"
  DROP CONSTRAINT IF EXISTS "incidents_report_kind_check";

ALTER TABLE "public"."incidents"
  ADD CONSTRAINT "incidents_report_kind_check"
  CHECK ("report_kind" = ANY (ARRAY['safety'::"text", 'lost_property'::"text"]));

COMMENT ON COLUMN "public"."incidents"."report_kind" IS
  'Discriminator for the Lost & Found filtered-alias lens (ADR-0014). safety = the incident intake; lost_property = the lost & found intake. Do NOT infer property reports from a null injury_type.';

-- The Lost & Found lens reads this column; the OSHA log reads
-- osha_recordable. Both want the same partial-index shape.
CREATE INDEX IF NOT EXISTS "incidents_report_kind_idx"
  ON "public"."incidents" ("org_id", "report_kind")
  WHERE "deleted_at" IS NULL;
