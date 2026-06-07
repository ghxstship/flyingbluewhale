-- public.settlements had no UNIQUE on talent_offer_id, so the settlement
-- "upsert" (select-then-insert/update) could accumulate multiple rows per deal
-- under concurrent saves. Once duplicates exist, the detail page's read at
-- src/app/(platform)/console/bookings/deals/[offerId]/settlement/page.tsx uses
-- .maybeSingle() — which errors / returns null on >1 matching row — so the
-- Computed/NBOR block silently goes blank. De-dupe to the most recent row per
-- talent_offer_id, then add the constraint so a real upsert (onConflict) can
-- enforce one settlement per deal.

-- 1. De-dupe: keep the most recently updated row per talent_offer_id
--    (tie-break on id so the delete is deterministic).
DELETE FROM public.settlements s
USING public.settlements newer
WHERE s.talent_offer_id IS NOT NULL
  AND s.talent_offer_id = newer.talent_offer_id
  AND (
    newer.updated_at > s.updated_at
    OR (newer.updated_at = s.updated_at AND newer.id > s.id)
  );

-- 2. One settlement per deal. talent_offer_id is nullable; Postgres treats NULLs
--    as distinct, so settlements not yet tied to an offer are unaffected.
ALTER TABLE public.settlements
  ADD CONSTRAINT settlements_talent_offer_id_key UNIQUE (talent_offer_id);
