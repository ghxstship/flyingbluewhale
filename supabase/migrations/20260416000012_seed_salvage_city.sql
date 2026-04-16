-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 012: Seed Project -- Salvage City at EDC LV
-- Source: Web research + prompt specifications
-- ═══════════════════════════════════════════════════════

-- Salvage City project
insert into projects (id, organization_id, name, slug, type, status, start_date, end_date, venue, features, settings)
select
  'a0000002-0000-0000-0000-5a1a9ec17200'::uuid,
  o.id,
  'Salvage City at EDC Las Vegas 2026',
  'salvage-city-edc-lv-2026',
  'hybrid',
  'active',
  '2026-05-15',
  '2026-05-17',
  '{
    "name": "Las Vegas Motor Speedway",
    "address": "7000 Las Vegas Blvd N",
    "city": "Las Vegas",
    "state": "NV",
    "zip": "89115",
    "capacity": 170000,
    "indoor_outdoor": "outdoor",
    "area": "Nomads Land",
    "parent_event": "Electric Daisy Carnival Las Vegas 2026",
    "parent_event_dates": "May 15-17, 2026"
  }'::jsonb,
  '{production_advance,sponsor,catering,notifications}',
  '{
    "concept": "Post-apocalyptic immersive dining experience",
    "format": "60-minute experience, 80 guests per seating, family-style tables of 20",
    "menu": "5-course curated menu (classic + vegetarian)",
    "dining_style": "family_style",
    "price_per_person": 189,
    "gratuity_included": true,
    "gratuity_percent": 18,
    "requirements": ["EDC festival wristband mandatory"],
    "dietary_accommodations": true,
    "check_in_advance_minutes": 15,
    "contact_email": "hello@salvagecitysupperclub.com"
  }'::jsonb
from organizations o
limit 1;

-- ═══ SPACES ═══

insert into spaces (id, project_id, name, type, capacity, backline, settings) values
  ('b0000002-0000-0000-0000-d1010970e001', 'a0000002-0000-0000-0000-5a1a9ec17200', 'Main Dining Tent', 'dining', 80,
    null,
    '{"tables": 4, "seats_per_table": 20, "layout": "family_style", "decor_theme": "post_apocalyptic"}'),
  ('b0000002-0000-0000-0000-0170be000001', 'a0000002-0000-0000-0000-5a1a9ec17200', 'Production Kitchen', 'kitchen', null,
    null,
    '{"type": "full_service", "courses": 5, "services_per_night": 3}'),
  ('b0000002-0000-0000-0000-0e4f04be4501', 'a0000002-0000-0000-0000-5a1a9ec17200', 'Performance Area', 'performance', null,
    null,
    '{"type": "immersive", "acts": ["circus", "aerial", "theatrical"], "integrated_with_dining": true}'),
  ('b0000002-0000-0000-0000-ba4000000001', 'a0000002-0000-0000-0000-5a1a9ec17200', 'Bar & Cocktail Station', 'bar', null,
    null,
    '{"type": "full_bar", "free_flowing": true, "cocktails": true, "wine": true, "soft_drinks": true}'),
  ('b0000002-0000-0000-0000-bac05790e001', 'a0000002-0000-0000-0000-5a1a9ec17200', 'Backstage / Green Room', 'backstage', null,
    null,
    '{"type": "crew_area"}');

-- ═══ PRODUCTION NOTES (as acts/performances) ═══

insert into acts (project_id, space_id, name, artist_name, status, metadata) values
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'b0000002-0000-0000-0000-0e4f04be4501', 'Immersive Theatrical Performance', 'Salvage City Cast', 'confirmed',
    '{"type": "theatrical", "description": "Post-apocalyptic narrative performers embodying the theme through mesmerizing artistry"}'),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'b0000002-0000-0000-0000-0e4f04be4501', 'Aerial / Circus Acts', 'Salvage City Aerialists', 'confirmed',
    '{"type": "circus", "description": "High-flying acts integrated into the dining experience"}'),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'b0000002-0000-0000-0000-0170be000001', 'Guest Chef Menu (Night 1)', 'TBD Guest Chef', 'confirmed',
    '{"type": "culinary", "courses": 5, "options": ["classic", "vegetarian"]}'),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'b0000002-0000-0000-0000-0170be000001', 'Guest Chef Menu (Night 2)', 'TBD Guest Chef', 'confirmed',
    '{"type": "culinary", "courses": 5, "options": ["classic", "vegetarian"]}'),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'b0000002-0000-0000-0000-0170be000001', 'Guest Chef Menu (Night 3)', 'TBD Guest Chef', 'confirmed',
    '{"type": "culinary", "courses": 5, "options": ["classic", "vegetarian"]}');

-- ═══ CATERING MEAL PLANS ═══

insert into catering_meal_plans (project_id, meal_name, date, time, location, capacity, dietary_options, cost_per_person) values
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 1 Early', '2026-05-15', '19:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 1 Late', '2026-05-15', '21:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 2 Early', '2026-05-16', '19:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 2 Late', '2026-05-16', '21:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 3 Early', '2026-05-17', '19:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00),
  ('a0000002-0000-0000-0000-5a1a9ec17200', 'Salvage City Dinner - Night 3 Late', '2026-05-17', '21:00', 'Main Dining Tent, Nomads Land', 80,
    '{"vegan": true, "vegetarian": true, "gluten_free": true, "halal": false, "kosher": false, "allergen_free": true}', 189.00);
