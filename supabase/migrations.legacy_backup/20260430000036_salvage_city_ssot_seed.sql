-- ============================================================================
-- SALVAGE CITY — SSOT SEED
-- Backfills the canonical tables for the EDCLV26 Salvage City team, then
-- inserts one offer_letters row per team member referencing those FKs.
-- Idempotent — re-runs upsert in place.
-- ============================================================================

create or replace function seed_salvage_city_ssot(p_org_slug text default 'demo')
returns int language plpgsql as $$
declare
  v_org_id        uuid;
  v_project_id    uuid;
  v_owner_id      uuid;
  v_location_id   uuid;
  v_venue_id      uuid;
  v_julian_crew   uuid;
  v_per_diem_rate uuid;
  v_count         int := 0;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  select id into v_project_id from projects
   where org_id = v_org_id and slug = 'edclv26-salvage-city' limit 1;
  select user_id into v_owner_id from memberships
   where org_id = v_org_id and role = 'owner' limit 1;
  if v_org_id is null or v_project_id is null then
    raise exception 'Demo org or salvage city project missing — apply seeds in order.';
  end if;

  -- ── ORG SETTINGS ──────────────────────────────────────────────────────────
  insert into org_offer_letter_settings (
    org_id, default_payment_schedule, default_terms,
    default_inclusions, default_governing_law, default_employer
  ) values (
    v_org_id,
    '60 % deposit on signature, 40 % balance on load-in',
    'Compensation paid on a 60 % deposit / 40 % balance on load-in basis unless otherwise noted. Travel and lodging arranged by the Five Senses logistics lead. Recipient agrees to comply with the Insomniac 2026 Safety & Social Media Policy and the GHXSTSHIP standard production rider. Confidential — not to be shared outside of the recipient and their direct counsel.',
    jsonb_build_array(
      'Production credentials and radio for the engagement window',
      'Boxed crew meals on call days',
      'On-site parking at Las Vegas Motor Speedway',
      'Coverage by the GHXSTSHIP general liability and workers comp policies'
    ),
    'State of Florida',
    'ghxstship'
  )
  on conflict (org_id) do update set
    default_payment_schedule = excluded.default_payment_schedule,
    default_terms            = excluded.default_terms,
    default_inclusions       = excluded.default_inclusions,
    updated_at               = now();

  -- ── LOCATION + VENUE ──────────────────────────────────────────────────────
  insert into locations (org_id, name, address, city, region, country, postcode)
  values (v_org_id, 'Las Vegas Motor Speedway',
    '7000 N Las Vegas Blvd', 'Las Vegas', 'NV', 'US', '89115')
  on conflict (org_id, name) do update set
    address = excluded.address, city = excluded.city, region = excluded.region;
  select id into v_location_id from locations
   where org_id = v_org_id and name = 'Las Vegas Motor Speedway' limit 1;

  insert into venues (org_id, project_id, location_id, name, kind, capacity)
  values (v_org_id, v_project_id, v_location_id, 'Nomads Land — Salvage City', 'stage', 80)
  on conflict (org_id, project_id, name) do update set
    location_id = excluded.location_id, capacity = excluded.capacity;
  select id into v_venue_id from venues
   where org_id = v_org_id and project_id = v_project_id and name = 'Nomads Land — Salvage City' limit 1;

  -- ── JULIAN AS CREW (signing authority) ────────────────────────────────────
  insert into crew_members (org_id, user_id, name, email, phone, role, day_rate_cents)
  values (v_org_id, v_owner_id, 'Julian Clarkson', 'julian.clarkson@ghxstship.pro',
          '(407) 885-6011', 'Operations Director', 0)
  on conflict (org_id, lower(email)) do update set
    user_id = excluded.user_id, phone = excluded.phone, role = excluded.role;
  select id into v_julian_crew from crew_members
   where org_id = v_org_id and lower(email) = 'julian.clarkson@ghxstship.pro' limit 1;

  update org_offer_letter_settings
     set signing_authority_crew_member_id = v_julian_crew
   where org_id = v_org_id;

  -- ── ORG ROLES + RATE CARD ITEMS ───────────────────────────────────────────
  -- Each role gets a matching rate_card_items row with sku 'CDR-<role-slug>'.
  -- day_rate_cents starts at 0; Julian fills via admin before sending.
  with role_data(slug, label, department, description, responsibilities) as (values
    ('production-director',          'Production Director',                  'Production',  'Owns end-to-end production for Salvage City — schedule, crew, venue, vendor coordination, advancing, and final reconciliation.', jsonb_build_array('Hold the master schedule and run-of-show', 'Lead daily production briefings', 'Approve all departmental requisitions and POs against the project budget', 'Escalation point for production risk and incidents')),
    ('hospitality-manager',          'Hospitality Manager',                  'Hospitality', 'Owns floor flow, table management, and guest-facing service experience across all five seatings.', jsonb_build_array('Build and run the seating manifest in coordination with Ticket Fairy', 'Coordinate host/server staffing and pre-shift briefings', 'Walk every seating before doors and resolve guest issues in real time', 'Hand off the daysheet to Production at wrap')),
    ('production-manager-fb',        'Production Manager — F&B',             'Production',  'Manages the F&B production track — Levy, Chef Eyal Banayan, Crème by Me, and bar program coordination.', jsonb_build_array('Coordinate F&B advancing and BOH credentials', 'Support culinary and bar leads through load-in and service', 'Track allergen intake and incident reporting on each seating', 'Reconcile depletions and breakage nightly')),
    ('production-manager',           'Production Manager',                   'Production',  'Day-of production manager owning floor operations, crew assignments, and integration with technical departments.', jsonb_build_array('Run pre-show briefings and assign crew positions', 'Coordinate with R-Tech audio, 4Wall lighting, Paradox lighting design, and JTPro stage labor', 'Manage radio traffic on Channel 1', 'Own SOP execution and incident escalation')),
    ('credentials-travel-logistics', 'Credentials, Travel & Logistics',      'Logistics',   'Owns credentialing, travel booking, lodging, and per-diem coordination for the entire Salvage City team.', jsonb_build_array('Issue and track Insomniac credentials per crew', 'Book travel and lodging via Fan Experiences', 'Coordinate the Insomniac Safety & Social Media form for every team member', 'Maintain the master crew movement sheet')),
    ('finance-controller',           'Finance Controller',                   'Finance',     'Owns financial controls — invoicing, payroll, and expense reconciliation for the Salvage City production.', jsonb_build_array('Issue all crew invoices and process payroll', 'Track project budget against rate card', 'Reconcile vendor expenses and bar/F&B depletions', 'Close the project books within 30 days of strike')),
    ('executive-producer',           'Executive Producer',                   'Executive',   'Executive sponsor and final escalation for Salvage City production. Liaison between Five Senses, GHXSTSHIP, and Insomniac.', jsonb_build_array('Stakeholder communication with Insomniac executive team', 'Final approval on creative, F&B, and budget decisions', 'Final escalation point for safety, talent, and venue partner concerns')),
    ('production-crew-heavy',        'Production Crew — Heavy Equipment',    'Production',  'Operates heavy equipment (lifts, forklifts, telehandlers) during load-in, build, and strike.', jsonb_build_array('Operate forklift / lift equipment per OSHA certifications', 'Support trussing, decking, and large-format scenic install', 'Conduct daily equipment safety checks', 'Strike: load-out per the disposition plan')),
    ('production-crew-carpentry-av', 'Production Crew — Carpentry / AV',     'Production',  'Skilled carpentry and AV technical support during load-in, show, and strike.', jsonb_build_array('Support scenic carpentry, fixture install, and AV cabling', 'Daily safety checks of installed elements', 'Maintain crew tool inventory', 'Strike: load-out per the disposition plan')),
    ('production-assistant-driver',  'Production Assistant / Driver',         'Production',  'Production assistance and driver duties — runs, transport, and on-site support.', jsonb_build_array('On-site runs for production team', 'Driver for crew transport between hotel, venue, and outside vendors', 'Support PMs with floor logistics during show nights')),
    ('project-coordinator-remote',   'Project Coordinator (Remote)',         'Production',  'Remote project coordination — documentation, vendor follow-up, and pre-event advancing support.', jsonb_build_array('Track open advancing items in the production playbook', 'Maintain vendor communication and document file paths', 'Coordinate timezone-aware scheduling for production team meetings'))
  )
  insert into org_roles (org_id, slug, label, description, department, responsibilities, permissions, is_system)
  select v_org_id, slug, label, description, department, responsibilities, '{}'::text[], false
    from role_data
  on conflict (org_id, slug) do update set
    label            = excluded.label,
    description      = excluded.description,
    department       = excluded.department,
    responsibilities = excluded.responsibilities;

  -- Per-role rate card items
  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  select v_org_id, 'crew_day_rates', 'CDR-' || r.slug, r.label || ' — Day Rate',
    'Per-day production crew rate for ' || r.label, 0, 'USD', true
   from org_roles r where r.org_id = v_org_id and r.slug like any (array[
     'production-director','hospitality-manager','production-manager-fb',
     'production-manager','credentials-travel-logistics','finance-controller',
     'executive-producer','production-crew-heavy','production-crew-carpentry-av',
     'production-assistant-driver','project-coordinator-remote'
   ])
  on conflict (org_id, sku) do update set
    name        = excluded.name,
    description = excluded.description,
    active      = excluded.active;

  -- Shared per-diem rate
  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  values (v_org_id, 'crew_day_rates', 'PD-DAILY', 'Per Diem — Daily',
    'Daily per diem for crew on travel days', 0, 'USD', true)
  on conflict (org_id, sku) do update set
    name = excluded.name, description = excluded.description, active = excluded.active;
  select id into v_per_diem_rate from rate_card_items
   where org_id = v_org_id and sku = 'PD-DAILY' limit 1;

  -- ── CREW MEMBERS ──────────────────────────────────────────────────────────
  with crew_data(name, email, phone, role_slug) as (values
    ('Sarah Fry',              'frysarah8@gmail.com',           '(615) 708-3676', 'production-director'),
    ('Vida Sotakoun',          'vidasotakoun@gmail.com',        '(815) 298-8244', 'hospitality-manager'),
    ('Kade Barrett',           'kadebarrett808@icloud.com',     '(443) 735-8870', 'production-manager-fb'),
    ('Skylar Contini-Enneper', 'skylarenneper@gmail.com',       '(702) 689-6907', 'production-manager'),
    ('Corrine Lepere',         'corrinelepere@gmail.com',       '(845) 406-0261', 'production-manager'),
    ('Margo Williams',         'margo@five-senses.co',          null,             'credentials-travel-logistics'),
    ('Alvaro Hernandez',       'alvaro@five-senses.co',         null,             'finance-controller'),
    ('Paul Seigenthaler',      'paul.seigenthaler@insomniac.com','(856) 373-6541', 'executive-producer'),
    ('Brett Mosher',           'brett@ghxstship.pro',           null,             'production-crew-heavy'),
    ('Adam Waddle',            'adam@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Josh Parra',             'josh@ghxstship.pro',            null,             'production-crew-carpentry-av'),
    ('Mariah Williams',        'mariah@ghxstship.pro',          null,             'production-assistant-driver'),
    ('Amy Reed',               'amy@ghxstship.pro',             null,             'project-coordinator-remote')
  )
  insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
  select v_org_id, name, email, phone, role_slug, 0 from crew_data
  on conflict (org_id, lower(email)) do update set
    name = excluded.name, phone = excluded.phone, role = excluded.role;

  -- ── OFFER LETTERS ─────────────────────────────────────────────────────────
  -- Reports-to mapping: Sarah → Julian, Vida/Kade/PMs → Sarah, others → Julian
  with letter_data(email, employer, reports_to_email) as (values
    ('frysarah8@gmail.com',           'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('vidasotakoun@gmail.com',        'five_senses', 'frysarah8@gmail.com'),
    ('kadebarrett808@icloud.com',     'five_senses', 'frysarah8@gmail.com'),
    ('skylarenneper@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('corrinelepere@gmail.com',       'five_senses', 'frysarah8@gmail.com'),
    ('margo@five-senses.co',          'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('alvaro@five-senses.co',         'five_senses', 'julian.clarkson@ghxstship.pro'),
    ('paul.seigenthaler@insomniac.com','joint',      'julian.clarkson@ghxstship.pro'),
    ('brett@ghxstship.pro',           'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('adam@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('josh@ghxstship.pro',            'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('mariah@ghxstship.pro',          'ghxstship',   'julian.clarkson@ghxstship.pro'),
    ('amy@ghxstship.pro',             'ghxstship',   'julian.clarkson@ghxstship.pro')
  )
  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id, reports_to_crew_member_id,
    employer, classification, venue_id,
    rate_card_item_id, per_diem_rate_card_item_id, compensation_basis,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id,
    cm.id,
    r.id,
    rt.id,
    ld.employer::offer_letter_employer,
    '1099'::offer_letter_classification,
    v_venue_id,
    rc.id,
    v_per_diem_rate,
    'per_day'::compensation_basis,
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft',
    v_owner_id
  from letter_data ld
  join crew_members cm on cm.org_id = v_org_id and lower(cm.email) = lower(ld.email)
  join org_roles    r  on r.org_id  = v_org_id and r.slug = cm.role
  left join crew_members rt on rt.org_id = v_org_id and lower(rt.email) = lower(ld.reports_to_email)
  left join rate_card_items rc on rc.org_id = v_org_id and rc.sku = 'CDR-' || cm.role
  on conflict (org_id, project_id, crew_member_id) do update set
    role_id                    = excluded.role_id,
    reports_to_crew_member_id  = excluded.reports_to_crew_member_id,
    employer                   = excluded.employer,
    venue_id                   = excluded.venue_id,
    rate_card_item_id          = excluded.rate_card_item_id,
    per_diem_rate_card_item_id = excluded.per_diem_rate_card_item_id;

  -- Initial activity entries for new letters
  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
  select ol.id, v_org_id, 'created', 'GHXSTSHIP', 'Seeded as draft for the Salvage City team.'
    from offer_letters ol
   where ol.project_id = v_project_id
     and not exists (
       select 1 from offer_letter_activity a
       where a.offer_letter_id = ol.id and a.kind = 'created'
     );

  select count(*) into v_count from offer_letters where project_id = v_project_id;
  return v_count;
end;
$$;
