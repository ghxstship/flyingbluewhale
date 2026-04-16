-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 011: Seed Project -- iii Joints 2026
-- Source: Talent Advance PDF + Set Times PDF
-- Flag: date in PDF says 2025, seeded as 2026 per prompt
-- ═══════════════════════════════════════════════════════

-- Seed organization (required for project FK)
insert into organizations (id, name, slug, settings)
values (
  'e0000001-0000-0000-0000-0b9a00000001'::uuid,
  'GHXSTSHIP',
  'ghxstship',
  '{"tier": "pro", "features": ["talent_advance", "production_advance", "catering", "notifications", "cms"]}'::jsonb
) on conflict (slug) do nothing;

-- iii Joints 2026 project
insert into projects (id, organization_id, name, slug, type, status, start_date, end_date, venue, features, settings)
select
  'a0000001-0000-0000-0000-111101005000'::uuid,
  o.id,
  'iii Joints 2026',
  'iii-joints-2026',
  'talent_advance',
  'active',
  '2026-04-18',
  '2026-04-19',
  '{
    "name": "Factory Town",
    "address": "4800 NW 37th Ave",
    "city": "Miami",
    "state": "FL",
    "zip": "33142",
    "capacity": 5000,
    "indoor_outdoor": "both",
    "parking": "No on-site parking. Rideshare recommended.",
    "dos_contacts": [
      {"name": "Manuel Portocarrero", "phone": "+1 (689) 217-5066"},
      {"name": "Pablo Ycaza", "phone": "+1 (305) 748-0921"}
    ]
  }'::jsonb,
  '{talent_advance,catering,notifications}',
  '{
    "guest_list_ga_cap": 10,
    "guest_list_vip_cap": 1,
    "guest_list_deadline": "2026-04-17T17:00:00-04:00",
    "credential_pickup": "Artist Check-in, Building 1 artist entrance",
    "payment_method": "check_on_site",
    "payment_requirement": "W-9 required",
    "hours": "04:00 PM - 05:00 AM",
    "date_flag": "NEEDS_2026_CONFIRMATION"
  }'::jsonb
from organizations o
limit 1;

-- ═══ STAGES (6) ═══

insert into spaces (id, project_id, name, type, capacity, backline) values
  ('b0000001-0000-0000-0000-5a7111a00001', 'a0000001-0000-0000-0000-111101005000', 'Satiiiva (The Park)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}, "extras": [{"model": "RMX-1000", "quantity": 1}]}'),
  ('b0000001-0000-0000-0000-573a10200001', 'a0000001-0000-0000-0000-111101005000', 'Strain Room (Chain Room)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}'),
  ('b0000001-0000-0000-0000-50a7e50ace01', 'a0000001-0000-0000-0000-111101005000', 'Skate Space (Warehouse)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-A9", "quantity": 1}, "extras": [{"model": "Turntable", "quantity": 2}]}'),
  ('b0000001-0000-0000-0000-005b9a4de051', 'a0000001-0000-0000-0000-111101005000', 'Kush Gardens (Cypress End)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}'),
  ('b0000001-0000-0000-0000-d1e5e1de0001', 'a0000001-0000-0000-0000-111101005000', 'Diesel Den (Engine Room)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-V10", "quantity": 1}}'),
  ('b0000001-0000-0000-0000-4eefe47bea71', 'a0000001-0000-0000-0000-111101005000', 'Reefer Theater (Infinity Room)', 'stage', null,
    '{"cdj": {"model": "CDJ-3000", "quantity": 4}, "mixer": {"model": "DJM-A9", "quantity": 1}, "notes": "Hybrid stage: DJ + live bands + game shows + film"}');

-- ═══ ACTS ═══
-- Satiiiva
insert into acts (project_id, space_id, name, artist_name, set_time_start, set_time_end, status, metadata) values
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Godblessjai B2B Lo-G', 'Godblessjai B2B Lo-G', '2026-04-18T17:00:00-04:00', '2026-04-18T18:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Danyelino B2B Alezsandro', 'Danyelino B2B Alezsandro', '2026-04-18T18:30:00-04:00', '2026-04-18T20:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Ale Acosta B2B Coffintexts', 'Ale Acosta B2B Coffintexts', '2026-04-18T20:00:00-04:00', '2026-04-18T21:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Bakke B2B Mai Iachetti', 'Bakke B2B Mai Iachetti', '2026-04-18T21:30:00-04:00', '2026-04-18T23:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Sinopoli B2B Will Buck', 'Sinopoli B2B Will Buck', '2026-04-18T23:00:00-04:00', '2026-04-19T00:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Maccabiii B2B Richie Hell', 'Maccabiii B2B Richie Hell', '2026-04-19T00:30:00-04:00', '2026-04-19T02:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Differ B2B Lucaz', 'Differ B2B Lucaz', '2026-04-19T02:00:00-04:00', '2026-04-19T03:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-5a7111a00001', 'Slugg B2B Lousy Lover', 'Slugg B2B Lousy Lover', '2026-04-19T03:30:00-04:00', '2026-04-19T05:00:00-04:00', 'confirmed', '{"b2b": true}');

-- Strain Room
insert into acts (project_id, space_id, name, artist_name, set_time_start, set_time_end, status, metadata) values
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Yake', 'Yake', '2026-04-18T16:00:00-04:00', '2026-04-18T17:00:00-04:00', 'confirmed', '{}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'DB Cooper B2B Shinobi', 'DB Cooper B2B Shinobi', '2026-04-18T17:00:00-04:00', '2026-04-18T18:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Marte B2B Gru5ome', 'Marte B2B Gru5ome', '2026-04-18T18:30:00-04:00', '2026-04-18T20:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Viva Vidal B2B Violeta', 'Viva Vidal B2B Violeta', '2026-04-18T20:00:00-04:00', '2026-04-18T21:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Godisound B2B Alexx in Chainss', 'Godisound B2B Alexx in Chainss', '2026-04-18T21:30:00-04:00', '2026-04-18T23:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Souls Departed B2B Sel.6', 'Souls Departed B2B Sel.6', '2026-04-18T23:00:00-04:00', '2026-04-19T00:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Sister System B2B Robyn Sin Love', 'Sister System B2B Robyn Sin Love', '2026-04-19T00:30:00-04:00', '2026-04-19T02:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Ultrathem B2B Mila Gama', 'Ultrathem B2B Mila Gama', '2026-04-19T02:00:00-04:00', '2026-04-19T03:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-573a10200001', 'Eco-sistema B2B Julia Saturno', 'Eco-sistema B2B Julia Saturno', '2026-04-19T03:30:00-04:00', '2026-04-19T05:00:00-04:00', 'confirmed', '{"b2b": true}');

-- Kush Gardens
insert into acts (project_id, space_id, name, artist_name, set_time_start, set_time_end, status, metadata) values
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Fear of Corners B2B Orta Una', 'Fear of Corners B2B Orta Una', '2026-04-18T16:00:00-04:00', '2026-04-18T17:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Serafitz B2B duun', 'Serafitz B2B duun', '2026-04-18T17:30:00-04:00', '2026-04-18T19:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Fayt (Ambient Piano)', 'Fayt', '2026-04-18T19:00:00-04:00', '2026-04-18T19:30:00-04:00', 'confirmed', '{"type": "ambient_piano"}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Gio Elia B2B Bort', 'Gio Elia B2B Bort', '2026-04-18T19:30:00-04:00', '2026-04-18T21:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'True Vine B2B R/V Calypso', 'True Vine B2B R/V Calypso', '2026-04-18T21:00:00-04:00', '2026-04-18T22:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Feph B2B Mr. Tron', 'Feph B2B Mr. Tron', '2026-04-18T22:30:00-04:00', '2026-04-18T23:45:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Marie Qrie B2B Xilla', 'Marie Qrie B2B Xilla', '2026-04-18T23:45:00-04:00', '2026-04-19T01:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Nicholas G. Padilla', 'Nicholas G. Padilla', '2026-04-19T01:00:00-04:00', '2026-04-19T02:00:00-04:00', 'confirmed', '{}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Egyptian Helicopter B2B Girlcop', 'Egyptian Helicopter B2B Girlcop', '2026-04-19T02:00:00-04:00', '2026-04-19T03:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-005b9a4de051', 'Jinks B2B Romulo del Castillo', 'Jinks B2B Romulo del Castillo', '2026-04-19T03:30:00-04:00', '2026-04-19T05:00:00-04:00', 'confirmed', '{"b2b": true}');

-- Diesel Den
insert into acts (project_id, space_id, name, artist_name, set_time_start, set_time_end, status, metadata) values
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Lizzie_mcguire', 'Lizzie_mcguire', '2026-04-18T16:00:00-04:00', '2026-04-18T17:00:00-04:00', 'confirmed', '{}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Kujo B2B Proletar', 'Kujo B2B Proletar', '2026-04-18T17:00:00-04:00', '2026-04-18T18:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Mr. Bitch B2B Spell', 'Mr. Bitch B2B Spell', '2026-04-18T18:30:00-04:00', '2026-04-18T19:45:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'SUZ B2B SATURNSARii', 'SUZ B2B SATURNSARii', '2026-04-18T19:45:00-04:00', '2026-04-18T21:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'BERRAKKA B2B V1fro', 'BERRAKKA B2B V1fro', '2026-04-18T21:00:00-04:00', '2026-04-18T22:15:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Crespi Drum Syndicate', 'Crespi Drum Syndicate', '2026-04-18T22:15:00-04:00', '2026-04-18T23:45:00-04:00', 'confirmed', '{"type": "live"}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Pressure Point B2B Lady Narcisse', 'Pressure Point B2B Lady Narcisse', '2026-04-18T23:45:00-04:00', '2026-04-19T01:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Suzi Analogue B2B Natalie Foucauld', 'Suzi Analogue B2B Natalie Foucauld', '2026-04-19T01:00:00-04:00', '2026-04-19T02:15:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Rude Boy B2B 1-800-Lolita', 'Rude Boy B2B 1-800-Lolita', '2026-04-19T02:15:00-04:00', '2026-04-19T03:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-d1e5e1de0001', 'Xana B2B RARA', 'Xana B2B RARA', '2026-04-19T03:30:00-04:00', '2026-04-19T05:00:00-04:00', 'confirmed', '{"b2b": true}');

-- Skate Space
insert into acts (project_id, space_id, name, artist_name, set_time_start, set_time_end, status, metadata) values
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Los (420 Yoga)', 'Los', '2026-04-18T16:00:00-04:00', '2026-04-18T17:15:00-04:00', 'confirmed', '{"type": "yoga"}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Inbal B2B Brad Strickland', 'Inbal B2B Brad Strickland', '2026-04-18T17:15:00-04:00', '2026-04-18T18:45:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Aramis Lorie B2B Artime', 'Aramis Lorie B2B Artime', '2026-04-18T18:45:00-04:00', '2026-04-18T20:15:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Mr. Brown', 'Mr. Brown', '2026-04-18T20:15:00-04:00', '2026-04-18T21:30:00-04:00', 'confirmed', '{}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Terence Tabeau B2B Hiltronix', 'Terence Tabeau B2B Hiltronix', '2026-04-18T21:30:00-04:00', '2026-04-18T23:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'DJ Ray B2B Extra Andrew', 'DJ Ray B2B Extra Andrew', '2026-04-18T23:00:00-04:00', '2026-04-19T00:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Jovigibs B2B Nikita Green', 'Jovigibs B2B Nikita Green', '2026-04-19T00:30:00-04:00', '2026-04-19T02:00:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Vsyana B2B Lotusoph', 'Vsyana B2B Lotusoph', '2026-04-19T02:00:00-04:00', '2026-04-19T03:30:00-04:00', 'confirmed', '{"b2b": true}'),
  ('a0000001-0000-0000-0000-111101005000', 'b0000001-0000-0000-0000-50a7e50ace01', 'Roll-E B2B Chaos!', 'Roll-E B2B Chaos!', '2026-04-19T03:30:00-04:00', '2026-04-19T05:00:00-04:00', 'confirmed', '{"b2b": true}');
