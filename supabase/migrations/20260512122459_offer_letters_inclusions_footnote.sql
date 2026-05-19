-- Add per-letter inclusions array, expectations and terms overrides to offer_letters.
-- Recreates offer_letters_resolved to expose effective_* derivations from
-- org_offer_letter_settings merged with per-letter overrides.

ALTER TABLE "public"."offer_letters"
    ADD COLUMN IF NOT EXISTS "extra_inclusions"      jsonb NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS "expectations_override" text,
    ADD COLUMN IF NOT EXISTS "terms_override"        text;

CREATE OR REPLACE VIEW "public"."offer_letters_resolved" AS
 SELECT ol.id,
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
    ol.schedule_items,
    ol.onboarding_items,
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
    cm.name AS recipient_name,
    cm.email AS recipient_email,
    cm.phone AS recipient_phone,
    cm.user_id AS recipient_user_id,
    r.label AS role_title,
    r.slug AS role_slug,
    r.department AS role_department,
    r.description AS role_description,
    r.responsibilities AS role_responsibilities,
    rt.name AS reports_to_name,
    rt.email AS reports_to_email,
    rt.phone AS reports_to_phone,
    rt.role AS reports_to_role,
    v.name AS venue_name,
    l.address AS venue_address,
    l.city AS venue_city,
    l.region AS venue_region,
    l.country AS venue_country,
    p.name AS project_name,
    p.slug AS project_slug,
    p.start_date AS project_start_date,
    p.end_date AS project_end_date,
    rc.unit_price_cents AS rate_unit_price_cents,
    rc.name AS rate_name,
    rc.sku AS rate_sku,
    pdrc.unit_price_cents AS per_diem_unit_price_cents,
    pdrc.sku AS per_diem_sku,
    COALESCE(ol.onsite_start_date, p.start_date) AS effective_onsite_start,
    COALESCE(ol.onsite_end_date, p.end_date) AS effective_onsite_end,
    GREATEST(((COALESCE(ol.onsite_end_date, p.end_date) - COALESCE(ol.onsite_start_date, p.start_date)) + 1), 0) AS engagement_days,
    COALESCE(ol.onsite_start_date, p.start_date) AS effective_start,
    COALESCE(ol.onsite_end_date, p.end_date) AS effective_end,
    COALESCE(ol.travel_provided, s.default_travel_provided) AS effective_travel_provided,
    COALESCE(ol.lodging_provided, s.default_lodging_provided) AS effective_lodging_provided,
    COALESCE(ol.meals_provided, s.default_meals_provided) AS effective_meals_provided,
    COALESCE(NULLIF(ol.terms_override, ''::text), s.default_terms) AS effective_terms,
    s.default_governing_law AS effective_governing_law,
    s.default_payment_schedule AS effective_payment_schedule,
    s.default_confidentiality AS effective_confidentiality,
    (s.default_inclusions || COALESCE(ol.extra_inclusions, '[]'::jsonb)) AS effective_inclusions,
    s.default_inclusions_footnote AS effective_inclusions_footnote,
    CASE
        WHEN (jsonb_array_length(ol.onboarding_items) > 0) THEN ol.onboarding_items
        ELSE s.default_onboarding_items
    END AS effective_onboarding_items,
    s.guide_url,
    COALESCE(NULLIF(ol.expectations_override, ''::text), (COALESCE(r.description, ''::text) ||
        CASE
            WHEN (jsonb_array_length(COALESCE(r.responsibilities, '[]'::jsonb)) > 0)
                THEN (E'\n\nKey responsibilities:\n' || (
                    SELECT string_agg(('• '::text || rsp.value), E'\n') AS string_agg
                    FROM jsonb_array_elements_text(r.responsibilities) rsp(value)
                ))
            ELSE ''::text
        END)) AS effective_expectations,
    CASE
        WHEN (ol.override_amount_cents IS NOT NULL) THEN ol.override_amount_cents
        WHEN ((ol.compensation_basis = 'flat_fee'::compensation_basis) AND (rc.unit_price_cents IS NOT NULL)) THEN (rc.unit_price_cents)::bigint
        WHEN ((ol.compensation_basis = 'per_day'::compensation_basis) AND (rc.unit_price_cents IS NOT NULL)) THEN ((rc.unit_price_cents * GREATEST(((COALESCE(ol.onsite_end_date, p.end_date) - COALESCE(ol.onsite_start_date, p.start_date)) + 1), 0)))::bigint
        WHEN (ol.compensation_basis = 'tbd'::compensation_basis) THEN (0)::bigint
        ELSE (0)::bigint
    END AS effective_compensation_cents,
    COALESCE(ol.override_per_diem_cents, (pdrc.unit_price_cents)::bigint, (0)::bigint) AS effective_per_diem_cents,
    sa.name AS signing_authority_name,
    sa.email AS signing_authority_email,
    sa.phone AS signing_authority_phone,
    sa.role AS signing_authority_title
   FROM ((((((((((offer_letters ol
     JOIN crew_members cm ON ((cm.id = ol.crew_member_id)))
     JOIN org_roles r ON ((r.id = ol.role_id)))
     LEFT JOIN crew_members rt ON ((rt.id = ol.reports_to_crew_member_id)))
     LEFT JOIN venues v ON ((v.id = ol.venue_id)))
     LEFT JOIN locations l ON ((l.id = v.location_id)))
     JOIN projects p ON ((p.id = ol.project_id)))
     LEFT JOIN rate_card_items rc ON ((rc.id = ol.rate_card_item_id)))
     LEFT JOIN rate_card_items pdrc ON ((pdrc.id = ol.per_diem_rate_card_item_id)))
     LEFT JOIN org_offer_letter_settings s ON ((s.org_id = ol.org_id)))
     LEFT JOIN crew_members sa ON ((sa.id = s.signing_authority_crew_member_id)));
