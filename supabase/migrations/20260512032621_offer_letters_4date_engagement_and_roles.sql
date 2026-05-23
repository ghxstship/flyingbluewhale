-- 20260512032621_offer_letters_4date_engagement_and_roles.sql
--
-- Backfilled from remote on 2026-05-23 (originally applied out-of-band).
-- Renames engagement_start/end → onsite_start_date/onsite_end_date,
-- adds travel_in_date / travel_out_date, rebuilds offer_letters_resolved
-- view with the 4-date structure, and seeds two specialized PD roles +
-- their rate-card items.

-- ============================================================================
-- 4-DATE ENGAGEMENT WINDOW + SPECIALIZED PD ROLES + REPORTING RESHAPE
-- ============================================================================

-- 1. Rename engagement_start/end → onsite_start_date/onsite_end_date
alter table offer_letters rename column engagement_start to onsite_start_date;
alter table offer_letters rename column engagement_end   to onsite_end_date;

-- 2. Add travel boundary dates
alter table offer_letters
  add column if not exists travel_in_date  date,
  add column if not exists travel_out_date date;

-- 3. Rebuild the resolved view with the 4-date structure
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
  rt.role              as reports_to_role,

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

  -- 4-date canonical window — on-site dates drive compensation; travel dates
  -- are logistical anchors only and do not affect day-rate × days math.
  coalesce(ol.onsite_start_date, p.start_date) as effective_onsite_start,
  coalesce(ol.onsite_end_date,   p.end_date)   as effective_onsite_end,
  greatest(
    (coalesce(ol.onsite_end_date, p.end_date) - coalesce(ol.onsite_start_date, p.start_date) + 1),
    0
  ) as engagement_days,
  -- Legacy aliases for any callers still on the old names — point at on-site
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
        (coalesce(ol.onsite_end_date, p.end_date) - coalesce(ol.onsite_start_date, p.start_date) + 1),
        0
      )
    when ol.compensation_basis = 'tbd' then 0
    else 0
  end as effective_compensation_cents,
  coalesce(ol.override_per_diem_cents, pdrc.unit_price_cents, 0) as effective_per_diem_cents,

  sa.name              as signing_authority_name,
  sa.email             as signing_authority_email,
  sa.phone             as signing_authority_phone,
  sa.role              as signing_authority_title
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

-- 4. Two new specialized PD roles
insert into org_roles (org_id, slug, label, description, department, responsibilities, permissions, is_system)
values
  ((select id from orgs where slug='demo'),
   'project-director-production',
   'Project Director — Production',
   'Owns the production track for Salvage City — schedule, crew, venue, vendor coordination, advancing, and reconciliation. Counterpart to the Hospitality PD.',
   'Production',
   jsonb_build_array(
     'Hold the master schedule and run-of-show',
     'Lead daily production briefings',
     'Approve all departmental requisitions and POs against the project budget',
     'Escalation point for production risk, safety, and incidents'
   ),
   '{}'::text[], false),
  ((select id from orgs where slug='demo'),
   'project-director-hospitality',
   'Project Director — Hospitality',
   'Owns the hospitality track for Salvage City — floor flow, table management, guest-facing service, allergen intake, and sponsor activations. Counterpart to the Production PD.',
   'Hospitality',
   jsonb_build_array(
     'Build and run the seating manifest in coordination with Ticket Fairy',
     'Coordinate host / server staffing and pre-shift briefings',
     'Walk every seating before doors and resolve guest issues in real time',
     'Own allergen intake, sponsor brand standards, and the guest-facing daysheet'
   ),
   '{}'::text[], false)
on conflict (org_id, slug) do update set
  label = excluded.label, description = excluded.description,
  department = excluded.department, responsibilities = excluded.responsibilities;

-- 5. Rate card items for the 2 new roles (same $650/day as base PD)
insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
values
  ((select id from orgs where slug='demo'), 'crew_day_rates', 'CDR-project-director-production',
   'Project Director — Production — Day Rate (10 hr × $65/hr)',
   'Per-day rate for the Production track Project Director', 65000, 'USD', true),
  ((select id from orgs where slug='demo'), 'crew_day_rates', 'CDR-project-director-hospitality',
   'Project Director — Hospitality — Day Rate (10 hr × $65/hr)',
   'Per-day rate for the Hospitality track Project Director', 65000, 'USD', true)
on conflict (org_id, sku) do update set
  name = excluded.name, description = excluded.description, unit_price_cents = excluded.unit_price_cents;

-- 6. Insert Shiloh as a crew_member + Julian title update
insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
values
  ((select id from orgs where slug='demo'), 'Shiloh', 'shiloh@ghxstship.pro', null, 'Production Manager', 0)
on conflict (org_id, lower(email)) do update set
  name = excluded.name, role = excluded.role;

update crew_members
   set role = 'Producer & Operations Director'
 where org_id = (select id from orgs where slug='demo')
   and lower(email) = 'julian.clarkson@ghxstship.pro';

-- 7. Snapshot trigger should pick up the renamed columns automatically because
--    it uses to_jsonb(r.*) — no change needed there.

select 'migration ok' as ok;
