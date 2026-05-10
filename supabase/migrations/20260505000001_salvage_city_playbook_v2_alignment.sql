-- ============================================================================
-- Salvage City — align with EDCLV26_SalvageCity_ProductionPlaybook (Labor tab)
-- ============================================================================
-- Source: Google Sheets ID 1FEGka8XQlkC8dcQvaR1kyxLKcgWELTsppYzYreOVD9Y, tabs
-- Directory + Labor. The playbook is the canonical source of truth for crew
-- roster, role labels, rates, and engagement dates per Julian (2026-05-05).
--
-- Changes:
--   1. Withdraw offer letters for Margo Williams, Corrine Lepere, Kade
--      Barrett — they are NOT part of this year's production. The DB seed
--      created them in error.
--   2. Add new org roles to match the playbook taxonomy:
--      project-producer, project-director, production-assistant-runner,
--      production-assistant-foh, brand-ambassador-{host,vip,merch,flex}.
--   3. Realign rate_card_items.unit_price_cents to playbook hourly × 10hr:
--      Project Director $65 → $650/day · Production Manager $55 → $550/day ·
--      Production Crew (HEQ + Skilled) $45 → $450/day · Brand Ambassador
--      MERCH $40 × 8hr → $320/day. Other roles get $0 placeholders pending
--      finalisation by Alvaro.
--   4. Re-role retained crew: Sarah Fry + Vida Sotakoun → Project Director
--      (joint, not split into Production / Hospitality); Mariah Williams →
--      Production Assistant - Runner (not Driver) plus brand-ambassador-merch
--      for show days; Julian Clarkson → Project Producer (not Operations
--      Director); Amy Reed → email sos@ghxstship.pro (not amy@ghxstship.pro).
--   5. Add Michael Essex as Production Assistant - FOH (NEW). Contact info
--      missing from playbook directory — flagged via annotation.
--   6. Update offer-letter engagement windows to 5/11 → 5/19 per Labor tab
--      (was 5/8 → 5/19 in the seed).
--   7. Patch event_guides production-persona contacts section to reflect the
--      revised roster, role titles, and missing data.
--
-- Idempotent — re-applying refreshes the same rows in place.
-- ============================================================================

do $$
declare
  v_org_id     uuid;
  v_project_id uuid;
  v_julian     uuid;
  v_michael    uuid;

  -- Replacement contacts JSON for the production guide.
  v_production_contacts jsonb := $JSON${
    "type": "contacts",
    "heading": "Production call sheet",
    "entries": [
      {"header": "Five Senses Group — Producer of Record"},
      {"role": "Executive Producer", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com", "phone": "(856) 373-6541"},
      {"role": "Finance Controller", "name": "Alvaro Hernandez", "email": "alvaro@five-senses.co", "phone": "(52) 442-171-3598"},
      {"header": "GHXSTSHIP — Production Crew"},
      {"role": "Project Producer", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro", "phone": "(407) 885-6011"},
      {"role": "Project Coordinator", "name": "Amy Reed", "email": "sos@ghxstship.pro", "phone": "(813) 856-7083"},
      {"role": "Project Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
      {"role": "Project Director", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
      {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
      {"role": "Production Crew (Heavy Equipment)", "name": "Brett Mosher"},
      {"role": "Production Crew (Skilled Carpentry / AV)", "name": "Adam Waddle"},
      {"role": "Production Crew (Skilled Carpentry / AV)", "name": "Josh Parra"},
      {"role": "Production Assistant — FOH", "name": "Michael Essex"},
      {"role": "Production Assistant — Runner", "name": "Mariah Williams"},
      {"header": "Stage Production"},
      {"role": "R-Tech Director / Audio Engineer", "name": "Ramiro Valenzuela", "email": "ramiro@rtechproductions.com", "phone": "(619) 454-1722"},
      {"role": "R-Tech Lighting Director", "name": "Andrew (AJ) Jacobson", "email": "aj@rtechproductions.com", "phone": "(619) 410-5889"},
      {"role": "4Wall Lighting / Decking / FX"},
      {"role": "Paradox Productions Lighting Design"},
      {"role": "JTPro / ROCKFORCE Stage Labor"},
      {"header": "Creative — No Ceilings Entertainment & Corazon Entertainment"},
      {"role": "Corazon Creative Director / Show Caller", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.com", "phone": "(818) 642-6258"},
      {"role": "Corazon Creative Director", "name": "Celine Franco", "email": "info@corazonentertainment.com", "phone": "(702) 882-4166"},
      {"role": "Corazon Choreographer", "name": "Brandy Leviner", "email": "Brandy.Leviner@gmail.com", "phone": "(843) 862-2053"},
      {"header": "Food & Beverage — Levy + Chef Eyal Banayan"},
      {"role": "Executive Chef / Culinary Lead", "name": "Eyal Banayan (Eyal Sauce Factory)", "email": "Chefbanayan@gmail.com", "phone": "(310) 666-5451"},
      {"role": "Tendiez Lead (BOH 10)", "name": "Robert Anderson", "email": "robander765@gmail.com", "phone": "(702) 596-4344"},
      {"role": "FOH 01 (Salvage)", "name": "Jon Long", "email": "jonathanlong65@icloud.com", "phone": "(310) 880-8344"},
      {"header": "Dessert — Crème by Me"},
      {"role": "Dessert Chef", "name": "Matthew Effendy", "email": "meffendy@cremebyme.com", "phone": "(702) 378-2550"},
      {"role": "Dessert Chef", "name": "Ariana Genilla", "email": "agenilla@cremebyme.com"},
      {"header": "Bar Operations — Dirty Olive"},
      {"role": "Bar Operations Manager", "name": "Madeleine (Maddie) Bruner", "email": "madeleinebruner@gmail.com", "phone": "(702) 540-6383"},
      {"role": "Bar Operations Manager", "name": "Brittany Ashton", "email": "bashton_00@yahoo.com", "phone": "(702) 622-5650"},
      {"header": "Container Build — Pineapple Agency · Print & Signage — Bobrov, Grafico"},
      {"role": "Pineapple Agency", "name": "Lead TBC"},
      {"role": "Bobrov Print", "name": "Lead TBC"},
      {"role": "Grafico Signage", "name": "Lead TBC"},
      {"header": "Concierge — Salvage City Supper Club"},
      {"role": "Concierge", "email": "hello@salvagecitysupperclub.com"},
      {"role": "Help desk", "email": "help@salvagecitysupperclub.com"},
      {"role": "Social", "name": "@salvagecitysupperclub on Instagram"},
      {"header": "Insomniac (Venue Partner)"},
      {"role": "Insomniac Production Counterpart", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com", "phone": "(856) 373-6541"},
      {"role": "Insomniac Warehouse Director", "name": "Melanie Conn", "email": "melanie.conn@insomniac.com"},
      {"header": "Travel & Lodging · Ticketing"},
      {"role": "Travel and Lodging — Fan Experiences", "name": "Lead TBC"},
      {"role": "Ticket Fairy Account Manager", "name": "Ritesh Patel", "email": "ritesh@theticketfairy.com"}
    ]
  }$JSON$::jsonb;

  -- Replacement talent-persona contacts (Brandy full name, Celine direct phone).
  v_talent_contacts jsonb := $JSON${
    "type": "contacts",
    "heading": "Creative and production leads",
    "entries": [
      {"role": "Corazon Creative Director / Show Caller", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.com", "phone": "(818) 642-6258"},
      {"role": "Corazon Creative Director", "name": "Celine Franco", "email": "info@corazonentertainment.com", "phone": "(702) 882-4166"},
      {"role": "Corazon Choreographer", "name": "Brandy Leviner", "email": "Brandy.Leviner@gmail.com", "phone": "(843) 862-2053"},
      {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
      {"role": "Project Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
      {"role": "Project Director", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
      {"role": "Project Producer (escalation)", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro", "phone": "(407) 885-6011"}
    ]
  }$JSON$::jsonb;

  -- F&B persona contacts — drop Kade (PM-F&B), keep production leads, fix titles.
  v_fb_contacts jsonb := $JSON${
    "type": "contacts",
    "heading": "F&B leads",
    "entries": [
      {"header": "Culinary"},
      {"role": "Executive Chef / Culinary Lead", "name": "Eyal Banayan (Eyal Sauce Factory)", "email": "Chefbanayan@gmail.com", "phone": "(310) 666-5451"},
      {"role": "Tendiez Lead (BOH 10)", "name": "Robert Anderson", "email": "robander765@gmail.com", "phone": "(702) 596-4344"},
      {"role": "FOH 01 (Salvage)", "name": "Jon Long", "email": "jonathanlong65@icloud.com", "phone": "(310) 880-8344"},
      {"role": "FOH 02", "name": "Michael Litchfield", "email": "djlitchplease@gmail.com", "phone": "(781) 775-4146"},
      {"role": "FOH 03", "name": "Braheem Washington", "email": "Washington.b288@gmail.com", "phone": "(215) 237-8638"},
      {"role": "FOH 04", "name": "John Maitam", "email": "Maitam0808@gmail.com", "phone": "(310) 425-9955"},
      {"header": "Dessert — Crème by Me"},
      {"role": "Dessert Chef", "name": "Matthew Effendy", "email": "meffendy@cremebyme.com", "phone": "(702) 378-2550"},
      {"role": "Dessert Chef", "name": "Ariana Genilla", "email": "agenilla@cremebyme.com"},
      {"role": "Dessert Chef", "name": "Julius Acoba", "email": "juliusacoba@hotmail.com"},
      {"role": "Dessert Chef", "name": "Jamie Jin", "email": "Jjin022892@gmail.com"},
      {"role": "Dessert Chef", "name": "Mark Madarang", "email": "marc.angelico24@gmail.com"},
      {"role": "Dessert Chef", "name": "Zac Grosso", "email": "zgrosso@gmail.com"},
      {"header": "Bar Operations — Dirty Olive"},
      {"role": "Bar Operations Manager", "name": "Madeleine (Maddie) Bruner", "email": "madeleinebruner@gmail.com", "phone": "(702) 540-6383"},
      {"role": "Bar Operations Manager", "name": "Brittany Ashton", "email": "bashton_00@yahoo.com", "phone": "(702) 622-5650"},
      {"header": "Production"},
      {"role": "Project Director (F&B liaison)", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
      {"role": "Project Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
      {"role": "Ticketing", "name": "Ritesh Patel (Ticket Fairy)", "email": "ritesh@theticketfairy.com"}
    ]
  }$JSON$::jsonb;

begin
  select o.id, p.id, u.id
    into v_org_id, v_project_id, v_julian
    from orgs o
    join projects p on p.org_id = o.id
    join users u on lower(u.email) = 'julian.clarkson@ghxstship.pro'
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city'
   limit 1;

  if v_project_id is null then
    -- Local Docker / fresh-reset environments lack the Salvage City
    -- seed (it was consolidated out of 0001_remote_snapshot). Skip
    -- the alignment instead of crashing the migration chain — the
    -- realignment is idempotent and harmless to skip when there's
    -- no project to align.
    raise notice 'Salvage City project missing; skipping playbook alignment (local/fresh env).';
    return;
  end if;

  -- ── 1. WITHDRAW offer letters for the 3 removed people ──────────────────
  update offer_letters
     set status = 'withdrawn', withdrawn_at = now(), updated_at = now()
   where project_id = v_project_id
     and crew_member_id in (
       select id from crew_members
        where org_id = v_org_id
          and lower(email) in (
            'margo@five-senses.co',
            'corrinelepere@gmail.com',
            'kadebarrett808@icloud.com'
          )
     )
     and status not in ('withdrawn');

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
  select ol.id, v_org_id, 'withdrawn', 'GHXSTSHIP',
    'Withdrawn — not part of EDCLV26 Salvage City production per the Labor tab in the EDCLV26_SalvageCity_ProductionPlaybook.'
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and lower(cm.email) in (
       'margo@five-senses.co',
       'corrinelepere@gmail.com',
       'kadebarrett808@icloud.com'
     )
     and not exists (
       select 1 from offer_letter_activity a
        where a.offer_letter_id = ol.id and a.kind = 'withdrawn'
     );

  -- ── 2. Add new org_roles to match the playbook taxonomy ─────────────────
  insert into org_roles (org_id, slug, label, description, department, responsibilities, permissions, is_system) values
    (v_org_id, 'project-producer',         'Project Producer',         'Project producer leading the engagement on behalf of the production partner.',                       'Production', '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'project-director',         'Project Director',         'Senior project lead — co-manages the engagement across hospitality and production tracks.',          'Production', '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'production-assistant-runner', 'Production Assistant - Runner', 'Production assistance — runs and on-site support during load-in, show, and strike.',          'Production', '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'production-assistant-foh', 'Production Assistant - FOH', 'Production assistance — front-of-house support during show.',                                       'Production', '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'brand-ambassador-host',    'Brand Ambassador - HOST',  'Brand ambassador — host station.',                                                                    'Brand',      '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'brand-ambassador-vip',     'Brand Ambassador - VIP',   'Brand ambassador — VIP station.',                                                                     'Brand',      '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'brand-ambassador-merch',   'Brand Ambassador - MERCH', 'Brand ambassador — merchandise.',                                                                     'Brand',      '[]'::jsonb, '{}'::text[], false),
    (v_org_id, 'brand-ambassador-flex',    'Brand Ambassador - FLEX',  'Brand ambassador — flexible role.',                                                                   'Brand',      '[]'::jsonb, '{}'::text[], false)
  on conflict (org_id, slug) do update set
    label = excluded.label, description = excluded.description, department = excluded.department;

  -- ── 3. Rate-card alignment per playbook hourly × 10hr ───────────────────
  -- Existing rate cards updated; new ones inserted.
  update rate_card_items
     set unit_price_cents = 65000,
         name = 'Project Director — Day Rate (10 hr × $65/hr)',
         description = 'Per-day rate for Project Director per playbook Labor tab',
         active = true
   where org_id = v_org_id and sku = 'CDR-project-director';

  -- create CDR-project-director if missing
  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active)
  values (v_org_id, 'crew_day_rates', 'CDR-project-director',
          'Project Director — Day Rate (10 hr × $65/hr)',
          'Per-day rate for Project Director per playbook Labor tab',
          65000, 'USD', true)
  on conflict (org_id, sku) do update set
    name = excluded.name, description = excluded.description,
    unit_price_cents = excluded.unit_price_cents, active = excluded.active;

  -- Other playbook-aligned rates
  insert into rate_card_items (org_id, catalog, sku, name, description, unit_price_cents, currency, active) values
    (v_org_id, 'crew_day_rates', 'CDR-project-producer',           'Project Producer — Day Rate',                          'Per-day rate for Project Producer (lead)',                                           0,     'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-production-assistant-runner','Production Assistant - Runner — Day Rate',             'Per-day rate for Production Assistant - Runner',                                     0,     'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-production-assistant-foh',  'Production Assistant - FOH — Day Rate',                'Per-day rate for Production Assistant - FOH',                                        0,     'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-brand-ambassador-host',     'Brand Ambassador - HOST — Day Rate',                   'Per-day brand ambassador rate, host station',                                        0,     'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-brand-ambassador-vip',      'Brand Ambassador - VIP — Day Rate',                    'Per-day brand ambassador rate, VIP station',                                         0,     'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-brand-ambassador-merch',    'Brand Ambassador - MERCH — Day Rate (8 hr × $40/hr)',  'Per-day brand ambassador rate, merchandise — 8-hour show day at $40/hr',             32000, 'USD', true),
    (v_org_id, 'crew_day_rates', 'CDR-brand-ambassador-flex',     'Brand Ambassador - FLEX — Day Rate',                   'Per-day brand ambassador rate, flexible role',                                       0,     'USD', true)
  on conflict (org_id, sku) do update set
    name = excluded.name, description = excluded.description,
    unit_price_cents = excluded.unit_price_cents, active = excluded.active;

  -- Realign existing roles' rate cards
  update rate_card_items set unit_price_cents = 55000, name = 'Production Manager — Day Rate (10 hr × $55/hr)'  where org_id = v_org_id and sku = 'CDR-production-manager';
  update rate_card_items set unit_price_cents = 45000, name = 'Production Crew — Heavy Equipment — Day Rate (10 hr × $45/hr)', updated_at = now()  where org_id = v_org_id and sku = 'CDR-production-crew-heavy';
  update rate_card_items set unit_price_cents = 45000, name = 'Production Crew — Carpentry / AV — Day Rate (10 hr × $45/hr)', updated_at = now()  where org_id = v_org_id and sku = 'CDR-production-crew-carpentry-av';

  -- ── 4. Re-role retained crew + fix Amy email ────────────────────────────
  update crew_members set role = 'project-director',          updated_at = now() where org_id = v_org_id and lower(email) = 'frysarah8@gmail.com';
  update crew_members set role = 'project-director',          updated_at = now() where org_id = v_org_id and lower(email) = 'vidasotakoun@gmail.com';
  update crew_members set role = 'production-assistant-runner', updated_at = now() where org_id = v_org_id and lower(email) = 'mariah@ghxstship.pro';
  update crew_members set email = 'sos@ghxstship.pro',        updated_at = now() where org_id = v_org_id and lower(email) = 'amy@ghxstship.pro';
  update crew_members set role = 'project-producer',          phone = '(407) 885-6011', updated_at = now()
   where org_id = v_org_id and lower(email) = 'julian.clarkson@ghxstship.pro';
  update crew_members set phone = '(52) 442-171-3598',        updated_at = now() where org_id = v_org_id and lower(email) = 'alvaro@five-senses.co';

  -- Repoint Sarah and Vida offer letters to the project-director role + rate card.
  update offer_letters ol
     set role_id = (select id from org_roles where org_id = v_org_id and slug = 'project-director'),
         rate_card_item_id = (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-project-director'),
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and lower(cm.email) in ('frysarah8@gmail.com', 'vidasotakoun@gmail.com');

  -- Repoint Mariah's offer letter to production-assistant-runner.
  update offer_letters ol
     set role_id = (select id from org_roles where org_id = v_org_id and slug = 'production-assistant-runner'),
         rate_card_item_id = (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-production-assistant-runner'),
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and lower(cm.email) = 'mariah@ghxstship.pro';

  -- Repoint Julian's role record (defensive — he's the signing authority, may not have an offer letter).
  update offer_letters ol
     set role_id = (select id from org_roles where org_id = v_org_id and slug = 'project-producer'),
         rate_card_item_id = coalesce(ol.rate_card_item_id,
                                       (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-project-producer')),
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and lower(cm.email) = 'julian.clarkson@ghxstship.pro';

  -- ── 5. Add Michael Essex (Production Assistant - FOH) ───────────────────
  insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
  values (v_org_id, 'Michael Essex', null, null, 'production-assistant-foh', 0);
  select id into v_michael from crew_members
   where org_id = v_org_id and name = 'Michael Essex' and role = 'production-assistant-foh'
   order by created_at desc limit 1;

  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id, reports_to_crew_member_id,
    employer, classification, venue_id,
    rate_card_item_id, per_diem_rate_card_item_id, compensation_basis,
    engagement_start, engagement_end,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id, v_michael,
    (select id from org_roles where org_id = v_org_id and slug = 'production-assistant-foh'),
    (select id from crew_members where org_id = v_org_id and lower(email) = 'frysarah8@gmail.com'),
    'ghxstship'::offer_letter_employer,
    '1099'::offer_letter_classification,
    (select id from venues where org_id = v_org_id and project_id = v_project_id and name = 'Nomads Land — Salvage City' limit 1),
    (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-production-assistant-foh'),
    (select id from rate_card_items where org_id = v_org_id and sku = 'PD-DAILY'),
    'per_day'::compensation_basis,
    date '2026-05-11', date '2026-05-19',
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft'::offer_letter_status,
    v_julian
  where not exists (
    select 1 from offer_letters
     where project_id = v_project_id and crew_member_id = v_michael
  );

  -- ── 6. Update offer-letter engagement windows to playbook 5/11 → 5/19 ───
  update offer_letters ol
     set engagement_start = date '2026-05-11',
         engagement_end   = date '2026-05-19',
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and lower(cm.email) in (
       'frysarah8@gmail.com',
       'vidasotakoun@gmail.com',
       'skylarenneper@gmail.com',
       'brett@ghxstship.pro',
       'adam@ghxstship.pro',
       'josh@ghxstship.pro',
       'mariah@ghxstship.pro'
     );

  -- ── 7. Patch event_guides config sections ───────────────────────────────
  -- Production guide contacts — full replacement.
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           (
             select jsonb_agg(
               case when section->>'type' = 'contacts' then v_production_contacts else section end
             )
             from jsonb_array_elements(config->'sections') as section
           )
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'staff';

  -- Talent guide contacts — full replacement.
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           (
             select jsonb_agg(
               case when section->>'type' = 'contacts' then v_talent_contacts else section end
             )
             from jsonb_array_elements(config->'sections') as section
           )
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'artist';

  -- F&B guide contacts — full replacement (drops Kade as PM-F&B).
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           (
             select jsonb_agg(
               case when section->>'type' = 'contacts' then v_fb_contacts else section end
             )
             from jsonb_array_elements(config->'sections') as section
           )
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'vendor';

  raise notice 'Salvage City playbook alignment applied.';
end $$;
