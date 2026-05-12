-- 0055_offer_letters_travel_date_columns.sql
--
-- SSOT remediation: add the four-date engagement-window columns that the
-- app type (OfferLetter) and UI forms have always referenced but that were
-- never materialized in the physical schema (the DB only had the coarser
-- engagement_start / engagement_end pair).
--
-- Column semantics:
--   travel_in_date   — crew arrives on site (may precede onsite_start_date for
--                      load-in / pre-production work)
--   onsite_start_date — first day of active engagement
--   onsite_end_date   — last day of active engagement
--   travel_out_date  — crew departs (may follow onsite_end_date for de-rig)
--
-- Seed: existing rows get onsite_start_date = engagement_start and
--       onsite_end_date = engagement_end; travel bookend columns remain NULL
--       (no data existed to populate them).
--
-- The engagement_start / engagement_end columns are kept for backward
-- compat and now serve as the "coarse window" used in compensation math.
-- offer_letters_resolved is rebuilt to expose all six date columns and
-- compute effective_onsite_start / effective_onsite_end (the app relies on
-- these two computed aliases for display + compensation calculation).

BEGIN;

-- ── 1. Add columns ──────────────────────────────────────────────────────────

ALTER TABLE public.offer_letters
  ADD COLUMN IF NOT EXISTS travel_in_date    date,
  ADD COLUMN IF NOT EXISTS onsite_start_date date,
  ADD COLUMN IF NOT EXISTS onsite_end_date   date,
  ADD COLUMN IF NOT EXISTS travel_out_date   date;

-- ── 2. Seed from existing coarse window ─────────────────────────────────────

UPDATE public.offer_letters
SET
  onsite_start_date = engagement_start,
  onsite_end_date   = engagement_end
WHERE onsite_start_date IS NULL AND engagement_start IS NOT NULL;

-- ── 3. Rebuild offer_letters_resolved with the new columns ──────────────────
-- Drop the old view first so we can add columns without ALTER VIEW gymnastics.

DROP VIEW IF EXISTS public.offer_letters_resolved;

CREATE OR REPLACE VIEW public.offer_letters_resolved
  WITH (security_invoker = true)
AS
SELECT
  ol.id,
  ol.org_id,
  ol.project_id,
  ol.crew_member_id,
  ol.role_id,
  ol.reports_to_crew_member_id,
  ol.venue_id,
  ol.employer,
  ol.classification,
  ol.rate_card_item_id,
  ol.per_diem_rate_card_item_id,
  ol.compensation_basis,
  ol.override_amount_cents,
  ol.override_per_diem_cents,
  ol.engagement_start,
  ol.engagement_end,
  -- four-date granular window (added 0055)
  ol.travel_in_date,
  ol.onsite_start_date,
  ol.onsite_end_date,
  ol.travel_out_date,
  ol.travel_provided,
  ol.lodging_provided,
  ol.meals_provided,
  ol.extra_inclusions,
  ol.expectations_override,
  ol.terms_override,
  ol.public_token,
  ol.access_code,
  ol.token_expires_at,
  ol.status,
  ol.sent_at,
  ol.first_viewed_at,
  ol.last_viewed_at,
  ol.view_count,
  ol.accepted_at,
  ol.accepted_signature,
  ol.accepted_ip,
  ol.accepted_user_agent,
  ol.declined_at,
  ol.decline_reason,
  ol.withdrawn_at,
  ol.snapshot,
  ol.snapshot_at,
  ol.created_by,
  ol.created_at,
  ol.updated_at,
  -- crew_members (recipient)
  cm.name      AS recipient_name,
  cm.email     AS recipient_email,
  cm.phone     AS recipient_phone,
  cm.user_id   AS recipient_user_id,
  -- org_roles
  r.label          AS role_title,
  r.slug           AS role_slug,
  r.department     AS role_department,
  r.description    AS role_description,
  r.responsibilities AS role_responsibilities,
  -- crew_members (reports to)
  rt.name  AS reports_to_name,
  rt.email AS reports_to_email,
  rt.phone AS reports_to_phone,
  -- venue
  v.name       AS venue_name,
  l.address    AS venue_address,
  l.city       AS venue_city,
  l.region     AS venue_region,
  l.country    AS venue_country,
  -- project
  p.name       AS project_name,
  p.slug       AS project_slug,
  p.start_date AS project_start_date,
  p.end_date   AS project_end_date,
  -- rate cards
  rc.unit_price_cents   AS rate_unit_price_cents,
  rc.name               AS rate_name,
  rc.sku                AS rate_sku,
  pdrc.unit_price_cents AS per_diem_unit_price_cents,
  pdrc.sku              AS per_diem_sku,
  -- effective date range (fine-grained: prefer per-letter granular dates,
  -- fall back to coarse engagement window, then project dates).
  COALESCE(ol.onsite_start_date, ol.engagement_start, p.start_date) AS effective_onsite_start,
  COALESCE(ol.onsite_end_date,   ol.engagement_end,   p.end_date)   AS effective_onsite_end,
  -- deprecated aliases kept for backward compat (app references both names)
  COALESCE(ol.onsite_start_date, ol.engagement_start, p.start_date) AS effective_start,
  COALESCE(ol.onsite_end_date,   ol.engagement_end,   p.end_date)   AS effective_end,
  GREATEST(
    (COALESCE(ol.onsite_end_date, ol.engagement_end, p.end_date)
      - COALESCE(ol.onsite_start_date, ol.engagement_start, p.start_date)) + 1,
    0
  ) AS engagement_days,
  -- effective overrides
  COALESCE(ol.travel_provided,  s.default_travel_provided)   AS effective_travel_provided,
  COALESCE(ol.lodging_provided, s.default_lodging_provided)  AS effective_lodging_provided,
  COALESCE(ol.meals_provided,   s.default_meals_provided)    AS effective_meals_provided,
  COALESCE(NULLIF(ol.terms_override, ''), s.default_terms)   AS effective_terms,
  s.default_governing_law                                     AS effective_governing_law,
  s.default_payment_schedule                                  AS effective_payment_schedule,
  s.default_confidentiality                                   AS effective_confidentiality,
  (s.default_inclusions || COALESCE(ol.extra_inclusions, '[]'::jsonb)) AS effective_inclusions,
  COALESCE(
    NULLIF(ol.expectations_override, ''),
    (COALESCE(r.description, '') ||
      CASE
        WHEN jsonb_array_length(COALESCE(r.responsibilities, '[]'::jsonb)) > 0
          THEN E'\n\nKey responsibilities:\n' ||
               (SELECT string_agg('• ' || rsp.value, E'\n')
                  FROM jsonb_array_elements_text(r.responsibilities) rsp(value))
        ELSE ''
      END)
  ) AS effective_expectations,
  CASE
    WHEN ol.override_amount_cents IS NOT NULL
      THEN ol.override_amount_cents
    WHEN ol.compensation_basis = 'flat_fee' AND rc.unit_price_cents IS NOT NULL
      THEN rc.unit_price_cents::bigint
    WHEN ol.compensation_basis = 'per_day' AND rc.unit_price_cents IS NOT NULL
      THEN (rc.unit_price_cents * GREATEST(
              (COALESCE(ol.onsite_end_date, ol.engagement_end, p.end_date)
               - COALESCE(ol.onsite_start_date, ol.engagement_start, p.start_date)) + 1,
              0))::bigint
    WHEN ol.compensation_basis = 'tbd'
      THEN 0::bigint
    ELSE 0::bigint
  END AS effective_compensation_cents,
  COALESCE(ol.override_per_diem_cents, pdrc.unit_price_cents::bigint, 0::bigint) AS effective_per_diem_cents,
  -- signing authority
  sa.name  AS signing_authority_name,
  sa.email AS signing_authority_email,
  sa.phone AS signing_authority_phone,
  sa.title AS signing_authority_title
FROM public.offer_letters ol
JOIN  public.crew_members            cm   ON cm.id   = ol.crew_member_id
JOIN  public.org_roles               r    ON r.id    = ol.role_id
LEFT JOIN public.crew_members        rt   ON rt.id   = ol.reports_to_crew_member_id
LEFT JOIN public.venues              v    ON v.id    = ol.venue_id
LEFT JOIN public.locations           l    ON l.id    = v.location_id
JOIN  public.projects                p    ON p.id    = ol.project_id
LEFT JOIN public.rate_card_items     rc   ON rc.id   = ol.rate_card_item_id
LEFT JOIN public.rate_card_items     pdrc ON pdrc.id = ol.per_diem_rate_card_item_id
LEFT JOIN public.org_offer_letter_settings s  ON s.org_id = ol.org_id
LEFT JOIN public.crew_members        sa   ON sa.id   = s.signing_authority_crew_member_id;

COMMENT ON VIEW public.offer_letters_resolved IS
  'SSOT-resolved view of offer_letters. Prefer this over the raw table in all read paths.';

COMMIT;
