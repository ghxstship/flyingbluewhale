-- =============================================================================
-- Talent Offer Logistics (Gigwell artist advancing parity).
--
-- Adds a `logistics` JSONB column to `talent_offers` for structured
-- travel/hospitality data: flights, hotel, ground transport, dietary notes.
-- `advance_doc_url` stores a signed URL or external link to the finalized
-- advancing document.
--
-- logistics shape (advisory, not schema-enforced):
--   {
--     "flights": [{ "type": "inbound"|"outbound", "number": "AA123",
--                   "departs_at": "ISO8601", "arrives_at": "ISO8601",
--                   "origin": "MIA", "destination": "NYC", "notes": "" }],
--     "hotel":   { "name": "...", "address": "...",
--                  "check_in": "ISO8601", "check_out": "ISO8601",
--                  "confirmation": "...", "notes": "" },
--     "ground":  "...",
--     "dietary": "...",
--     "other":   "..."
--   }
-- =============================================================================

BEGIN;

ALTER TABLE "public"."talent_offers"
  ADD COLUMN IF NOT EXISTS "logistics"        jsonb,
  ADD COLUMN IF NOT EXISTS "advance_doc_url"  text;

COMMIT;
