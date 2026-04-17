set search_path = atlvs, public;

-- Countries
insert into countries (iso_alpha_2, iso_alpha_3, name, calling_code, default_currency) values
  ('US','USA','United States','+1','USD');

-- States
insert into region_level_1 (country_id, code, name)
  select id, 'FL', 'Florida' from countries where iso_alpha_2 = 'US';

-- Counties
insert into region_level_2 (country_id, region_level_1_id, name)
  select c.id, r.id, 'Miami-Dade County'
  from countries c join region_level_1 r on r.country_id = c.id
  where c.iso_alpha_2='US' and r.code='FL';

-- Localities
insert into localities (country_id, region_level_1_id, region_level_2_id, name, timezone)
select c.id, r1.id, r2.id, v.name, 'America/New_York'
from countries c
join region_level_1 r1 on r1.country_id=c.id and r1.code='FL'
join region_level_2 r2 on r2.region_level_1_id=r1.id and r2.name='Miami-Dade County'
cross join (values
  ('Miami'),('Miami Beach'),('Coral Gables'),('Doral'),
  ('Hialeah'),('Hialeah Gardens'),('Key Biscayne')) as v(name)
where c.iso_alpha_2='US';

-- Districts (15 pilot neighborhoods)
insert into districts (locality_id, name, slug, description)
select l.id, d.name, d.slug, d.description
from localities l
join (values
  ('Miami','Wynwood','wynwood','Arts/warehouse district, street-art epicenter'),
  ('Miami','Design District','design-district','Luxury retail + contemporary galleries'),
  ('Miami','Brickell','brickell','High-rise financial/rooftop corridor'),
  ('Miami','Downtown Miami','downtown-miami','Arts, arena, theater, historic core'),
  ('Miami','Edgewater','edgewater','Biscayne Bay waterfront, luxury high-rises'),
  ('Miami','Midtown','midtown','Between Wynwood and Design District'),
  ('Miami','Little Haiti','little-haiti','Creole cultural hub, emerging arts scene'),
  ('Miami','Little River','little-river','MiMo warehouses, new restaurants/galleries'),
  ('Miami Beach','South Beach','south-beach','Art Deco, nightclubs, luxury hotels'),
  ('Miami Beach','Mid Beach','mid-beach','Fontainebleau, Faena, luxury oceanfront'),
  ('Miami Beach','North Beach','north-beach','Bandshell, quieter oceanfront'),
  ('Miami','Coconut Grove','coconut-grove','Bayfront historic + sailing culture'),
  ('Coral Gables','Coral Gables','coral-gables','Mediterranean luxury, country clubs'),
  ('Doral','Doral','doral','Corporate hub, Trump National, Airport West'),
  ('Hialeah','Hialeah','hialeah','Banquet halls, Hialeah Park, Cuban culture'),
  ('Miami','Freedom Park District','freedom-park','New Inter Miami/Nu Stadium district (2026)'),
  ('Miami','Virginia Key','virginia-key','Rickenbacker Causeway island')
) as d(locality_name, name, slug, description)
  on l.name = d.locality_name;

-- Venue types
insert into venue_types (code, display_name) values
  ('nightclub','Nightclub'),('lounge','Lounge'),('bar','Bar'),
  ('event_venue','Event Venue'),('rooftop','Rooftop'),('gallery','Gallery'),
  ('warehouse','Warehouse'),('hotel_ballroom','Hotel Ballroom'),
  ('restaurant_private_dining','Restaurant w/ Private Dining'),
  ('restaurant','Restaurant'),('outdoor_space','Outdoor Space'),('park','Park'),
  ('unconventional_space','Unconventional Space'),('theater','Theater'),
  ('studio','Studio'),('museum','Museum'),('yacht','Yacht'),
  ('beach_club','Beach Club'),('stadium','Stadium'),('sports_venue','Sports Venue'),
  ('banquet_hall','Banquet Hall'),('country_club','Country Club'),
  ('historic_estate','Historic Estate'),('food_hall','Food Hall'),('arena','Arena');

-- Features (universal catalog)
insert into features (slug, display_name, category) values
  ('rooftop','Rooftop','amenity'),('waterfront','Waterfront','amenity'),
  ('outdoor_space','Outdoor Space','amenity'),('led_walls','LED Walls','production'),
  ('stage','Stage','production'),('green_room','Green Room','production'),
  ('loading_dock','Loading Dock','production'),('parking','Parking','access'),
  ('valet','Valet','access'),('full_bar','Full Bar','amenity'),
  ('kitchen','Kitchen','amenity'),('av_included','AV Included','production'),
  ('byo_allowed','BYO Allowed','policy'),('pet_friendly','Pet Friendly','policy'),
  ('handicap_accessible','ADA Accessible','access'),('historic','Historic','vibe'),
  ('industrial','Industrial','vibe'),('modern','Modern','vibe'),
  ('luxury','Luxury','vibe'),('art_installations','Art Installations','vibe'),
  ('vip_areas','VIP Areas','amenity'),('dance_floor','Dance Floor','amenity'),
  ('private_rooms','Private Rooms','amenity'),('multiple_floors','Multiple Floors','amenity'),
  ('exclusive_buyout','Exclusive Buyout','policy'),('beach_access','Beach Access','amenity'),
  ('pool','Pool','amenity'),('marina','Marina','amenity'),('gardens','Gardens','amenity'),
  ('projection_mapping','Projection Mapping','production'),
  ('live_music','Live Music Programming','amenity');
