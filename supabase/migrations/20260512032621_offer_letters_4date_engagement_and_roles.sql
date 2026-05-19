-- Add travel bookend dates to offer_letters: travel_in_date and travel_out_date.
-- Combined with onsite_start_date / onsite_end_date these form the 4-date
-- engagement span surfaced in the PDF and LetterEditor.

ALTER TABLE "public"."offer_letters"
    ADD COLUMN IF NOT EXISTS "travel_in_date"  date,
    ADD COLUMN IF NOT EXISTS "travel_out_date" date;
