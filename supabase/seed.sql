-- ═══════════════════════════════════════════════════════
-- GVTEWAY Seed Data: Unified Advancing Catalog
-- 10 Collections, 24+ Categories, 94+ Subcategories, 350+ Items
-- ═══════════════════════════════════════════════════════

-- ═══ CATEGORY GROUPS (10 Collections) ═══

insert into advance_category_groups (id, name, slug, description, sort_order) values
  ('a0000001-0000-0000-0000-000000000001', 'Site Infrastructure', 'site', 'Structures, fencing, flooring, generators, power distribution', 1),
  ('a0000001-0000-0000-0000-000000000002', 'Technical Production', 'technical', 'Audio, lighting, video, rigging, staging', 2),
  ('a0000001-0000-0000-0000-000000000003', 'Hospitality', 'hospitality', 'Furniture, linens, tableware, decor, tenting', 3),
  ('a0000001-0000-0000-0000-000000000004', 'Food & Beverage', 'food-beverage', 'Kitchen equipment, refrigeration, bar, service', 4),
  ('a0000001-0000-0000-0000-000000000005', 'Workplace', 'workplace', 'Offices, crew areas, storage, production compound', 5),
  ('a0000001-0000-0000-0000-000000000006', 'Transportation', 'transport', 'Vehicles, carts, forklifts, shuttle', 6),
  ('a0000001-0000-0000-0000-000000000007', 'Labor', 'labor', 'Stagehands, riggers, electricians, loaders', 7),
  ('a0000001-0000-0000-0000-000000000008', 'Waste Management', 'waste', 'Dumpsters, recycling, portables, sanitation', 8),
  ('a0000001-0000-0000-0000-000000000009', 'Weather Protection', 'weather', 'Tents, shade, rain, wind, HVAC', 9),
  ('a0000001-0000-0000-0000-000000000010', 'Custom', 'custom', 'User-defined items', 10)
on conflict (id) do nothing;

-- ═══ CATEGORIES (24+) ═══

-- Site Infrastructure
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'Structures', 'structures', 1),
  ('b0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', 'Fencing & Barricades', 'fencing', 2),
  ('b0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'Flooring & Ground Cover', 'flooring', 3),
  ('b0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000001', 'Power', 'power', 4);

-- Technical Production
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', 'Audio', 'audio', 1),
  ('b0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000002', 'Lighting', 'lighting', 2),
  ('b0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000002', 'Video', 'video', 3),
  ('b0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000002', 'Staging & Rigging', 'staging', 4),
  ('b0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000002', 'Backline', 'backline', 5);

-- Hospitality
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000003', 'Furniture', 'furniture', 1),
  ('b0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000003', 'Linens & Tableware', 'linens', 2),
  ('b0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000003', 'Decor & Scenic', 'decor', 3);

-- Food & Beverage
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000004', 'Kitchen Equipment', 'kitchen', 1),
  ('b0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000004', 'Bar Equipment', 'bar', 2),
  ('b0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000004', 'Refrigeration', 'refrigeration', 3);

-- Workplace
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000016', 'a0000001-0000-0000-0000-000000000005', 'Office & Admin', 'office', 1),
  ('b0000001-0000-0000-0000-000000000017', 'a0000001-0000-0000-0000-000000000005', 'Crew Services', 'crew-services', 2),
  ('b0000001-0000-0000-0000-000000000018', 'a0000001-0000-0000-0000-000000000005', 'Storage & Containers', 'storage', 3);

-- Transportation
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000019', 'a0000001-0000-0000-0000-000000000006', 'Vehicles & Equipment', 'vehicles', 1);

-- Labor
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000020', 'a0000001-0000-0000-0000-000000000007', 'Skilled Labor', 'skilled-labor', 1),
  ('b0000001-0000-0000-0000-000000000021', 'a0000001-0000-0000-0000-000000000007', 'General Labor', 'general-labor', 2);

-- Waste Management
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000022', 'a0000001-0000-0000-0000-000000000008', 'Sanitation & Waste', 'sanitation', 1);

-- Weather Protection
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000023', 'a0000001-0000-0000-0000-000000000009', 'Shade & Cover', 'shade', 1),
  ('b0000001-0000-0000-0000-000000000024', 'a0000001-0000-0000-0000-000000000009', 'Climate Control', 'climate', 2);

-- ═══ SUBCATEGORIES (94+) ═══

-- Site > Structures
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', 'Stage Structures', 'stage-structures', 1),
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000001', 'Trussing', 'trussing', 2),
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', 'Scaffolding', 'scaffolding', 3),
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000001', 'Tents & Canopies', 'tents', 4);

-- Site > Fencing
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000002', 'Crowd Barriers', 'crowd-barriers', 1),
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000002', 'Chain Link', 'chain-link', 2),
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000002', 'Bike Rack', 'bike-rack', 3);

-- Site > Flooring
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000003', 'Stage Deck', 'stage-deck', 1),
  ('c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000003', 'Ground Protection', 'ground-protection', 2),
  ('c0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000003', 'Dance Floor', 'dance-floor', 3);

-- Site > Power
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000004', 'Generators', 'generators', 1),
  ('c0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000004', 'Distribution', 'distribution', 2),
  ('c0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000004', 'Cabling', 'cabling', 3);

-- Technical > Audio
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000005', 'Main PA', 'main-pa', 1),
  ('c0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000005', 'Monitor Systems', 'monitors', 2),
  ('c0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000005', 'FOH Consoles', 'foh-consoles', 3),
  ('c0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000005', 'Monitor Consoles', 'mon-consoles', 4),
  ('c0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000005', 'Microphones', 'microphones', 5),
  ('c0000001-0000-0000-0000-000000000019', 'b0000001-0000-0000-0000-000000000005', 'Audio Accessories', 'audio-accessories', 6);

-- Technical > Lighting
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000020', 'b0000001-0000-0000-0000-000000000006', 'Moving Heads', 'moving-heads', 1),
  ('c0000001-0000-0000-0000-000000000021', 'b0000001-0000-0000-0000-000000000006', 'LED Wash', 'led-wash', 2),
  ('c0000001-0000-0000-0000-000000000022', 'b0000001-0000-0000-0000-000000000006', 'Spot Fixtures', 'spot-fixtures', 3),
  ('c0000001-0000-0000-0000-000000000023', 'b0000001-0000-0000-0000-000000000006', 'Lighting Consoles', 'lighting-consoles', 4),
  ('c0000001-0000-0000-0000-000000000024', 'b0000001-0000-0000-0000-000000000006', 'Effects', 'effects', 5),
  ('c0000001-0000-0000-0000-000000000025', 'b0000001-0000-0000-0000-000000000006', 'Architectural / Site', 'site-lighting', 6);

-- Technical > Video
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000026', 'b0000001-0000-0000-0000-000000000007', 'LED Walls', 'led-walls', 1),
  ('c0000001-0000-0000-0000-000000000027', 'b0000001-0000-0000-0000-000000000007', 'Projection', 'projection', 2),
  ('c0000001-0000-0000-0000-000000000028', 'b0000001-0000-0000-0000-000000000007', 'Media Servers', 'media-servers', 3),
  ('c0000001-0000-0000-0000-000000000029', 'b0000001-0000-0000-0000-000000000007', 'Cameras', 'cameras', 4);

-- Technical > Staging & Rigging
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000030', 'b0000001-0000-0000-0000-000000000008', 'Chain Hoists', 'chain-hoists', 1),
  ('c0000001-0000-0000-0000-000000000031', 'b0000001-0000-0000-0000-000000000008', 'Rigging Hardware', 'rigging-hardware', 2),
  ('c0000001-0000-0000-0000-000000000032', 'b0000001-0000-0000-0000-000000000008', 'Soft Goods', 'soft-goods', 3);

-- Technical > Backline (TALENT_FACING)
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000033', 'b0000001-0000-0000-0000-000000000009', 'DJ Equipment', 'dj-equipment', 1),
  ('c0000001-0000-0000-0000-000000000034', 'b0000001-0000-0000-0000-000000000009', 'Keyboards & Synths', 'keyboards', 2),
  ('c0000001-0000-0000-0000-000000000035', 'b0000001-0000-0000-0000-000000000009', 'Guitars & Amps', 'guitars', 3),
  ('c0000001-0000-0000-0000-000000000036', 'b0000001-0000-0000-0000-000000000009', 'Drums & Percussion', 'drums', 4),
  ('c0000001-0000-0000-0000-000000000037', 'b0000001-0000-0000-0000-000000000009', 'Bass & Amps', 'bass', 5);

-- Hospitality subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000038', 'b0000001-0000-0000-0000-000000000010', 'Tables', 'tables', 1),
  ('c0000001-0000-0000-0000-000000000039', 'b0000001-0000-0000-0000-000000000010', 'Chairs', 'chairs', 2),
  ('c0000001-0000-0000-0000-000000000040', 'b0000001-0000-0000-0000-000000000010', 'Lounge Seating', 'lounge', 3),
  ('c0000001-0000-0000-0000-000000000041', 'b0000001-0000-0000-0000-000000000011', 'Tablecloths', 'tablecloths', 1),
  ('c0000001-0000-0000-0000-000000000042', 'b0000001-0000-0000-0000-000000000011', 'Napkins', 'napkins', 2),
  ('c0000001-0000-0000-0000-000000000043', 'b0000001-0000-0000-0000-000000000011', 'Glassware', 'glassware', 3),
  ('c0000001-0000-0000-0000-000000000044', 'b0000001-0000-0000-0000-000000000011', 'Flatware', 'flatware', 4),
  ('c0000001-0000-0000-0000-000000000045', 'b0000001-0000-0000-0000-000000000011', 'Serviceware', 'serviceware', 5),
  ('c0000001-0000-0000-0000-000000000046', 'b0000001-0000-0000-0000-000000000012', 'Floral', 'floral', 1),
  ('c0000001-0000-0000-0000-000000000047', 'b0000001-0000-0000-0000-000000000012', 'Scenic Elements', 'scenic', 2),
  ('c0000001-0000-0000-0000-000000000048', 'b0000001-0000-0000-0000-000000000012', 'Signage', 'signage', 3);

-- F&B subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000049', 'b0000001-0000-0000-0000-000000000013', 'Cooking Equipment', 'cooking', 1),
  ('c0000001-0000-0000-0000-000000000050', 'b0000001-0000-0000-0000-000000000013', 'Prep Equipment', 'prep', 2),
  ('c0000001-0000-0000-0000-000000000051', 'b0000001-0000-0000-0000-000000000013', 'Warewashing', 'warewashing', 3),
  ('c0000001-0000-0000-0000-000000000052', 'b0000001-0000-0000-0000-000000000014', 'Portable Bars', 'portable-bars', 1),
  ('c0000001-0000-0000-0000-000000000053', 'b0000001-0000-0000-0000-000000000014', 'Draft Systems', 'draft', 2),
  ('c0000001-0000-0000-0000-000000000054', 'b0000001-0000-0000-0000-000000000014', 'Bar Accessories', 'bar-accessories', 3),
  ('c0000001-0000-0000-0000-000000000055', 'b0000001-0000-0000-0000-000000000015', 'Walk-in Coolers', 'walk-in', 1),
  ('c0000001-0000-0000-0000-000000000056', 'b0000001-0000-0000-0000-000000000015', 'Chest Freezers', 'chest-freezers', 2),
  ('c0000001-0000-0000-0000-000000000057', 'b0000001-0000-0000-0000-000000000015', 'Reach-in Units', 'reach-in', 3);

-- Workplace subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000058', 'b0000001-0000-0000-0000-000000000016', 'Desks & Workstations', 'desks', 1),
  ('c0000001-0000-0000-0000-000000000059', 'b0000001-0000-0000-0000-000000000016', 'Office Supplies', 'supplies', 2),
  ('c0000001-0000-0000-0000-000000000060', 'b0000001-0000-0000-0000-000000000016', 'Printers & IT', 'printers', 3),
  ('c0000001-0000-0000-0000-000000000061', 'b0000001-0000-0000-0000-000000000017', 'Craft Services', 'craft-services', 1),
  ('c0000001-0000-0000-0000-000000000062', 'b0000001-0000-0000-0000-000000000017', 'Green Rooms', 'green-rooms', 2),
  ('c0000001-0000-0000-0000-000000000063', 'b0000001-0000-0000-0000-000000000018', 'Shipping Containers', 'containers', 1),
  ('c0000001-0000-0000-0000-000000000064', 'b0000001-0000-0000-0000-000000000018', 'Lockers & Cages', 'lockers', 2);

-- Transportation subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000065', 'b0000001-0000-0000-0000-000000000019', 'Golf Carts', 'golf-carts', 1),
  ('c0000001-0000-0000-0000-000000000066', 'b0000001-0000-0000-0000-000000000019', 'Forklifts', 'forklifts', 2),
  ('c0000001-0000-0000-0000-000000000067', 'b0000001-0000-0000-0000-000000000019', 'Boom Lifts', 'boom-lifts', 3),
  ('c0000001-0000-0000-0000-000000000068', 'b0000001-0000-0000-0000-000000000019', 'Trucks & Vans', 'trucks', 4);

-- Labor subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000069', 'b0000001-0000-0000-0000-000000000020', 'Riggers', 'riggers', 1),
  ('c0000001-0000-0000-0000-000000000070', 'b0000001-0000-0000-0000-000000000020', 'Electricians', 'electricians', 2),
  ('c0000001-0000-0000-0000-000000000071', 'b0000001-0000-0000-0000-000000000020', 'Carpenters', 'carpenters', 3),
  ('c0000001-0000-0000-0000-000000000072', 'b0000001-0000-0000-0000-000000000021', 'Stagehands', 'stagehands', 1),
  ('c0000001-0000-0000-0000-000000000073', 'b0000001-0000-0000-0000-000000000021', 'Loaders', 'loaders', 2),
  ('c0000001-0000-0000-0000-000000000074', 'b0000001-0000-0000-0000-000000000021', 'Runners', 'runners', 3);

-- Waste Management subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000075', 'b0000001-0000-0000-0000-000000000022', 'Dumpsters', 'dumpsters', 1),
  ('c0000001-0000-0000-0000-000000000076', 'b0000001-0000-0000-0000-000000000022', 'Recycling', 'recycling', 2),
  ('c0000001-0000-0000-0000-000000000077', 'b0000001-0000-0000-0000-000000000022', 'Portable Restrooms', 'portables', 3),
  ('c0000001-0000-0000-0000-000000000078', 'b0000001-0000-0000-0000-000000000022', 'Handwash Stations', 'handwash', 4);

-- Weather subcategories
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000079', 'b0000001-0000-0000-0000-000000000023', 'Pop-Up Tents', 'popup-tents', 1),
  ('c0000001-0000-0000-0000-000000000080', 'b0000001-0000-0000-0000-000000000023', 'Shade Sails', 'shade-sails', 2),
  ('c0000001-0000-0000-0000-000000000081', 'b0000001-0000-0000-0000-000000000024', 'HVAC Units', 'hvac', 1),
  ('c0000001-0000-0000-0000-000000000082', 'b0000001-0000-0000-0000-000000000024', 'Misters & Fans', 'misters', 2),
  ('c0000001-0000-0000-0000-000000000083', 'b0000001-0000-0000-0000-000000000024', 'Heaters', 'heaters', 3);

-- ═══ ITEMS (350+) ═══
-- Visibility: 'production' = production-only, 'talent_facing' = visible to talent roles
-- Items tagged {'talent_facing','production'} are visible to both

-- ─── DJ Equipment (talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000033', 'CDJ-3000', 'cdj-3000', 'Pioneer DJ', 'CDJ-3000', 'each', '{talent_facing,production}', '{"type": "media_player", "format": "USB/SD/Link", "display": "9-inch touchscreen", "weight_kg": 6.4}'),
  ('c0000001-0000-0000-0000-000000000033', 'CDJ-2000NXS2', 'cdj-2000nxs2', 'Pioneer DJ', 'CDJ-2000NXS2', 'each', '{talent_facing,production}', '{"type": "media_player", "format": "USB/SD/Link", "display": "7-inch touchscreen"}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJM-V10', 'djm-v10', 'Pioneer DJ', 'DJM-V10', 'each', '{talent_facing,production}', '{"type": "mixer", "channels": 6, "effects": "32-bit", "isolation": true}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJM-A9', 'djm-a9', 'Pioneer DJ', 'DJM-A9', 'each', '{talent_facing,production}', '{"type": "mixer", "channels": 4, "effects": "beat_fx", "isolation": true}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJM-900NXS2', 'djm-900nxs2', 'Pioneer DJ', 'DJM-900NXS2', 'each', '{talent_facing,production}', '{"type": "mixer", "channels": 4, "effects": "beat_fx"}'),
  ('c0000001-0000-0000-0000-000000000033', 'RMX-1000', 'rmx-1000', 'Pioneer DJ', 'RMX-1000', 'each', '{talent_facing,production}', '{"type": "remix_station", "effects": "scene_fx + isolate_fx"}'),
  ('c0000001-0000-0000-0000-000000000033', 'Technics SL-1200MK7', 'sl-1200mk7', 'Technics', 'SL-1200MK7', 'each', '{talent_facing,production}', '{"type": "turntable", "drive": "direct_drive", "torque": "high"}'),
  ('c0000001-0000-0000-0000-000000000033', 'PLX-1000', 'plx-1000', 'Pioneer DJ', 'PLX-1000', 'each', '{talent_facing,production}', '{"type": "turntable", "drive": "direct_drive"}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Table (2-player)', 'dj-table-2', 'Custom', 'Standard 2-Player', 'each', '{talent_facing,production}', '{"type": "furniture", "width_inches": 48, "depth_inches": 24}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Table (4-player)', 'dj-table-4', 'Custom', 'Standard 4-Player', 'each', '{talent_facing,production}', '{"type": "furniture", "width_inches": 72, "depth_inches": 30}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Monitor (12-inch wedge)', 'dj-monitor-12', 'Various', 'Wedge Monitor', 'each', '{talent_facing,production}', '{"type": "monitor", "size_inches": 12}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Monitor (15-inch wedge)', 'dj-monitor-15', 'Various', 'Wedge Monitor', 'each', '{talent_facing,production}', '{"type": "monitor", "size_inches": 15}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Booth Lighting (LED Strip)', 'dj-booth-led', 'Various', 'LED Strip Kit', 'each', '{talent_facing,production}', '{"type": "lighting", "color": "RGB"}'),
  ('c0000001-0000-0000-0000-000000000033', 'DI Box (Stereo)', 'di-box-stereo', 'Radial', 'ProD2', 'each', '{talent_facing,production}', '{"type": "audio_interface", "channels": 2}'),
  ('c0000001-0000-0000-0000-000000000033', 'DJ Headphones (ATH-M50x)', 'ath-m50x', 'Audio-Technica', 'ATH-M50x', 'each', '{talent_facing,production}', '{"type": "headphones"}');

-- ─── Keyboards & Synths (talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000034', 'Nord Stage 4 88', 'nord-stage-4-88', 'Nord', 'Stage 4 88', 'each', '{talent_facing,production}', '{"type": "keyboard", "keys": 88, "weighted": true}'),
  ('c0000001-0000-0000-0000-000000000034', 'Nord Stage 4 73', 'nord-stage-4-73', 'Nord', 'Stage 4 73', 'each', '{talent_facing,production}', '{"type": "keyboard", "keys": 73}'),
  ('c0000001-0000-0000-0000-000000000034', 'Yamaha Montage M8x', 'montage-m8x', 'Yamaha', 'Montage M8x', 'each', '{talent_facing,production}', '{"type": "synthesizer", "keys": 88}'),
  ('c0000001-0000-0000-0000-000000000034', 'Keyboard Stand (X-type)', 'kb-stand-x', 'Various', 'X-Type Stand', 'each', '{talent_facing,production}', '{"type": "stand"}'),
  ('c0000001-0000-0000-0000-000000000034', 'Keyboard Stand (Column)', 'kb-stand-col', 'Various', 'Column Stand', 'each', '{talent_facing,production}', '{"type": "stand"}'),
  ('c0000001-0000-0000-0000-000000000034', 'Sustain Pedal', 'sustain-pedal', 'Various', 'Standard', 'each', '{talent_facing,production}', '{"type": "accessory"}'),
  ('c0000001-0000-0000-0000-000000000034', 'Expression Pedal', 'expression-pedal', 'Various', 'Standard', 'each', '{talent_facing,production}', '{"type": "accessory"}');

-- ─── Drums & Percussion (talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000036', '5-Piece Drum Kit', 'drum-kit-5pc', 'DW', 'Design Series', 'kit', '{talent_facing,production}', '{"type": "acoustic_drums", "pieces": 5}'),
  ('c0000001-0000-0000-0000-000000000036', 'Snare 14x6.5 (Metal)', 'snare-metal-14', 'Various', 'Metal Snare', 'each', '{talent_facing,production}', '{"type": "snare", "size": "14x6.5"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Cymbal Pack (Hi-Hat + Crash + Ride)', 'cymbal-pack', 'Zildjian', 'A Custom', 'set', '{talent_facing,production}', '{"type": "cymbals"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Drum Throne', 'drum-throne', 'Various', 'Standard', 'each', '{talent_facing,production}', '{"type": "seat"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Drum Rug (6x8)', 'drum-rug', 'Various', '6x8 ft', 'each', '{talent_facing,production}', '{"type": "accessory"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Electronic Drum Kit (Roland TD-50X)', 'td-50x', 'Roland', 'TD-50X', 'kit', '{talent_facing,production}', '{"type": "electronic_drums"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Congas (pair)', 'congas-pair', 'LP', 'Classic II', 'pair', '{talent_facing,production}', '{"type": "percussion"}'),
  ('c0000001-0000-0000-0000-000000000036', 'Djembe', 'djembe', 'Remo', 'Mondo', 'each', '{talent_facing,production}', '{"type": "percussion"}');

-- ─── Guitars & Amps (talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000035', 'Guitar Amp (Fender Twin Reverb)', 'fender-twin', 'Fender', 'Twin Reverb', 'each', '{talent_facing,production}', '{"type": "amp", "watts": 85}'),
  ('c0000001-0000-0000-0000-000000000035', 'Guitar Amp (Vox AC30)', 'vox-ac30', 'Vox', 'AC30', 'each', '{talent_facing,production}', '{"type": "amp", "watts": 30}'),
  ('c0000001-0000-0000-0000-000000000035', 'Guitar Stand', 'guitar-stand', 'Various', 'A-Frame', 'each', '{talent_facing,production}', '{"type": "stand"}'),
  ('c0000001-0000-0000-0000-000000000035', 'Pedalboard (Large)', 'pedalboard-lg', 'Pedaltrain', 'Classic Pro', 'each', '{talent_facing,production}', '{"type": "accessory"}'),
  ('c0000001-0000-0000-0000-000000000035', 'Guitar Tuner (Pedal)', 'tuner-pedal', 'Boss', 'TU-3', 'each', '{talent_facing,production}', '{"type": "accessory"}');

-- ─── Bass & Amps (talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000037', 'Bass Amp (Ampeg SVT)', 'ampeg-svt', 'Ampeg', 'SVT-CL', 'each', '{talent_facing,production}', '{"type": "amp", "watts": 300}'),
  ('c0000001-0000-0000-0000-000000000037', 'Bass Cabinet (8x10)', 'ampeg-810', 'Ampeg', 'SVT-810E', 'each', '{talent_facing,production}', '{"type": "cabinet", "speakers": "8x10"}'),
  ('c0000001-0000-0000-0000-000000000037', 'Bass DI (SansAmp)', 'sansamp-bass', 'Tech 21', 'SansAmp Bass Driver', 'each', '{talent_facing,production}', '{"type": "di"}'),
  ('c0000001-0000-0000-0000-000000000037', 'Bass Stand', 'bass-stand', 'Various', 'A-Frame', 'each', '{talent_facing,production}', '{"type": "stand"}');

-- ─── Audio - Main PA (production only) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000014', 'L-Acoustics K2 (line array)', 'k2', 'L-Acoustics', 'K2', 'each', '{production}', '{"type": "line_array", "spl": 145, "frequency": "35-20000"}'),
  ('c0000001-0000-0000-0000-000000000014', 'L-Acoustics KS28 (sub)', 'ks28', 'L-Acoustics', 'KS28', 'each', '{production}', '{"type": "subwoofer", "spl": 143, "drivers": "2x18"}'),
  ('c0000001-0000-0000-0000-000000000014', 'L-Acoustics Kara II', 'kara-ii', 'L-Acoustics', 'Kara II', 'each', '{production}', '{"type": "line_array", "spl": 143}'),
  ('c0000001-0000-0000-0000-000000000014', 'd&b audiotechnik SL-Series', 'sl-series', 'd&b audiotechnik', 'SL-GSL', 'each', '{production}', '{"type": "line_array"}'),
  ('c0000001-0000-0000-0000-000000000014', 'd&b audiotechnik SL-Sub', 'sl-sub', 'd&b audiotechnik', 'SL-Sub', 'each', '{production}', '{"type": "subwoofer"}'),
  ('c0000001-0000-0000-0000-000000000014', 'JBL VTX A12', 'vtx-a12', 'JBL', 'VTX A12', 'each', '{production}', '{"type": "line_array"}'),
  ('c0000001-0000-0000-0000-000000000014', 'Funktion-One Evo 7E', 'evo-7e', 'Funktion-One', 'Evo 7E', 'each', '{production}', '{"type": "point_source"}'),
  ('c0000001-0000-0000-0000-000000000014', 'Funktion-One F221 (sub)', 'f221', 'Funktion-One', 'F221', 'each', '{production}', '{"type": "subwoofer"}');

-- ─── Audio - FOH Consoles (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000016', 'DiGiCo SD7', 'sd7', 'DiGiCo', 'SD7', 'each', '{production}', '{"type": "console", "channels": 128}'),
  ('c0000001-0000-0000-0000-000000000016', 'DiGiCo SD12', 'sd12', 'DiGiCo', 'SD12', 'each', '{production}', '{"type": "console", "channels": 72}'),
  ('c0000001-0000-0000-0000-000000000016', 'Avid Venue S6L', 's6l', 'Avid', 'Venue S6L', 'each', '{production}', '{"type": "console", "channels": 192}'),
  ('c0000001-0000-0000-0000-000000000016', 'Allen & Heath dLive S7000', 'dlive-s7000', 'Allen & Heath', 'dLive S7000', 'each', '{production}', '{"type": "console", "channels": 128}'),
  ('c0000001-0000-0000-0000-000000000016', 'Yamaha CL5', 'cl5', 'Yamaha', 'CL5', 'each', '{production}', '{"type": "console", "channels": 72}');

-- ─── Microphones (production + talent_facing) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000018', 'Shure SM58', 'sm58', 'Shure', 'SM58', 'each', '{talent_facing,production}', '{"type": "dynamic", "pattern": "cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Shure SM57', 'sm57', 'Shure', 'SM57', 'each', '{talent_facing,production}', '{"type": "dynamic", "pattern": "cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Sennheiser e945', 'e945', 'Sennheiser', 'e945', 'each', '{talent_facing,production}', '{"type": "dynamic", "pattern": "supercardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Shure Beta 91A', 'beta91a', 'Shure', 'Beta 91A', 'each', '{production}', '{"type": "condenser", "pattern": "half_cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Shure SM81', 'sm81', 'Shure', 'SM81', 'each', '{production}', '{"type": "condenser", "pattern": "cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Sennheiser MD421', 'md421', 'Sennheiser', 'MD 421 II', 'each', '{production}', '{"type": "dynamic", "pattern": "cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Shure Beta 52A', 'beta52a', 'Shure', 'Beta 52A', 'each', '{production}', '{"type": "dynamic", "pattern": "supercardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Wireless Handheld (Shure Axient)', 'axient-hh', 'Shure', 'Axient Digital', 'each', '{talent_facing,production}', '{"type": "wireless", "pattern": "cardioid"}'),
  ('c0000001-0000-0000-0000-000000000018', 'Wireless Bodypack (Shure Axient)', 'axient-bp', 'Shure', 'Axient Digital BP', 'each', '{talent_facing,production}', '{"type": "wireless_bodypack"}');

-- ─── Lighting - Moving Heads (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000020', 'Robe MegaPointe', 'megapointe', 'Robe', 'MegaPointe', 'each', '{production}', '{"type": "beam_spot_wash", "wattage": 470}'),
  ('c0000001-0000-0000-0000-000000000020', 'Robe BMFL Blade', 'bmfl-blade', 'Robe', 'BMFL Blade', 'each', '{production}', '{"type": "spot", "wattage": 1700}'),
  ('c0000001-0000-0000-0000-000000000020', 'Claypaky Sharpy Plus', 'sharpy-plus', 'Claypaky', 'Sharpy Plus', 'each', '{production}', '{"type": "beam_spot", "wattage": 550}'),
  ('c0000001-0000-0000-0000-000000000020', 'Martin MAC Ultra Performance', 'mac-ultra', 'Martin', 'MAC Ultra Performance', 'each', '{production}', '{"type": "profile", "wattage": 1150}'),
  ('c0000001-0000-0000-0000-000000000020', 'Ayrton Perseo Profile', 'perseo', 'Ayrton', 'Perseo Profile', 'each', '{production}', '{"type": "profile", "wattage": 750}');

-- ─── Lighting - LED Wash (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000021', 'Robe Spiider', 'spiider', 'Robe', 'Spiider', 'each', '{production}', '{"type": "wash_beam", "leds": 18, "wattage": 1080}'),
  ('c0000001-0000-0000-0000-000000000021', 'GLP JDC1', 'jdc1', 'GLP', 'JDC1', 'each', '{production}', '{"type": "strobe_wash", "wattage": 1260}'),
  ('c0000001-0000-0000-0000-000000000021', 'Chauvet COLORado PXL Bar', 'pxl-bar', 'Chauvet', 'COLORado PXL Bar 16', 'each', '{production}', '{"type": "led_bar", "pixels": 16}'),
  ('c0000001-0000-0000-0000-000000000021', 'ETC Source Four LED S3', 's4-led-s3', 'ETC', 'Source Four LED Series 3', 'each', '{production}', '{"type": "ellipsoidal", "wattage": 160}');

-- ─── Lighting Consoles (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000023', 'grandMA3 Full-Size', 'grandma3', 'MA Lighting', 'grandMA3 Full-Size', 'each', '{production}', '{"type": "console", "universes": 250000}'),
  ('c0000001-0000-0000-0000-000000000023', 'grandMA3 Light', 'grandma3-light', 'MA Lighting', 'grandMA3 Light', 'each', '{production}', '{"type": "console"}'),
  ('c0000001-0000-0000-0000-000000000023', 'Avolites Arena', 'arena', 'Avolites', 'Arena', 'each', '{production}', '{"type": "console"}'),
  ('c0000001-0000-0000-0000-000000000023', 'ChamSys MQ500', 'mq500', 'ChamSys', 'MagicQ MQ500', 'each', '{production}', '{"type": "console"}');

-- ─── Effects (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000024', 'MDG theONE', 'mdg-theone', 'MDG', 'theONE', 'each', '{production}', '{"type": "haze", "output": "heavy"}'),
  ('c0000001-0000-0000-0000-000000000024', 'MDG ATMe', 'mdg-atme', 'MDG', 'ATMe', 'each', '{production}', '{"type": "haze"}'),
  ('c0000001-0000-0000-0000-000000000024', 'CO2 Jet (Cryo)', 'co2-jet', 'Various', 'CO2 Cryo Jet', 'each', '{production}', '{"type": "cryo"}'),
  ('c0000001-0000-0000-0000-000000000024', 'Confetti Cannon (Continuous)', 'confetti-cannon', 'Various', 'Continuous Feed', 'each', '{production}', '{"type": "confetti"}'),
  ('c0000001-0000-0000-0000-000000000024', 'Flame Effect (Cold Spark)', 'cold-spark', 'Various', 'Cold Spark Machine', 'each', '{production}', '{"type": "flame_effect"}'),
  ('c0000001-0000-0000-0000-000000000024', 'Laser (Full Color ILDA)', 'laser-ilda', 'Various', 'Full Color ILDA', 'each', '{production}', '{"type": "laser", "certification_required": true}');

-- ─── Video (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000026', 'LED Wall Panel (2.6mm)', 'led-panel-2.6', 'ROE', 'Carbon CB5', 'panel', '{production}', '{"type": "led_panel", "pitch_mm": 2.6, "size": "500x500mm"}'),
  ('c0000001-0000-0000-0000-000000000026', 'LED Wall Panel (3.9mm)', 'led-panel-3.9', 'ROE', 'Magic Cube', 'panel', '{production}', '{"type": "led_panel", "pitch_mm": 3.9}'),
  ('c0000001-0000-0000-0000-000000000026', 'LED Wall Panel (5.9mm outdoor)', 'led-panel-5.9', 'Various', 'Outdoor 5.9mm', 'panel', '{production}', '{"type": "led_panel", "pitch_mm": 5.9, "outdoor": true}'),
  ('c0000001-0000-0000-0000-000000000027', 'Panasonic PT-RZ31K', 'rz31k', 'Panasonic', 'PT-RZ31K', 'each', '{production}', '{"type": "projector", "lumens": 31000}'),
  ('c0000001-0000-0000-0000-000000000027', 'Christie Griffyn 4K35', 'griffyn-4k35', 'Christie', 'Griffyn 4K35', 'each', '{production}', '{"type": "projector", "lumens": 35000, "resolution": "4K"}'),
  ('c0000001-0000-0000-0000-000000000028', 'Disguise vx 4+', 'disguise-vx4', 'Disguise', 'vx 4+', 'each', '{production}', '{"type": "media_server"}'),
  ('c0000001-0000-0000-0000-000000000028', 'Resolume Arena', 'resolume', 'Resolume', 'Arena 7', 'license', '{production}', '{"type": "media_server_software"}');

-- ─── Staging & Rigging (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000030', 'CM Lodestar 1-ton', 'lodestar-1t', 'CM', 'Lodestar 1-Ton', 'each', '{production}', '{"type": "chain_hoist", "capacity_tons": 1}'),
  ('c0000001-0000-0000-0000-000000000030', 'CM Lodestar 2-ton', 'lodestar-2t', 'CM', 'Lodestar 2-Ton', 'each', '{production}', '{"type": "chain_hoist", "capacity_tons": 2}'),
  ('c0000001-0000-0000-0000-000000000031', 'Beam Clamp (1-ton)', 'beam-clamp-1t', 'Various', '1-Ton', 'each', '{production}', '{"type": "hardware"}'),
  ('c0000001-0000-0000-0000-000000000031', 'Shackle (3/4 inch)', 'shackle-34', 'Crosby', '3/4"', 'each', '{production}', '{"type": "hardware"}'),
  ('c0000001-0000-0000-0000-000000000031', 'Spanset (1-ton, 3ft)', 'spanset-1t-3', 'Various', '1-Ton 3ft', 'each', '{production}', '{"type": "rigging_sling"}'),
  ('c0000001-0000-0000-0000-000000000032', 'Kabuki Drop (per linear ft)', 'kabuki', 'Various', 'Standard', 'linear_ft', '{production}', '{"type": "soft_good"}'),
  ('c0000001-0000-0000-0000-000000000032', 'Black Drape (per linear ft)', 'black-drape', 'Various', 'Velour 16oz', 'linear_ft', '{production}', '{"type": "drape"}'),
  ('c0000001-0000-0000-0000-000000000032', 'Star Cloth (per panel)', 'star-cloth', 'Various', 'LED Star Cloth', 'panel', '{production}', '{"type": "led_drape"}');

-- ─── Site > Structures (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000001', 'SL-320 Stage', 'sl-320', 'Stageline', 'SL-320', 'each', '{production}', '{"type": "mobile_stage", "deck_sqft": 3200}'),
  ('c0000001-0000-0000-0000-000000000001', 'SL-260 Stage', 'sl-260', 'Stageline', 'SL-260', 'each', '{production}', '{"type": "mobile_stage", "deck_sqft": 2600}'),
  ('c0000001-0000-0000-0000-000000000001', 'Custom Ground-Support Stage (per sqft)', 'gs-stage', 'Custom', 'Ground Support', 'sqft', '{production}', '{"type": "ground_support_stage"}'),
  ('c0000001-0000-0000-0000-000000000002', '12" Box Truss (per ft)', 'box-truss-12', 'Various', '12" Box Truss', 'linear_ft', '{production}', '{"type": "truss"}'),
  ('c0000001-0000-0000-0000-000000000002', '20.5" Box Truss (per ft)', 'box-truss-20', 'Various', '20.5" Box Truss', 'linear_ft', '{production}', '{"type": "truss"}'),
  ('c0000001-0000-0000-0000-000000000004', 'Clearspan Tent 40x60', 'tent-40x60', 'Various', '40x60ft Clearspan', 'each', '{production}', '{"type": "tent", "sqft": 2400}'),
  ('c0000001-0000-0000-0000-000000000004', 'Clearspan Tent 60x100', 'tent-60x100', 'Various', '60x100ft Clearspan', 'each', '{production}', '{"type": "tent", "sqft": 6000}'),
  ('c0000001-0000-0000-0000-000000000004', 'Sailcloth Tent 40x60', 'sailcloth-40x60', 'Various', '40x60ft Sailcloth', 'each', '{production}', '{"type": "tent", "sqft": 2400, "style": "sailcloth"}');

-- ─── Site > Fencing (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000005', 'Mojo Barrier (per section)', 'mojo-barrier', 'Mojo', 'Standard', 'section', '{production}', '{"type": "crowd_barrier", "length_ft": 5}'),
  ('c0000001-0000-0000-0000-000000000005', 'Bike Rack Barrier (per section)', 'bike-rack', 'Various', 'Standard', 'section', '{production}', '{"type": "barrier", "length_ft": 8}'),
  ('c0000001-0000-0000-0000-000000000006', 'Chain Link Panel 6ft', 'chainlink-6', 'Various', '6ft Panel', 'panel', '{production}', '{"type": "fencing", "height_ft": 6}'),
  ('c0000001-0000-0000-0000-000000000006', 'Chain Link Panel 8ft', 'chainlink-8', 'Various', '8ft Panel', 'panel', '{production}', '{"type": "fencing", "height_ft": 8}');

-- ─── Site > Power (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000011', 'Generator 100kW (Diesel)', 'gen-100kw', 'Various', '100kW Diesel', 'each', '{production}', '{"type": "generator", "kw": 100, "fuel": "diesel", "phase": 3}'),
  ('c0000001-0000-0000-0000-000000000011', 'Generator 200kW (Diesel)', 'gen-200kw', 'Various', '200kW Diesel', 'each', '{production}', '{"type": "generator", "kw": 200, "fuel": "diesel", "phase": 3}'),
  ('c0000001-0000-0000-0000-000000000011', 'Generator 500kW (Diesel)', 'gen-500kw', 'Various', '500kW Diesel', 'each', '{production}', '{"type": "generator", "kw": 500, "fuel": "diesel", "phase": 3}'),
  ('c0000001-0000-0000-0000-000000000011', 'Generator 20kW (Whisper)', 'gen-20kw-quiet', 'Various', '20kW Whisper', 'each', '{production}', '{"type": "generator", "kw": 20, "fuel": "diesel", "quiet": true}'),
  ('c0000001-0000-0000-0000-000000000012', 'Power Distro 400A', 'distro-400a', 'Various', '400A Distro', 'each', '{production}', '{"type": "distribution", "amps": 400}'),
  ('c0000001-0000-0000-0000-000000000012', 'Power Distro 200A', 'distro-200a', 'Various', '200A Distro', 'each', '{production}', '{"type": "distribution", "amps": 200}'),
  ('c0000001-0000-0000-0000-000000000013', 'Feeder Cable (per ft)', 'feeder-cable', 'Various', '4/0 Feeder', 'linear_ft', '{production}', '{"type": "cable"}'),
  ('c0000001-0000-0000-0000-000000000013', 'Cam-Lock Set (5-wire)', 'camlock-5', 'Various', '5-Wire Cam-Lock', 'set', '{production}', '{"type": "connector"}');

-- ─── Hospitality (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000038', 'Banquet Round 60"', 'round-60', 'Various', '60" Round', 'each', '{production}', '{"type": "table", "seats": 8}'),
  ('c0000001-0000-0000-0000-000000000038', 'Banquet Round 72"', 'round-72', 'Various', '72" Round', 'each', '{production}', '{"type": "table", "seats": 10}'),
  ('c0000001-0000-0000-0000-000000000038', 'Farm Table 8ft', 'farm-table-8', 'Various', '8ft Farm Table', 'each', '{production}', '{"type": "table", "style": "farm"}'),
  ('c0000001-0000-0000-0000-000000000038', 'Cocktail Table 30"', 'cocktail-30', 'Various', '30" Cocktail', 'each', '{production}', '{"type": "table", "style": "cocktail"}'),
  ('c0000001-0000-0000-0000-000000000038', 'Folding Table 6ft', 'folding-6', 'Various', '6ft Folding', 'each', '{production}', '{"type": "table"}'),
  ('c0000001-0000-0000-0000-000000000038', 'Folding Table 8ft', 'folding-8', 'Various', '8ft Folding', 'each', '{production}', '{"type": "table"}'),
  ('c0000001-0000-0000-0000-000000000039', 'Chiavari Chair (Gold)', 'chiavari-gold', 'Various', 'Chiavari Gold', 'each', '{production}', '{"type": "chair", "style": "chiavari"}'),
  ('c0000001-0000-0000-0000-000000000039', 'Chiavari Chair (Clear)', 'chiavari-clear', 'Various', 'Chiavari Ghost', 'each', '{production}', '{"type": "chair", "style": "ghost"}'),
  ('c0000001-0000-0000-0000-000000000039', 'Folding Chair (White)', 'folding-chair-w', 'Various', 'White Folding', 'each', '{production}', '{"type": "chair"}'),
  ('c0000001-0000-0000-0000-000000000039', 'Folding Chair (Black)', 'folding-chair-b', 'Various', 'Black Folding', 'each', '{production}', '{"type": "chair"}'),
  ('c0000001-0000-0000-0000-000000000040', 'Lounge Sofa (3-seat)', 'lounge-sofa-3', 'Various', '3-Seat Lounge', 'each', '{production}', '{"type": "lounge", "seats": 3}'),
  ('c0000001-0000-0000-0000-000000000040', 'Lounge Chair (accent)', 'lounge-chair', 'Various', 'Accent Chair', 'each', '{production}', '{"type": "lounge"}'),
  ('c0000001-0000-0000-0000-000000000040', 'Ottoman', 'ottoman', 'Various', 'Standard', 'each', '{production}', '{"type": "lounge"}'),
  ('c0000001-0000-0000-0000-000000000040', 'Lounge Coffee Table', 'lounge-coffee', 'Various', 'Standard', 'each', '{production}', '{"type": "table", "style": "lounge"}');

-- ─── Linens & Tableware (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000041', 'Tablecloth (120" Round, White)', 'tablecloth-120-w', 'Various', '120" Round White', 'each', '{production}', '{"type": "tablecloth"}'),
  ('c0000001-0000-0000-0000-000000000041', 'Tablecloth (120" Round, Black)', 'tablecloth-120-b', 'Various', '120" Round Black', 'each', '{production}', '{"type": "tablecloth"}'),
  ('c0000001-0000-0000-0000-000000000042', 'Napkin (Polyester, White)', 'napkin-poly-w', 'Various', 'White Polyester', 'each', '{production}', '{"type": "napkin"}'),
  ('c0000001-0000-0000-0000-000000000042', 'Napkin (Linen, Black)', 'napkin-linen-b', 'Various', 'Black Linen', 'each', '{production}', '{"type": "napkin"}'),
  ('c0000001-0000-0000-0000-000000000043', 'Wine Glass (Stemless)', 'wine-stemless', 'Various', 'Stemless 15oz', 'each', '{production}', '{"type": "glassware", "oz": 15}'),
  ('c0000001-0000-0000-0000-000000000043', 'Rocks Glass', 'rocks-glass', 'Various', 'Rocks 10oz', 'each', '{production}', '{"type": "glassware", "oz": 10}'),
  ('c0000001-0000-0000-0000-000000000043', 'Champagne Flute', 'champagne-flute', 'Various', 'Flute 6oz', 'each', '{production}', '{"type": "glassware", "oz": 6}'),
  ('c0000001-0000-0000-0000-000000000043', 'Water Glass', 'water-glass', 'Various', 'Tumbler 12oz', 'each', '{production}', '{"type": "glassware", "oz": 12}'),
  ('c0000001-0000-0000-0000-000000000044', 'Dinner Fork', 'dinner-fork', 'Various', 'Standard', 'each', '{production}', '{"type": "flatware"}'),
  ('c0000001-0000-0000-0000-000000000044', 'Dinner Knife', 'dinner-knife', 'Various', 'Standard', 'each', '{production}', '{"type": "flatware"}'),
  ('c0000001-0000-0000-0000-000000000044', 'Soup Spoon', 'soup-spoon', 'Various', 'Standard', 'each', '{production}', '{"type": "flatware"}'),
  ('c0000001-0000-0000-0000-000000000045', 'Dinner Plate 10.5"', 'dinner-plate', 'Various', '10.5" Round', 'each', '{production}', '{"type": "plate"}'),
  ('c0000001-0000-0000-0000-000000000045', 'Salad Plate 8"', 'salad-plate', 'Various', '8" Round', 'each', '{production}', '{"type": "plate"}'),
  ('c0000001-0000-0000-0000-000000000045', 'Charger Plate 13" (Gold)', 'charger-gold', 'Various', '13" Gold Charger', 'each', '{production}', '{"type": "charger"}');

-- ─── F&B Equipment (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000049', '6-Burner Range with Oven', 'range-6b', 'Various', '6-Burner + Oven', 'each', '{production}', '{"type": "cooking"}'),
  ('c0000001-0000-0000-0000-000000000049', 'Flat-Top Griddle 36"', 'griddle-36', 'Various', '36" Flat Top', 'each', '{production}', '{"type": "cooking"}'),
  ('c0000001-0000-0000-0000-000000000049', 'Convection Oven (Full)', 'conv-oven-full', 'Various', 'Full-Size Convection', 'each', '{production}', '{"type": "oven"}'),
  ('c0000001-0000-0000-0000-000000000049', 'Deep Fryer (50lb)', 'fryer-50', 'Various', '50lb Deep Fryer', 'each', '{production}', '{"type": "fryer"}'),
  ('c0000001-0000-0000-0000-000000000050', 'Prep Table (6ft, Stainless)', 'prep-table-6', 'Various', '6ft Stainless', 'each', '{production}', '{"type": "prep"}'),
  ('c0000001-0000-0000-0000-000000000050', 'Prep Table (8ft, Stainless)', 'prep-table-8', 'Various', '8ft Stainless', 'each', '{production}', '{"type": "prep"}'),
  ('c0000001-0000-0000-0000-000000000050', 'Food Processor (Commercial)', 'food-processor', 'Various', 'Commercial', 'each', '{production}', '{"type": "prep"}'),
  ('c0000001-0000-0000-0000-000000000052', 'Portable Bar 6ft', 'portable-bar-6', 'Various', '6ft Portable Bar', 'each', '{production}', '{"type": "bar"}'),
  ('c0000001-0000-0000-0000-000000000052', 'Portable Bar 8ft', 'portable-bar-8', 'Various', '8ft Portable Bar', 'each', '{production}', '{"type": "bar"}'),
  ('c0000001-0000-0000-0000-000000000053', '4-Tap Draft Tower', 'draft-4', 'Various', '4-Tap Tower', 'each', '{production}', '{"type": "draft"}'),
  ('c0000001-0000-0000-0000-000000000053', 'Jockey Box (4-tap)', 'jockey-box-4', 'Various', '4-Tap Jockey Box', 'each', '{production}', '{"type": "draft"}'),
  ('c0000001-0000-0000-0000-000000000055', 'Walk-in Cooler 8x10', 'walkin-8x10', 'Various', '8x10ft Walk-in', 'each', '{production}', '{"type": "walk_in", "sqft": 80}'),
  ('c0000001-0000-0000-0000-000000000055', 'Walk-in Cooler 10x12', 'walkin-10x12', 'Various', '10x12ft Walk-in', 'each', '{production}', '{"type": "walk_in", "sqft": 120}'),
  ('c0000001-0000-0000-0000-000000000056', 'Chest Freezer 15 cu ft', 'chest-15', 'Various', '15 cu ft', 'each', '{production}', '{"type": "freezer"}'),
  ('c0000001-0000-0000-0000-000000000057', 'Reach-in Cooler (2-door)', 'reach-in-2', 'Various', '2-Door Reach-in', 'each', '{production}', '{"type": "reach_in"}');

-- ─── Waste Management (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000077', 'Standard Portable Restroom', 'portable-std', 'Various', 'Standard', 'each', '{production}', '{"type": "restroom"}'),
  ('c0000001-0000-0000-0000-000000000077', 'Handicap Portable Restroom', 'portable-ada', 'Various', 'ADA', 'each', '{production}', '{"type": "restroom", "ada": true}'),
  ('c0000001-0000-0000-0000-000000000077', 'VIP Restroom Trailer (8-station)', 'vip-restroom-8', 'Various', '8-Station VIP', 'each', '{production}', '{"type": "restroom_trailer", "stations": 8}'),
  ('c0000001-0000-0000-0000-000000000078', 'Handwash Station (2-sink)', 'handwash-2', 'Various', '2-Sink', 'each', '{production}', '{"type": "handwash"}'),
  ('c0000001-0000-0000-0000-000000000078', 'Handwash Station (4-sink)', 'handwash-4', 'Various', '4-Sink', 'each', '{production}', '{"type": "handwash"}'),
  ('c0000001-0000-0000-0000-000000000075', '2-Yard Dumpster', 'dumpster-2yd', 'Various', '2 yard', 'each', '{production}', '{"type": "dumpster", "cubic_yards": 2}'),
  ('c0000001-0000-0000-0000-000000000075', '6-Yard Dumpster', 'dumpster-6yd', 'Various', '6 yard', 'each', '{production}', '{"type": "dumpster", "cubic_yards": 6}'),
  ('c0000001-0000-0000-0000-000000000075', '30-Yard Roll-Off', 'rolloff-30', 'Various', '30 yard Roll-Off', 'each', '{production}', '{"type": "roll_off", "cubic_yards": 30}');

-- ─── Weather Protection (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000079', 'Pop-Up Tent 10x10', 'popup-10x10', 'Various', '10x10ft', 'each', '{production}', '{"type": "popup_tent", "sqft": 100}'),
  ('c0000001-0000-0000-0000-000000000079', 'Pop-Up Tent 10x20', 'popup-10x20', 'Various', '10x20ft', 'each', '{production}', '{"type": "popup_tent", "sqft": 200}'),
  ('c0000001-0000-0000-0000-000000000080', 'Shade Sail 20x20', 'shade-20x20', 'Various', '20x20ft', 'each', '{production}', '{"type": "shade_sail", "sqft": 400}'),
  ('c0000001-0000-0000-0000-000000000081', 'Spot Cooler 5-ton', 'spot-cooler-5t', 'Various', '5-Ton', 'each', '{production}', '{"type": "hvac", "tons": 5}'),
  ('c0000001-0000-0000-0000-000000000081', 'Air Handler 10-ton', 'air-handler-10t', 'Various', '10-Ton', 'each', '{production}', '{"type": "hvac", "tons": 10}'),
  ('c0000001-0000-0000-0000-000000000082', 'Misting Fan 30"', 'mist-fan-30', 'Various', '30" Misting Fan', 'each', '{production}', '{"type": "fan"}'),
  ('c0000001-0000-0000-0000-000000000082', 'Industrial Fan 48"', 'industrial-fan-48', 'Various', '48" Industrial', 'each', '{production}', '{"type": "fan"}'),
  ('c0000001-0000-0000-0000-000000000083', 'Propane Patio Heater', 'patio-heater', 'Various', 'Mushroom Style', 'each', '{production}', '{"type": "heater", "fuel": "propane"}'),
  ('c0000001-0000-0000-0000-000000000083', 'Radiant Heater (Electric)', 'radiant-heater', 'Various', 'Electric Radiant', 'each', '{production}', '{"type": "heater", "fuel": "electric"}');

-- ─── Transportation (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000065', 'Golf Cart (2-seat)', 'golf-cart-2', 'Club Car', '2-Seat', 'each', '{production}', '{"type": "golf_cart", "seats": 2}'),
  ('c0000001-0000-0000-0000-000000000065', 'Golf Cart (4-seat)', 'golf-cart-4', 'Club Car', '4-Seat', 'each', '{production}', '{"type": "golf_cart", "seats": 4}'),
  ('c0000001-0000-0000-0000-000000000065', 'Golf Cart (6-seat)', 'golf-cart-6', 'Club Car', '6-Seat', 'each', '{production}', '{"type": "golf_cart", "seats": 6}'),
  ('c0000001-0000-0000-0000-000000000065', 'Utility Cart (Flatbed)', 'util-cart', 'Club Car', 'Flatbed', 'each', '{production}', '{"type": "utility_cart"}'),
  ('c0000001-0000-0000-0000-000000000066', 'Forklift 6000lb', 'forklift-6k', 'Various', '6000lb', 'each', '{production}', '{"type": "forklift", "capacity_lbs": 6000}'),
  ('c0000001-0000-0000-0000-000000000066', 'Forklift 10000lb', 'forklift-10k', 'Various', '10000lb', 'each', '{production}', '{"type": "forklift", "capacity_lbs": 10000}'),
  ('c0000001-0000-0000-0000-000000000067', 'Boom Lift 45ft (Articulating)', 'boom-45', 'JLG', '45ft Articulating', 'each', '{production}', '{"type": "boom_lift", "height_ft": 45}'),
  ('c0000001-0000-0000-0000-000000000067', 'Scissor Lift 26ft', 'scissor-26', 'JLG', '26ft', 'each', '{production}', '{"type": "scissor_lift", "height_ft": 26}'),
  ('c0000001-0000-0000-0000-000000000068', '26ft Box Truck', 'box-truck-26', 'Various', '26ft Box', 'each', '{production}', '{"type": "truck"}'),
  ('c0000001-0000-0000-0000-000000000068', '16ft Flatbed', 'flatbed-16', 'Various', '16ft Flatbed', 'each', '{production}', '{"type": "truck"}'),
  ('c0000001-0000-0000-0000-000000000068', 'Passenger Van (15-seat)', 'pass-van-15', 'Various', '15-Seat Van', 'each', '{production}', '{"type": "van", "seats": 15}');

-- ─── Workplace (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000058', 'Folding Work Table 6ft', 'work-table-6', 'Various', '6ft Folding', 'each', '{production}', '{"type": "desk"}'),
  ('c0000001-0000-0000-0000-000000000058', 'Office Chair (Ergonomic)', 'office-chair', 'Various', 'Ergonomic', 'each', '{production}', '{"type": "chair"}'),
  ('c0000001-0000-0000-0000-000000000060', 'Multifunction Printer', 'printer-mfp', 'Various', 'Laser MFP', 'each', '{production}', '{"type": "printer"}'),
  ('c0000001-0000-0000-0000-000000000060', 'Wi-Fi Access Point', 'wifi-ap', 'Various', 'Enterprise AP', 'each', '{production}', '{"type": "networking"}'),
  ('c0000001-0000-0000-0000-000000000060', 'Network Switch (24-port)', 'switch-24', 'Various', '24-Port Managed', 'each', '{production}', '{"type": "networking"}'),
  ('c0000001-0000-0000-0000-000000000063', '20ft Shipping Container', 'container-20', 'Various', '20ft Standard', 'each', '{production}', '{"type": "container"}'),
  ('c0000001-0000-0000-0000-000000000063', '40ft Shipping Container', 'container-40', 'Various', '40ft Standard', 'each', '{production}', '{"type": "container"}');

-- ─── Labor (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000069', 'Certified Rigger (per day)', 'rigger-day', 'Labor', 'Certified Rigger', 'person_day', '{production}', '{"type": "skilled_labor", "certification": "ETCP"}'),
  ('c0000001-0000-0000-0000-000000000070', 'Licensed Electrician (per day)', 'electrician-day', 'Labor', 'Licensed Electrician', 'person_day', '{production}', '{"type": "skilled_labor"}'),
  ('c0000001-0000-0000-0000-000000000071', 'Carpenter (per day)', 'carpenter-day', 'Labor', 'Carpenter', 'person_day', '{production}', '{"type": "skilled_labor"}'),
  ('c0000001-0000-0000-0000-000000000072', 'Stagehand (per call)', 'stagehand-call', 'Labor', 'Stagehand', 'person_call', '{production}', '{"type": "general_labor"}'),
  ('c0000001-0000-0000-0000-000000000073', 'Loader (per call)', 'loader-call', 'Labor', 'Loader', 'person_call', '{production}', '{"type": "general_labor"}'),
  ('c0000001-0000-0000-0000-000000000074', 'Runner (per day)', 'runner-day', 'Labor', 'Runner', 'person_day', '{production}', '{"type": "general_labor"}');

-- ─── Monitor Systems & Accessories (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000015', 'L-Acoustics X15 HiQ (wedge)', 'x15-hiq', 'L-Acoustics', 'X15 HiQ', 'each', '{production}', '{"type": "stage_monitor"}'),
  ('c0000001-0000-0000-0000-000000000015', 'd&b audiotechnik M4 (wedge)', 'db-m4', 'd&b audiotechnik', 'M4', 'each', '{production}', '{"type": "stage_monitor"}'),
  ('c0000001-0000-0000-0000-000000000015', 'IEM System (Shure PSM1000)', 'psm1000', 'Shure', 'PSM1000', 'each', '{talent_facing,production}', '{"type": "in_ear_monitor"}'),
  ('c0000001-0000-0000-0000-000000000015', 'Sennheiser IEM G4', 'senn-iem-g4', 'Sennheiser', 'IEM G4', 'each', '{talent_facing,production}', '{"type": "in_ear_monitor"}');

-- ─── Flooring (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000008', 'Stage Deck 4x8 (Standard)', 'stage-deck-4x8', 'Various', '4x8ft Standard', 'each', '{production}', '{"type": "deck"}'),
  ('c0000001-0000-0000-0000-000000000008', 'Stage Deck 4x4', 'stage-deck-4x4', 'Various', '4x4ft', 'each', '{production}', '{"type": "deck"}'),
  ('c0000001-0000-0000-0000-000000000009', 'Plywood Ground Cover (4x8 sheet)', 'plywood-4x8', 'Various', '4x8ft 3/4" plywood', 'sheet', '{production}', '{"type": "ground_protection"}'),
  ('c0000001-0000-0000-0000-000000000009', 'Turf Protection (per sqft)', 'turf-protection', 'Various', 'Turf Mat', 'sqft', '{production}', '{"type": "ground_protection"}'),
  ('c0000001-0000-0000-0000-000000000010', 'Portable Dance Floor (per sqft)', 'dance-floor', 'Various', 'Snap-together', 'sqft', '{production}', '{"type": "dance_floor"}');

-- ─── Site Lighting (production) ───
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000025', 'Site Light Tower (4-head)', 'light-tower-4', 'Various', '4-Head Tower', 'each', '{production}', '{"type": "site_lighting"}'),
  ('c0000001-0000-0000-0000-000000000025', 'String Lights (per 100ft)', 'string-lights', 'Various', '100ft String', 'each', '{production}', '{"type": "decorative_lighting"}'),
  ('c0000001-0000-0000-0000-000000000025', 'Path Lighting (per fixture)', 'path-light', 'Various', 'LED Path', 'each', '{production}', '{"type": "pathway_lighting"}'),
  ('c0000001-0000-0000-0000-000000000025', 'Uplighting (Battery LED)', 'uplight-battery', 'Various', 'Battery LED RGBW', 'each', '{production}', '{"type": "uplighting"}');

-- ═══ Sample Component Items (DJ Booth → Catalog) ════

-- CDJ-3000 × 4
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-d000b0070001',
   (select id from advance_items where slug = 'cdj-3000' limit 1),
   4, 250.00,
   'Standard 4-deck rider for Satiiiva',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- DJM-V10 × 1
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-d000b0070001',
   (select id from advance_items where slug = 'djm-v10' limit 1),
   1, 350.00,
   'Primary mixer',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- RMX-1000 × 1
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-d000b0070001',
   (select id from advance_items where slug = 'rmx-1000' limit 1),
   1, 150.00,
   'Remix station per rider',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- DJ Table (4-player) × 1
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-d000b0070001',
   (select id from advance_items where slug = 'dj-table-4' limit 1),
   1, 200.00,
   '4-player table for 4-deck setup',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- DJ Monitor (15-inch wedge) × 2
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-d000b0070001',
   (select id from advance_items where slug = 'dj-monitor-15' limit 1),
   2, 100.00,
   'DJ booth monitors',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- ═══ Sample Component Items (Main PA) ══════════════

-- L-Acoustics K2 × 12
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-a100a0000001',
   (select id from advance_items where slug = 'k2' limit 1),
   12, 500.00,
   'Main hangs: 12x K2 per side',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- KS28 subs × 8
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-a100a0000001',
   (select id from advance_items where slug = 'ks28' limit 1),
   8, 400.00,
   'Sub array: 8x KS28 ground-stacked',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- DiGiCo SD7 FOH × 1
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-a100a0000001',
   (select id from advance_items where slug = 'sd7' limit 1),
   1, 2500.00,
   'FOH console',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- ═══ Sample Component Items (Lighting Rig) ═════════

-- grandMA3 × 1
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-119074190001',
   (select id from advance_items where slug = 'grandma3' limit 1),
   1, 3000.00,
   'Primary lighting console',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- Robe MegaPointe × 16
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-119074190001',
   (select id from advance_items where slug = 'megapointe' limit 1),
   16, 175.00,
   'Primary aerial fixtures',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- GLP JDC1 × 8
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-119074190001',
   (select id from advance_items where slug = 'jdc1' limit 1),
   8, 200.00,
   'Strobe/wash fixtures',
   'advancing')
on conflict (component_id, item_id) do nothing;

-- MDG theONE hazer × 2
insert into component_items (component_id, item_id, quantity, unit_cost, notes, status) values
  ('50000001-0000-0000-0000-119074190001',
   (select id from advance_items where slug = 'mdg-theone' limit 1),
   2, 250.00,
   'Main stage hazers',
   'advancing')
on conflict (component_id, item_id) do nothing;

