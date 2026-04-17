-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 049: Atomic Production System — Data Migration
-- Backfills hierarchy from existing project/space data,
-- adds catalog colors, and creates sample hierarchy for
-- seed projects (iii Joints 2026, Salvage City at EDC LV).
-- ═══════════════════════════════════════════════════════

-- ═══ 1. Catalog Group Colors ════════════════════════════

-- Apply colors from the Atomic Production System spec
-- Maps existing groups to closest-match spec colors
update advance_category_groups set color = '#4A90D9' where slug = 'site';           -- Site Operations → Site Infrastructure
update advance_category_groups set color = '#E91E8C' where slug = 'technical';      -- Technical Production
update advance_category_groups set color = '#F5A623' where slug = 'hospitality';    -- Hospitality & Guest Experience
update advance_category_groups set color = '#D0021B' where slug = 'food-beverage';  -- Food & Beverage
update advance_category_groups set color = '#9013FE' where slug = 'workplace';      -- Workplace & Office
update advance_category_groups set color = '#50E3C2' where slug = 'transport';      -- Travel & Accommodations → Transportation
update advance_category_groups set color = '#BD10E0' where slug = 'labor';          -- Labor & Staffing
update advance_category_groups set color = '#8B572A' where slug = 'waste';          -- (no direct spec match, earthy tone)
update advance_category_groups set color = '#4ECDC4' where slug = 'weather';        -- (teal for weather/nature)
update advance_category_groups set color = '#95A5A6' where slug = 'custom';         -- (neutral gray for custom)

-- ═══ 2. Add Missing Catalog Groups from Spec ═══════════

-- These are additive — they don't replace existing groups.
-- Scenic Fabrication
insert into advance_category_groups (id, name, slug, description, color, sort_order) values
  ('a0000001-0000-0000-0000-000000000011', 'Scenic Fabrication', 'scenic', 'Custom structures, facades, scenic panels, props, dimensional décor', '#FF6B35', 11)
on conflict (id) do nothing;

-- Retail & Merchandise
insert into advance_category_groups (id, name, slug, description, color, sort_order) values
  ('a0000001-0000-0000-0000-000000000012', 'Retail & Merchandise', 'retail', 'Merchandise displays, point of sale systems', '#7ED321', 12)
on conflict (id) do nothing;

-- Permits, Legal & Compliance
insert into advance_category_groups (id, name, slug, description, color, sort_order) values
  ('a0000001-0000-0000-0000-000000000013', 'Permits, Legal & Compliance', 'compliance', 'Permits, licensing, insurance, public safety, ADA, sustainability', '#8B572A', 13)
on conflict (id) do nothing;

-- ═══ 3. Add categories for new groups ═══════════════════

-- Scenic Fabrication categories
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000025', 'a0000001-0000-0000-0000-000000000011', 'Custom Structures & Facades', 'custom-structures', 1),
  ('b0000001-0000-0000-0000-000000000026', 'a0000001-0000-0000-0000-000000000011', 'Scenic Panels & Walls', 'scenic-panels', 2),
  ('b0000001-0000-0000-0000-000000000027', 'a0000001-0000-0000-0000-000000000011', 'Props & Dimensional Décor', 'props-decor', 3),
  ('b0000001-0000-0000-0000-000000000028', 'a0000001-0000-0000-0000-000000000011', 'Dimensional Signage & Logos', 'dimensional-signage', 4),
  ('b0000001-0000-0000-0000-000000000029', 'a0000001-0000-0000-0000-000000000011', 'Surface Finishing & Wraps', 'surface-finishing', 5),
  ('b0000001-0000-0000-0000-000000000030', 'a0000001-0000-0000-0000-000000000011', 'Modular Build Systems', 'modular-builds', 6)
on conflict (id) do nothing;

-- Retail & Merchandise categories
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000031', 'a0000001-0000-0000-0000-000000000012', 'Merchandise Displays', 'merch-displays', 1),
  ('b0000001-0000-0000-0000-000000000032', 'a0000001-0000-0000-0000-000000000012', 'Point of Sale', 'pos', 2)
on conflict (id) do nothing;

-- Permits, Legal & Compliance categories
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000033', 'a0000001-0000-0000-0000-000000000013', 'Municipal Permits & Licensing', 'municipal-permits', 1),
  ('b0000001-0000-0000-0000-000000000034', 'a0000001-0000-0000-0000-000000000013', 'Alcohol & Food Licensing', 'alcohol-food-licensing', 2),
  ('b0000001-0000-0000-0000-000000000035', 'a0000001-0000-0000-0000-000000000013', 'Insurance & Liability', 'insurance', 3),
  ('b0000001-0000-0000-0000-000000000036', 'a0000001-0000-0000-0000-000000000013', 'Public Safety Plans', 'safety-plans', 4),
  ('b0000001-0000-0000-0000-000000000037', 'a0000001-0000-0000-0000-000000000013', 'ADA & Accessibility', 'ada-accessibility', 5),
  ('b0000001-0000-0000-0000-000000000038', 'a0000001-0000-0000-0000-000000000013', 'Environmental & Sustainability', 'environmental', 6)
on conflict (id) do nothing;

-- ═══ 4. Create Events from Existing Seed Projects ══════

-- iii Joints 2026: single-day event
insert into events (id, project_id, organization_id, name, slug, description, status, start_date, end_date, load_in_date, strike_date, venue_id, sort_order) values
  ('e0000001-0000-0000-0000-111101005001',
   'a0000001-0000-0000-0000-111101005000',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'iii Joints 2026 — Main Event',
   'main-event',
   'Single-day music and culture festival at Factory Town, Miami',
   'advancing',
   '2026-05-23',
   '2026-05-23',
   '2026-05-20',
   '2026-05-25',
   'f0000001-0000-0000-0000-fac707100001',
   1)
on conflict (id) do nothing;

-- Salvage City at EDC LV: 3-night event
insert into events (id, project_id, organization_id, name, slug, description, status, start_date, end_date, load_in_date, strike_date, venue_id, sort_order) values
  ('e0000002-0000-0000-0000-5a1a9ec17201',
   'a0000002-0000-0000-0000-5a1a9ec17200',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Salvage City at EDC Las Vegas 2026',
   'edc-lv-2026',
   'Immersive post-apocalyptic dining experience at EDC Las Vegas',
   'advancing',
   '2026-05-15',
   '2026-05-17',
   '2026-05-12',
   '2026-05-19',
   'f0000002-0000-0000-0000-1a5e9a500001',
   1)
on conflict (id) do nothing;

-- ═══ 5. Create Zones from Existing Spaces (iii Joints) ═

-- Satiiiva (The Park) → Zone: Main Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, capacity, sort_order) values
  ('30000001-0000-0000-0000-5a7111a00001',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Satiiiva (The Park)',
   'satiiiva-the-park',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a1',
   null,
   1)
on conflict (id) do nothing;

-- Strain Room (Chain Room) → Zone: Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000001-0000-0000-0000-573a10200001',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Strain Room (Chain Room)',
   'strain-room-chain-room',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a2',
   2)
on conflict (id) do nothing;

-- Skate Space (Warehouse) → Zone: Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000001-0000-0000-0000-50a7e50ace01',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Skate Space (Warehouse)',
   'skate-space-warehouse',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a3',
   3)
on conflict (id) do nothing;

-- Kush Gardens (Cypress End) → Zone: Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000001-0000-0000-0000-005b9a4de051',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Kush Gardens (Cypress End)',
   'kush-gardens-cypress-end',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a4',
   4)
on conflict (id) do nothing;

-- Diesel Den (Engine Room) → Zone: Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000001-0000-0000-0000-d1e5e1de0001',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Diesel Den (Engine Room)',
   'diesel-den-engine-room',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a5',
   5)
on conflict (id) do nothing;

-- Reefer Theater (Infinity Room) → Zone: Stage
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000001-0000-0000-0000-4eefe47bea71',
   'e0000001-0000-0000-0000-111101005001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Reefer Theater (Infinity Room)',
   'reefer-theater-infinity-room',
   'stage',
   'advancing',
   'f0000001-0000-0000-0000-57a9e00000a6',
   6)
on conflict (id) do nothing;

-- ═══ 6. Create Zones from Salvage City Spaces ══════════

-- Main Dining Tent → Zone
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, capacity, sort_order) values
  ('30000002-0000-0000-0000-d1010970e001',
   'e0000002-0000-0000-0000-5a1a9ec17201',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Main Dining Tent',
   'main-dining-tent',
   'vip',
   'advancing',
   'f0000002-0000-0000-0000-57a9e00000b1',
   80,
   1)
on conflict (id) do nothing;

-- Performance Area → Zone
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000002-0000-0000-0000-0e4f04be4501',
   'e0000002-0000-0000-0000-5a1a9ec17201',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Performance Area',
   'performance-area',
   'stage',
   'advancing',
   'f0000002-0000-0000-0000-57a9e00000b3',
   2)
on conflict (id) do nothing;

-- Bar & Cocktail Station → Zone
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000002-0000-0000-0000-ba4000000001',
   'e0000002-0000-0000-0000-5a1a9ec17201',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Bar & Cocktail Station',
   'bar-cocktail-station',
   'vip',
   'advancing',
   'f0000002-0000-0000-0000-57a9e00000b4',
   3)
on conflict (id) do nothing;

-- Production Kitchen → Zone (BOH)
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000002-0000-0000-0000-0170be000001',
   'e0000002-0000-0000-0000-5a1a9ec17201',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Production Kitchen',
   'production-kitchen',
   'boh',
   'advancing',
   'f0000002-0000-0000-0000-57a9e00000b2',
   4)
on conflict (id) do nothing;

-- Backstage / Green Room → Zone (BOH)
insert into zones (id, event_id, organization_id, name, slug, type, status, location_id, sort_order) values
  ('30000002-0000-0000-0000-bac05790e001',
   'e0000002-0000-0000-0000-5a1a9ec17201',
   (select organization_id from projects where id = 'a0000002-0000-0000-0000-5a1a9ec17200'),
   'Backstage / Green Room',
   'backstage-green-room',
   'boh',
   'advancing',
   'f0000002-0000-0000-0000-57a9e00000b5',
   5)
on conflict (id) do nothing;

-- ═══ 7. Sample Activations (iii Joints — Satiiiva) ═════

-- DJ Performance activation
insert into activations (id, zone_id, organization_id, name, slug, type, status, sort_order) values
  ('40000001-0000-0000-0000-5a7111a00001',
   '30000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'DJ Performance',
   'dj-performance',
   'performance',
   'advancing',
   1)
on conflict (id) do nothing;

-- VIP Lounge activation  
insert into activations (id, zone_id, organization_id, name, slug, type, status, sort_order) values
  ('40000001-0000-0000-0000-5a7111a00002',
   '30000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'VIP Viewing Area',
   'vip-viewing-area',
   'lounge',
   'draft',
   2)
on conflict (id) do nothing;

-- ═══ 8. Sample Components (iii Joints — DJ Performance) ═

-- DJ Booth component
insert into components (id, activation_id, organization_id, name, slug, type, status, sort_order) values
  ('50000001-0000-0000-0000-d000b0070001',
   '40000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'DJ Booth',
   'dj-booth',
   'technical',
   'advancing',
   1)
on conflict (id) do nothing;

-- Main PA component
insert into components (id, activation_id, organization_id, name, slug, type, status, sort_order) values
  ('50000001-0000-0000-0000-a100a0000001',
   '40000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Main PA System',
   'main-pa-system',
   'technical',
   'advancing',
   2)
on conflict (id) do nothing;

-- Lighting Rig component
insert into components (id, activation_id, organization_id, name, slug, type, status, sort_order) values
  ('50000001-0000-0000-0000-119074190001',
   '40000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Lighting Rig',
   'lighting-rig',
   'technical',
   'advancing',
   3)
on conflict (id) do nothing;

-- Stage Deck component
insert into components (id, activation_id, organization_id, name, slug, type, status, sort_order) values
  ('50000001-0000-0000-0000-57a9edec0001',
   '40000001-0000-0000-0000-5a7111a00001',
   (select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'Stage Deck',
   'stage-deck',
   'buildable',
   'advancing',
   4)
on conflict (id) do nothing;



-- ═══ 12. Sample Gate Tasks ═════════════════════════════

-- Event-level gate: site plan approval
insert into hierarchy_tasks (organization_id, event_id, title, description, status, priority, is_gate, sort_order) values
  ((select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   'e0000001-0000-0000-0000-111101005001',
   'Approve Final Site Plan',
   'Site plan must be approved by production and venue management before event can be confirmed.',
   'pending', 1, true, 1);

-- Zone-level gate: sound check requirements
insert into hierarchy_tasks (organization_id, zone_id, title, description, status, priority, is_gate, sort_order) values
  ((select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   '30000001-0000-0000-0000-5a7111a00001',
   'Complete Sound System Design',
   'PA system design must be approved by audio team before Satiiiva zone is confirmed.',
   'in_progress', 1, true, 1);

-- Component-level gate: rigging certification
insert into hierarchy_tasks (organization_id, component_id, title, description, status, priority, is_gate, sort_order) values
  ((select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   '50000001-0000-0000-0000-119074190001',
   'Rigging Point Certification',
   'All rigging points must be certified by ETCP rigger before lighting rig component is confirmed.',
   'pending', 1, true, 1);

-- Non-gate task: general checklist item
insert into hierarchy_tasks (organization_id, zone_id, title, description, status, priority, is_gate, sort_order) values
  ((select organization_id from projects where id = 'a0000001-0000-0000-0000-111101005000'),
   '30000001-0000-0000-0000-5a7111a00001',
   'Order DJ rider items',
   'Confirm and order all backline items from the DJ technical rider.',
   'pending', 0, false, 2);
