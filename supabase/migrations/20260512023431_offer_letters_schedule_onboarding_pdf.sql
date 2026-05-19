-- Add schedule_items and onboarding_items JSONB columns to offer_letters.
-- These drive the schedule and onboarding-checklist sections in the PDF renderer.

ALTER TABLE "public"."offer_letters"
    ADD COLUMN IF NOT EXISTS "schedule_items"  jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS "onboarding_items" jsonb NOT NULL DEFAULT '[]';
