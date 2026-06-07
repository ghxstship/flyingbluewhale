-- 20260512023431_offer_letters_schedule_onboarding_pdf.sql
--
-- Backfilled from remote on 2026-05-23 (originally applied out-of-band).
-- Adds per-letter schedule + onboarding fields, org-level default
-- onboarding checklist + guide URL, and rebuilds offer_letters_resolved
-- view with the new columns.

-- ============================================================================
-- OFFER LETTERS — SCHEDULE, ONBOARDING, GUIDE LINK, PARTIAL UNIQUE
-- ============================================================================
-- 1. Replace the (org, project, crew) unique with a partial unique that lets
--    superseded (withdrawn / expired / declined) letters stack so we can
--    re-issue a fresh letter to the same person on the same project.
-- 2. Add per-letter schedule_items + onboarding_items jsonb.
-- 3. Add org-level default_onboarding_items + guide_url.
-- 4. Rebuild offer_letters_resolved view with the new fields.

-- 1. Partial unique
alter table offer_letters drop constraint offer_letters_org_id_project_id_crew_member_id_key;
create unique index offer_letters_active_unique
  on offer_letters (org_id, project_id, crew_member_id)
  where status not in ('withdrawn','expired','declined');

-- 2. Per-letter schedule + onboarding
alter table offer_letters
  add column if not exists schedule_items   jsonb not null default '[]'::jsonb,
  add column if not exists onboarding_items jsonb not null default '[]'::jsonb;

-- 3. Org-level defaults
alter table org_offer_letter_settings
  add column if not exists default_onboarding_items jsonb not null default '[]'::jsonb,
  add column if not exists guide_url text;

-- 4. Rebuild the resolved view to expose schedule_items + effective_onboarding_items + guide_url
drop view if exists offer_letters_resolved;
create or replace view offer_letters_resolved as
select
  ol.id, ol.org_id, ol.project_id, ol.crew_member_id, ol.role_id,
  ol.reports_to_crew_member_id, ol.venue_id, ol.employer, ol.classification,
  ol.rate_card_item_id, ol.per_diem_rate_card_item_id, ol.compensation_basis,
  ol.override_amount_cents, ol.override_per_diem_cents,
  ol.engagement_start, ol.engagement_end,
  ol.travel_provided, ol.lodging_provided, ol.meals_provided,
  ol.extra_inclusions, ol.expectations_override, ol.terms_override,
  ol.schedule_items, ol.onboarding_items,
  ol.public_token, ol.access_code, ol.token_expires_at,
  ol.status, ol.sent_at, ol.first_viewed_at, ol.last_viewed_at, ol.view_count,
  ol.accepted_at, ol.accepted_signature, ol.accepted_ip, ol.accepted_user_agent,
  ol.declined_at, ol.decline_reason, ol.withdrawn_at,
  ol.snapshot, ol.snapshot_at, ol.created_by, ol.created_at, ol.updated_at,

  cm.name              as recipient_name,
  cm.email             as recipient_email,
  cm.phone             as recipient_phone,
  cm.user_id           as recipient_user_id,

  r.label              as role_title,
  r.slug               as role_slug,
  r.department         as role_department,
  r.description        as role_description,
  r.responsibilities   as role_responsibilities,

  rt.name              as reports_to_name,
  rt.email             as reports_to_email,
  rt.phone             as reports_to_phone,

  v.name               as venue_name,
  l.address            as venue_address,
  l.city               as venue_city,
  l.region             as venue_region,
  l.country            as venue_country,

  p.name               as project_name,
  p.slug               as project_slug,
  p.start_date         as project_start_date,
  p.end_date           as project_end_date,

  rc.unit_price_cents  as rate_unit_price_cents,
  rc.name              as rate_name,
  rc.sku               as rate_sku,
  pdrc.unit_price_cents as per_diem_unit_price_cents,
  pdrc.sku             as per_diem_sku,

  coalesce(ol.engagement_start, p.start_date) as effective_start,
  coalesce(ol.engagement_end,   p.end_date)   as effective_end,
  greatest(
    (coalesce(ol.engagement_end, p.end_date) - coalesce(ol.engagement_start, p.start_date) + 1),
    0
  ) as engagement_days,
  coalesce(ol.travel_provided,  s.default_travel_provided)  as effective_travel_provided,
  coalesce(ol.lodging_provided, s.default_lodging_provided) as effective_lodging_provided,
  coalesce(ol.meals_provided,   s.default_meals_provided)   as effective_meals_provided,
  coalesce(nullif(ol.terms_override, ''), s.default_terms)  as effective_terms,
  s.default_governing_law      as effective_governing_law,
  s.default_payment_schedule   as effective_payment_schedule,
  s.default_confidentiality    as effective_confidentiality,
  s.default_inclusions || coalesce(ol.extra_inclusions, '[]'::jsonb) as effective_inclusions,
  -- effective_onboarding_items: org defaults + per-letter additions
  case
    when jsonb_array_length(ol.onboarding_items) > 0 then ol.onboarding_items
    else s.default_onboarding_items
  end as effective_onboarding_items,
  s.guide_url                  as guide_url,

  coalesce(
    nullif(ol.expectations_override, ''),
    coalesce(r.description, '') ||
    case
      when jsonb_array_length(coalesce(r.responsibilities, '[]'::jsonb)) > 0
      then E'\n\nKey responsibilities:\n' || (
        select string_agg('• ' || rsp, E'\n')
          from jsonb_array_elements_text(r.responsibilities) rsp
      )
      else ''
    end
  ) as effective_expectations,

  case
    when ol.override_amount_cents is not null then ol.override_amount_cents
    when ol.compensation_basis = 'flat_fee' and rc.unit_price_cents is not null
      then rc.unit_price_cents
    when ol.compensation_basis = 'per_day' and rc.unit_price_cents is not null
      then rc.unit_price_cents * greatest(
        (coalesce(ol.engagement_end, p.end_date) - coalesce(ol.engagement_start, p.start_date) + 1),
        0
      )
    when ol.compensation_basis = 'tbd' then 0
    else 0
  end as effective_compensation_cents,
  coalesce(ol.override_per_diem_cents, pdrc.unit_price_cents, 0) as effective_per_diem_cents,

  sa.name              as signing_authority_name,
  sa.email             as signing_authority_email,
  sa.phone             as signing_authority_phone
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

-- Default onboarding checklist for Salvage City + guide URL
update org_offer_letter_settings
   set default_onboarding_items = jsonb_build_array(
        jsonb_build_object('key','signed_letter',     'label','Sign this offer letter',                                            'required',true,  'order',1),
        jsonb_build_object('key','safety_form',       'label','Complete Insomniac 2026 Safety & Social Media form (Dept: ''Salvage City — No Ceilings'')', 'required',true, 'order',2, 'link','https://forms.insomniac.com/safety'),
        jsonb_build_object('key','w9',                'label','Submit signed W-9 (1099) or W-4 (W-2)',                              'required',true,  'order',3),
        jsonb_build_object('key','direct_deposit',    'label','Provide direct deposit / ACH payment details',                       'required',true,  'order',4),
        jsonb_build_object('key','headshot',          'label','Submit headshot + bio for credential application',                  'required',true,  'order',5),
        jsonb_build_object('key','coi',               'label','Proof of insurance / COI (if subcontractor)',                        'required',false, 'order',6),
        jsonb_build_object('key','nda',               'label','Acknowledge GHXSTSHIP Production NDA + Rider',                        'required',true,  'order',7),
        jsonb_build_object('key','travel_intake',     'label','Complete travel + lodging intake (if applicable)',                   'required',false, 'order',8),
        jsonb_build_object('key','calendar',          'label','Add the engagement window to your calendar',                          'required',false, 'order',9),
        jsonb_build_object('key','comms_channel',     'label','Join the Salvage City production comms channel',                      'required',true,  'order',10)
      ),
       guide_url = '/p/edclv26-salvage-city/guide'
 where org_id = (select id from orgs where slug='demo');
