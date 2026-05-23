-- 20260512122459_offer_letters_inclusions_footnote.sql
--
-- Backfilled from remote on 2026-05-23 (originally applied out-of-band).
-- Adds an org-level footnote string for the inclusions block (e.g.
-- "*Subject to availability") and rebuilds offer_letters_resolved to
-- expose it as effective_inclusions_footnote.

-- Footnote column for inclusions (e.g. "*Subject to availability")
alter table org_offer_letter_settings
  add column if not exists default_inclusions_footnote text;

-- Rebuild resolved view to expose effective_inclusions_footnote
drop view if exists offer_letters_resolved;
create or replace view offer_letters_resolved as
select
  ol.id, ol.org_id, ol.project_id, ol.crew_member_id, ol.role_id,
  ol.reports_to_crew_member_id, ol.venue_id, ol.employer, ol.classification,
  ol.rate_card_item_id, ol.per_diem_rate_card_item_id, ol.compensation_basis,
  ol.override_amount_cents, ol.override_per_diem_cents,
  ol.travel_in_date, ol.onsite_start_date, ol.onsite_end_date, ol.travel_out_date,
  ol.travel_provided, ol.lodging_provided, ol.meals_provided,
  ol.extra_inclusions, ol.expectations_override, ol.terms_override,
  ol.schedule_items, ol.onboarding_items,
  ol.public_token, ol.access_code, ol.token_expires_at,
  ol.status, ol.sent_at, ol.first_viewed_at, ol.last_viewed_at, ol.view_count,
  ol.accepted_at, ol.accepted_signature, ol.accepted_ip, ol.accepted_user_agent,
  ol.declined_at, ol.decline_reason, ol.withdrawn_at,
  ol.snapshot, ol.snapshot_at, ol.created_by, ol.created_at, ol.updated_at,
  cm.name as recipient_name, cm.email as recipient_email, cm.phone as recipient_phone, cm.user_id as recipient_user_id,
  r.label as role_title, r.slug as role_slug, r.department as role_department, r.description as role_description, r.responsibilities as role_responsibilities,
  rt.name as reports_to_name, rt.email as reports_to_email, rt.phone as reports_to_phone, rt.role as reports_to_role,
  v.name as venue_name, l.address as venue_address, l.city as venue_city, l.region as venue_region, l.country as venue_country,
  p.name as project_name, p.slug as project_slug, p.start_date as project_start_date, p.end_date as project_end_date,
  rc.unit_price_cents as rate_unit_price_cents, rc.name as rate_name, rc.sku as rate_sku,
  pdrc.unit_price_cents as per_diem_unit_price_cents, pdrc.sku as per_diem_sku,
  coalesce(ol.onsite_start_date, p.start_date) as effective_onsite_start,
  coalesce(ol.onsite_end_date,   p.end_date)   as effective_onsite_end,
  greatest((coalesce(ol.onsite_end_date, p.end_date) - coalesce(ol.onsite_start_date, p.start_date) + 1), 0) as engagement_days,
  coalesce(ol.onsite_start_date, p.start_date) as effective_start,
  coalesce(ol.onsite_end_date,   p.end_date)   as effective_end,
  coalesce(ol.travel_provided,  s.default_travel_provided)  as effective_travel_provided,
  coalesce(ol.lodging_provided, s.default_lodging_provided) as effective_lodging_provided,
  coalesce(ol.meals_provided,   s.default_meals_provided)   as effective_meals_provided,
  coalesce(nullif(ol.terms_override, ''), s.default_terms)  as effective_terms,
  s.default_governing_law      as effective_governing_law,
  s.default_payment_schedule   as effective_payment_schedule,
  s.default_confidentiality    as effective_confidentiality,
  s.default_inclusions || coalesce(ol.extra_inclusions, '[]'::jsonb) as effective_inclusions,
  s.default_inclusions_footnote as effective_inclusions_footnote,
  case when jsonb_array_length(ol.onboarding_items) > 0 then ol.onboarding_items else s.default_onboarding_items end as effective_onboarding_items,
  s.guide_url as guide_url,
  coalesce(nullif(ol.expectations_override, ''),
    coalesce(r.description, '') ||
    case when jsonb_array_length(coalesce(r.responsibilities, '[]'::jsonb)) > 0
      then E'\n\nKey responsibilities:\n' || (select string_agg('• ' || rsp, E'\n') from jsonb_array_elements_text(r.responsibilities) rsp)
      else '' end
  ) as effective_expectations,
  case
    when ol.override_amount_cents is not null then ol.override_amount_cents
    when ol.compensation_basis = 'flat_fee' and rc.unit_price_cents is not null then rc.unit_price_cents
    when ol.compensation_basis = 'per_day' and rc.unit_price_cents is not null
      then rc.unit_price_cents * greatest((coalesce(ol.onsite_end_date, p.end_date) - coalesce(ol.onsite_start_date, p.start_date) + 1), 0)
    when ol.compensation_basis = 'tbd' then 0 else 0 end as effective_compensation_cents,
  coalesce(ol.override_per_diem_cents, pdrc.unit_price_cents, 0) as effective_per_diem_cents,
  sa.name as signing_authority_name, sa.email as signing_authority_email, sa.phone as signing_authority_phone, sa.role as signing_authority_title
from offer_letters ol
join crew_members cm on cm.id = ol.crew_member_id
join org_roles    r  on r.id  = ol.role_id
left join crew_members rt on rt.id = ol.reports_to_crew_member_id
left join venues v on v.id = ol.venue_id
left join locations l on l.id = v.location_id
join projects p on p.id = ol.project_id
left join rate_card_items rc   on rc.id   = ol.rate_card_item_id
left join rate_card_items pdrc on pdrc.id = ol.per_diem_rate_card_item_id
left join org_offer_letter_settings s on s.org_id = ol.org_id
left join crew_members sa on sa.id = s.signing_authority_crew_member_id;
