set search_path = atlvs, public;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='warehouse';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'rc-cola-plant-mana-wynwood',
    'RC Cola Plant (Mana Wynwood)',
    v_vt, '550 NW 24th St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    12000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@manawynwood.com', '+13055730371', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','loading_dock','parking','industrial','stage','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'mana-wynwood-convention-center',
    'Mana Wynwood Convention Center',
    v_vt, '2217 NW 5th Ave', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    6000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@manawynwood.com', '+13055730371', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('loading_dock','parking','av_included','industrial','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-oasis-wynwood',
    'The Oasis Wynwood',
    v_vt, '2335 N Miami Ave', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','full_bar','live_music','vip_areas');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'wynwood-marketplace',
    'Wynwood Marketplace',
    v_vt, '2250 NW 2nd Ave', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@wynwood-marketplace.com', null, true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','full_bar','live_music','dance_floor');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='food_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    '1-800-lucky',
    '1-800-Lucky',
    v_vt, '143 NW 23rd St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13057689826', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','kitchen','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'bakehouse-art-complex',
    'Bakehouse Art Complex',
    v_vt, '561 NW 32nd St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'kortega@bacfl.org', null, true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','art_installations','outdoor_space','industrial');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'superblue-miami',
    'Superblue Miami',
    v_vt, '1101 NW 23rd St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    450, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13233275449', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('art_installations','av_included','modern','handicap_accessible','projection_mapping');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'wynwood-walls',
    'Wynwood Walls',
    v_vt, '2520 NW 2nd Ave', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    900, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@thewynwoodwalls.com', null, true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','art_installations','historic','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'doya',
    'Doya',
    v_vt, '347 NW 24th St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    180, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@doyarestaurant.com', '+13055012848', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','kitchen','modern','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='wynwood';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'mayami-wynwood',
    'Mayami Wynwood',
    v_vt, '127 NW 23rd St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17866601341', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','dance_floor','live_music','vip_areas');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='museum';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'ica-miami',
    'ICA Miami',
    v_vt, '61 NE 41st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'hello@icamiami.org', '+13059015272', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('art_installations','gardens','modern','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-moore-moore-building',
    'The Moore (Moore Building)',
    v_vt, '4040 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@mooremiami.com', '+13052092100', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','art_installations','multiple_floors','kitchen','vip_areas','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'palm-court-event-space',
    'Palm Court Event Space',
    v_vt, '140 NE 39th St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@miamidesigndistrict.net', '+13057227100', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('loading_dock','av_included','kitchen','modern','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'paradise-plaza-event-space',
    'Paradise Plaza Event Space',
    v_vt, '151 NE 41st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@miamidesigndistrict.net', '+13057227100', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('loading_dock','kitchen','outdoor_space','modern');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'jungle-plaza',
    'Jungle Plaza',
    v_vt, '3801 NE 1st Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@miamidesigndistrict.net', '+13057227100', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','art_installations','stage','parking');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sweet-bird-north',
    'Sweet Bird North',
    v_vt, '95 NE 40th St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@miamidesigndistrict.net', '+13057227100', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','art_installations','parking');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'swan-bar-bevy',
    'Swan & Bar Bevy',
    v_vt, '90 NE 39th St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13057040994', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','outdoor_space','full_bar','luxury','vip_areas','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'le-jardinier-miami',
    'Le Jardinier Miami',
    v_vt, '151 NE 41st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    50, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'george.serban@latelier-miami.com', '+13054029060', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','luxury','modern','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'l-atelier-de-jo-l-robuchon-miami',
    'L''Atelier de Joël Robuchon Miami',
    v_vt, '151 NE 41st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    60, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@thebastioncollection.com', '+13054029070', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','modern','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='design-district';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'matsuyoi',
    'Matsuyoi',
    v_vt, '156 NE 41st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    75, 'small', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','modern','private_rooms','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'komodo',
    'Komodo',
    v_vt, '801 Brickell Ave', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@komodomiami.com', '+13055342211', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('multiple_floors','full_bar','luxury','vip_areas','dance_floor');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='rooftop';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sugar-rooftop-at-east-miami',
    'Sugar Rooftop at EAST Miami',
    v_vt, '788 Brickell Plaza Fl 40', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17868054655', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','outdoor_space','luxury','vip_areas','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='rooftop';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'rosa-sky-rooftop',
    'Rosa Sky Rooftop',
    v_vt, '115 SW 8th St', '33130',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','outdoor_space','modern','full_bar','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'cipriani-downtown-miami',
    'Cipriani Downtown Miami',
    v_vt, '465 Brickell Ave', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'ciprianimia@cipriani.com', '+17863294090', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','luxury','multiple_floors','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'gekko',
    'Gekko',
    v_vt, '8 SE 8th St', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@gekko.com', '+13054238884', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','full_bar','vip_areas','dance_floor','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='bar';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'baby-jane',
    'Baby Jane',
    v_vt, '500 Brickell Ave Ste 105E', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    75, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17866233555', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','dance_floor','vip_areas');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'amaz-nico-miami',
    'Amazónico Miami',
    v_vt, '800 Brickell Ave', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','multiple_floors','luxury','led_walls','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='nightclub';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'selva-miami',
    'Selva Miami',
    v_vt, '800 Brickell Ave Fl 3', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('led_walls','dance_floor','vip_areas','modern');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'four-seasons-hotel-miami',
    'Four Seasons Hotel Miami',
    v_vt, '1435 Brickell Ave', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053583535', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','pool','multiple_floors','av_included','valet','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='brickell';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='rooftop';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'altitude-at-sls-lux-brickell',
    'Altitude at SLS LUX Brickell',
    v_vt, '805 S Miami Ave', '33130',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'reservations.lux@slshotels.com', '+13058590202', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','luxury','outdoor_space','vip_areas');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='nightclub';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'e11even-miami',
    'E11EVEN Miami',
    v_vt, '29 NE 11th St', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1250, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058292911', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('led_walls','dance_floor','stage','vip_areas','multiple_floors','full_bar');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='theater';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'adrienne-arsht-center',
    'Adrienne Arsht Center',
    v_vt, '1300 Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2400, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'rentals@arshtcenter.org', '+17864682292', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','av_included','green_room','kitchen','handicap_accessible','loading_dock');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='theater';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'james-l-knight-center',
    'James L. Knight Center',
    v_vt, '400 SE 2nd Ave', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    4569, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054165972', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','av_included','loading_dock','handicap_accessible','waterfront');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='museum';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'p-rez-art-museum-miami-pamm',
    'Pérez Art Museum Miami (PAMM)',
    v_vt, '1103 Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    5000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053753000', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','art_installations','modern','gardens','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='museum';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'frost-museum-of-science',
    'Frost Museum of Science',
    v_vt, '1101 Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@frostscience.org', '+13054349600', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','art_installations','led_walls','dance_floor','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'historic-alfred-i-dupont-building',
    'Historic Alfred I. DuPont Building',
    v_vt, '169 E Flagler St', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053743677', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','multiple_floors','kitchen','luxury','handicap_accessible','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='arena';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'kaseya-center',
    'Kaseya Center',
    v_vt, '601 Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    19600, 'stadium', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17867771000', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('led_walls','stage','loading_dock','waterfront','av_included','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='food_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'julia-henry-s-food-hall',
    'Julia & Henry''s Food Hall',
    v_vt, '200 E Flagler St', '33131',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17867032126', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.1, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','multiple_floors','stage','full_bar','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'fpl-solar-amphitheater-at-bayfront-park',
    'FPL Solar Amphitheater at Bayfront Park',
    v_vt, '301 N Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    5828, 'stadium', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059382517', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','waterfront','stage','av_included','vip_areas','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='downtown-miami';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'bayside-marketplace',
    'Bayside Marketplace',
    v_vt, '401 Biscayne Blvd', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2000, 'mega', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'arodriguez@baysidemarketplace.com', '+13055773344', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','marina','parking','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'amara-at-paraiso',
    'Amara at Paraiso',
    v_vt, '3101 NE 7th Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'reservations@amaraatparaiso.com', '+13056769495', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','waterfront','outdoor_space','luxury','private_rooms','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'casadonna',
    'Casadonna',
    v_vt, '1737 N Bayshore Dr', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    700, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'reservations@casadonnamiami.com', '+13054752272', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','historic','outdoor_space','luxury','gardens','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-elser-hotel-bayview-terrace',
    'The Elser Hotel (Bayview Terrace)',
    v_vt, '398 NE 5th St', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','waterfront','outdoor_space','luxury','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'margaret-pace-park',
    'Margaret Pace Park',
    v_vt, '1745 N Bayshore Dr', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2000, 'mega', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','waterfront','parking','pet_friendly','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'jungle-island-bloom-events',
    'Jungle Island (Bloom Events)',
    v_vt, '1111 Parrot Jungle Trail', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054007000', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','beach_access','gardens','loading_dock','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'kiki-on-the-river',
    'Kiki on the River',
    v_vt, '450 NW N River Dr', '33128',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'caroline@kikiontheriver.com', '+17865023243', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','marina','dance_floor','vip_areas','luxury');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'seaspice-brasserie-lounge',
    'Seaspice Brasserie & Lounge',
    v_vt, '412 NW North River Dr', '33128',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@seaspice.com', '+13054404200', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','marina','outdoor_space','industrial','private_rooms','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='studio';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'maps-backlot',
    'Maps Backlot',
    v_vt, '342 NW 24th St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13055327880', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','industrial','green_room','loading_dock','full_bar','projection_mapping');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'arlo-wynwood',
    'Arlo Wynwood',
    v_vt, '2217 NW Miami Ct', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    350, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'miamievents@arlohotels.com', '+17865226600', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','outdoor_space','modern','vip_areas','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='edgewater';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    '1800-club',
    '1800 Club',
    v_vt, '1800 N Bayshore Dr', '33132',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'low'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','pool','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='rooftop';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'salvaje-miami',
    'Salvaje Miami',
    v_vt, '101 NE 34th St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    160, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'hello@salvajemiami.com', '+17866229911', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','outdoor_space','modern','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='bar';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'tap-42-midtown',
    'Tap 42 Midtown',
    v_vt, '3252 NE 1st Ave Ste 101', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17868640194', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'chimba-miami',
    'Chimba Miami',
    v_vt, '2830 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@chimbamiami.com', '+17865585898', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','dance_floor','live_music','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'italica-midtown',
    'Italica Midtown',
    v_vt, '3201 NE 1st Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    100, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@italicamiami.com', '+17868502600', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','kitchen','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='lounge';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'victory-restaurant-lounge',
    'Victory Restaurant & Lounge',
    v_vt, '3252 NE 1st Ave Ste 107', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'catering@victorymiami.com', '+13058771371', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('full_bar','dance_floor','vip_areas','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='rooftop';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'midtown-veranda',
    'Midtown Veranda',
    v_vt, '3711 NE 2nd Ave Ste 200', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','outdoor_space','modern','kitchen','full_bar');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'le-chick-miami',
    'Le Chick Miami',
    v_vt, '310 NW 24th St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    210, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'reservations@lechickmiami.com', '+17862167086', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','full_bar','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'uchi-miami',
    'Uchi Miami',
    v_vt, '252 NW 25th St', '33127',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    120, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059950915', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','modern','private_rooms','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'mandolin-aegean-bistro',
    'Mandolin Aegean Bistro',
    v_vt, '4312 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    220, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'reservations@mandolinmiami.com', '+13057499140', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','gardens','historic','kitchen','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='midtown';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'michael-s-genuine-food-drink',
    'Michael''s Genuine Food & Drink',
    v_vt, '130 NE 40th St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    180, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056760894', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','kitchen','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-haiti';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='bar';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'churchill-s-pub',
    'Churchill''s Pub',
    v_vt, '5501 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13057571807', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.9, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','live_music','historic','industrial');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-haiti';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='theater';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'little-haiti-cultural-complex',
    'Little Haiti Cultural Complex',
    v_vt, '212 NE 59th Terrace', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059602969', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','av_included','art_installations','outdoor_space','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-haiti';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'libreri-mapou',
    'Libreri Mapou',
    v_vt, '5919 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    50, 'micro', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'mapoujan@bellsouth.net', '+13057579922', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-river';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'nina-johnson-gallery',
    'Nina Johnson Gallery',
    v_vt, '6315 NW 2nd Ave', '33150',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    100, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@ninajohnson.com', '+13055712288', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('modern','art_installations','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-haiti';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sweat-records',
    'Sweat Records',
    v_vt, '5505 NE 2nd Ave', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    100, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17866939309', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('art_installations','stage','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-haiti';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='food_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-citadel',
    'The Citadel',
    v_vt, '8300 NE 2nd Ave', '33138',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059083849', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','multiple_floors','full_bar','parking','live_music','historic');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-river';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sunny-s-steakhouse',
    'Sunny''s Steakhouse',
    v_vt, '7357 NW Miami Ct', '33150',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    220, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','gardens','historic','luxury','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-river';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'dimensions-variable',
    'Dimensions Variable',
    v_vt, '101 NW 79th St', '33150',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056153532', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('industrial','modern','art_installations','warehouse');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-river';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='gallery';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'locust-projects',
    'Locust Projects',
    v_vt, '297 NE 67th St', '33138',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@locustprojects.org', '+13055768570', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('industrial','art_installations','warehouse','outdoor_space');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='little-river';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'zeyzey',
    'ZeyZey',
    v_vt, '353 NE 61st St', '33137',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1050, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'zeyzey@grassfedculture.com', '+13054562671', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','dance_floor','full_bar','vip_areas','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='nightclub';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'm2-miami',
    'M2 Miami',
    v_vt, '1235 Washington Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@m2miami.com', null, true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('led_walls','dance_floor','stage','vip_areas','historic','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='lounge';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'ora-miami',
    'ORA Miami',
    v_vt, '2000 Collins Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059121010', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('art_installations','vip_areas','dance_floor','full_bar','luxury');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-temple-house',
    'The Temple House',
    v_vt, '1415 Euclid Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@thetemplehouse.com', '+13056732526', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','projection_mapping','multiple_floors','exclusive_buyout','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='historic_estate';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'villa-casa-casuarina',
    'Villa Casa Casuarina',
    v_vt, '1116 Ocean Dr', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@vmmiamibeach.com', '+17864852200', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','historic','luxury','outdoor_space','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'esme-miami-beach',
    'Esme Miami Beach',
    v_vt, '1438 Washington Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058098050', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','outdoor_space','luxury','historic','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='bar';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sweet-liberty-drinks-supply',
    'Sweet Liberty Drinks & Supply',
    v_vt, '237-B 20th St', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13057638217', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('full_bar','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    '1-hotel-south-beach',
    '1 Hotel South Beach',
    v_vt, '2341 Collins Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'sales.southbeach@1hotels.com', '+13056041000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','beach_access','waterfront','luxury','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-betsy-hotel-south-beach',
    'The Betsy Hotel South Beach',
    v_vt, '1440 Ocean Dr', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@thebetsyhotel.com', '+13055316100', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','historic','luxury','live_music','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'loews-miami-beach-hotel',
    'Loews Miami Beach Hotel',
    v_vt, '1601 Collins Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056041601', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','av_included','multiple_floors','loading_dock');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='south-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sagamore-hotel-south-beach',
    'Sagamore Hotel South Beach',
    v_vt, '1671 Collins Ave', '33139',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@sagamorehotel.com', '+13055358088', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','beach_access','art_installations','outdoor_space','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'fontainebleau-miami-beach',
    'Fontainebleau Miami Beach',
    v_vt, '4441 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3800, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13055382000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','stage','led_walls','multiple_floors','loading_dock');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'faena-hotel-miami-beach',
    'Faena Hotel Miami Beach',
    v_vt, '3201 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'faenatheater@faena.com', '+17866555742', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','stage','art_installations','historic');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'faena-forum',
    'Faena Forum',
    v_vt, '3300 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@faena.com', '+13055348800', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('modern','art_installations','multiple_floors','av_included','loading_dock');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-miami-beach-edition',
    'The Miami Beach EDITION',
    v_vt, '2901 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events.mia@editionhotels.com', '+17862574500', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','dance_floor','multiple_floors','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'eden-roc-miami-beach',
    'Eden Roc Miami Beach',
    v_vt, '4525 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13055310000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','historic','luxury','loading_dock','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'nobu-hotel-miami-beach',
    'Nobu Hotel Miami Beach',
    v_vt, '4525 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056745502', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','modern','private_rooms','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='lounge';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'soho-beach-house-miami',
    'Soho Beach House Miami',
    v_vt, '4385 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'miami@sohohouse.com', '+17865077900', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','beach_access','historic','luxury','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='mid-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'andaz-miami-beach',
    'Andaz Miami Beach',
    v_vt, '4041 Collins Ave', '33140',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054241234', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','beach_access','luxury','outdoor_space','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='north-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'carillon-miami-wellness-resort',
    'Carillon Miami Wellness Resort',
    v_vt, '6801 Collins Ave', '33141',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13055147000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','outdoor_space','rooftop');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami Beach';
  select id into v_dist from districts where slug='north-beach';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='unconventional_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'north-beach-bandshell',
    'North Beach Bandshell',
    v_vt, '7275 Collins Ave', '33141',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1350, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17864532897', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','av_included','historic','led_walls','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='historic_estate';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'vizcaya-museum-gardens',
    'Vizcaya Museum & Gardens',
    v_vt, '3251 S Miami Ave', '33129',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'facility.rentals@vizcaya.org', '+13052509133', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','gardens','historic','luxury','parking','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-mutiny-hotel',
    'The Mutiny Hotel',
    v_vt, '2951 S Bayshore Dr', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054412100', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','pool','outdoor_space','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'mayfair-house-hotel-garden',
    'Mayfair House Hotel & Garden',
    v_vt, '3000 Florida Ave', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054410000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','gardens','luxury','multiple_floors','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'regatta-grove',
    'Regatta Grove',
    v_vt, '3415 Pan American Dr', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','stage','full_bar','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'monty-s-raw-bar',
    'Monty''s Raw Bar',
    v_vt, '2550 S Bayshore Dr', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058563992', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','marina','outdoor_space','private_rooms','full_bar','historic');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'ariete',
    'Ariete',
    v_vt, '3540 Main Hwy', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    60, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','private_rooms','luxury','kitchen','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'bombay-darbar',
    'Bombay Darbar',
    v_vt, '2901 Florida Ave', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    80, 'small', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054447272', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','private_rooms','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='historic_estate';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'barnacle-historic-state-park',
    'Barnacle Historic State Park',
    v_vt, '3485 Main Hwy', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1030, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054426866', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','outdoor_space','historic','gardens');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-kampong',
    'The Kampong',
    v_vt, '4013 S Douglas Rd', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'kampong@ntbg.org', '+13054427169', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','gardens','outdoor_space','historic');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='coconut-grove';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'glass-vine',
    'Glass & Vine',
    v_vt, '2820 McFarlane Rd', '33133',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059306975', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','gardens','pet_friendly','kitchen','exclusive_buyout');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-biltmore-hotel',
    'The Biltmore Hotel',
    v_vt, '1200 Anastasia Ave', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'weddings@biltmorehotel.com', '+13059133105', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','luxury','pool','gardens','handicap_accessible','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='country_club';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'coral-gables-golf-country-club',
    'Coral Gables Golf & Country Club',
    v_vt, '997 N Greenway Dr', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@CoralGablesCountryClub.com', '+13057228783', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','gardens','pool','outdoor_space','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'loews-coral-gables-hotel',
    'Loews Coral Gables Hotel',
    v_vt, '2950 Coconut Grove Dr', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17867727600', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','pool','modern','luxury','av_included','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'hotel-colonnade-coral-gables',
    'Hotel Colonnade Coral Gables',
    v_vt, '180 Aragon Ave', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054412600', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','historic','luxury','pool','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='museum';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'coral-gables-museum',
    'Coral Gables Museum',
    v_vt, '285 Aragon Ave', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    280, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@coralgablesmuseum.org', '+13056038067', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','outdoor_space','art_installations','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='theater';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'actors-playhouse-at-miracle-theatre',
    'Actors'' Playhouse at Miracle Theatre',
    v_vt, '280 Miracle Mile', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'box@actorsplayhouse.org', '+13054449293', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','av_included','historic','green_room');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='theater';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'coral-gables-art-cinema',
    'Coral Gables Art Cinema',
    v_vt, '260 Aragon Ave', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    141, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@gablescinema.com', '+17864722249', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','av_included','handicap_accessible','modern');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'books-books-flagship',
    'Books & Books (Flagship)',
    v_vt, '265 Aragon Ave', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054424408', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','historic','private_rooms','full_bar');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'hyatt-regency-coral-gables',
    'Hyatt Regency Coral Gables',
    v_vt, '50 Alhambra Plaza', '33134',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054411234', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','luxury','multiple_floors','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Coral Gables';
  select id into v_dist from districts where slug='coral-gables';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='country_club';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'riviera-country-club',
    'Riviera Country Club',
    v_vt, '1155 Blue Rd', '33146',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    400, 'mid', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056615331', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','pool','gardens','private_rooms','outdoor_space');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'trump-national-doral-miami',
    'Trump National Doral Miami',
    v_vt, '4400 NW 87th Ave', '33178',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'Doral.Sales@trumphotels.com', '+13055916453', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('luxury','pool','gardens','multiple_floors','loading_dock','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'intercontinental-doral-miami',
    'InterContinental Doral Miami',
    v_vt, '2505 NW 87th Ave', '33172',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054681400', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','valet','dance_floor','kitchen','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='country_club';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'doral-park-country-club',
    'Doral Park Country Club',
    v_vt, '5001 NW 104th Ave', '33178',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'adelucia@doralpark.org', '+13055918800', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','gardens','outdoor_space','private_rooms','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'marriott-s-villas-at-doral',
    'Marriott''s Villas at Doral',
    v_vt, '4101 NW 87th Ave', '33178',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13052785031', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.2, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'hyatt-place-miami-airport-west-doral',
    'Hyatt Place Miami Airport-West/Doral',
    v_vt, '3655 NW 82nd Ave', '33166',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    100, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13057188292', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'courtyard-miami-airport-west-doral',
    'Courtyard Miami Airport West/Doral',
    v_vt, '3929 NW 79th Ave', '33166',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    45, 'micro', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054778118', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'cityplace-doral',
    'CityPlace Doral',
    v_vt, '8300 NW 36th St', '33166',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17866931849', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','parking','stage','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='food_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-doral-yard',
    'The Doral Yard',
    v_vt, '8455 NW 53rd St Ste G106', '33166',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'hola@thedoralyard.com', '+17868435106', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','stage','full_bar','live_music','kitchen','pet_friendly');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='sports_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'bowlero-doral',
    'Bowlero Doral',
    v_vt, '11401 NW 12th St', '33172',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'booking@lsent.com', '+13055940200', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.1, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('led_walls','full_bar','parking','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Doral';
  select id into v_dist from districts where slug='doral';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'doral-legacy-park',
    'Doral Legacy Park',
    v_vt, '11400 NW 82nd St', '33178',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'doralparksinfo@cityofdoral.com', '+13053413601', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','parking','pet_friendly','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='sports_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'hialeah-park-racing-casino',
    'Hialeah Park Racing & Casino',
    v_vt, '100 E 32nd St', '33013',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    5000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'events@hialeahparkcasino.com', '+13058858000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('historic','outdoor_space','gardens','multiple_floors','parking');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'milander-center-for-arts-entertainment',
    'Milander Center for Arts & Entertainment',
    v_vt, '4800 Palm Ave', '33012',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058270681', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','outdoor_space','art_installations','handicap_accessible');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='banquet_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'angelito-s-banquet-hall',
    'Angelito''s Banquet Hall',
    v_vt, '300 Palm Ave', '33010',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    300, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'Angelitosbanquethalls@gmail.com', '+13058889345', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('dance_floor','stage','full_bar','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='banquet_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'celebration-ballrooms',
    'Celebration Ballrooms',
    v_vt, '12531 W Okeechobee Rd', '33018',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058240619', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('dance_floor','kitchen','parking','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='banquet_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'royal-palace-ballrooms',
    'Royal Palace Ballrooms',
    v_vt, '1550 W 84th St #73', '33014',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17867053999', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('dance_floor','kitchen','parking','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'holiday-inn-miami-west-hialeah-gardens',
    'Holiday Inn Miami West – Hialeah Gardens',
    v_vt, '7707 NW 103rd St', '33016',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058251000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','av_included','parking','dance_floor');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-leah-arts-district',
    'The Leah Arts District',
    v_vt, '1501 E 10th Ave', '33010',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','art_installations','industrial','warehouse');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'amelia-earhart-park',
    'Amelia Earhart Park',
    v_vt, '401 E 65th St', '33013',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056858389', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','waterfront','parking','pet_friendly');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'ritmos-venue',
    'Ritmos Venue',
    v_vt, '419 NW 77th Ct Ste 418', '33016',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+17863346605', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('rooftop','led_walls','stage','dance_floor','full_bar');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Hialeah';
  select id into v_dist from districts where slug='hialeah';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='banquet_hall';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'my-dreams-ballrooms',
    'My Dreams Ballrooms',
    v_vt, '5908 W 16th Ave', '33012',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('dance_floor','kitchen','modern');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-ritz-carlton-key-biscayne',
    'The Ritz-Carlton Key Biscayne',
    v_vt, '455 Grand Bay Dr', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'Marketing.rckbm@ritzcarlton.com', '+13053654500', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','waterfront','pool','luxury','gardens','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='virginia-key';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='restaurant_private_dining';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'rusty-pelican-miami',
    'Rusty Pelican Miami',
    v_vt, '3201 Rickenbacker Cswy', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053613818', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','valet','kitchen','luxury','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='beach_club';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'the-ocean-club-key-biscayne',
    'The Ocean Club Key Biscayne',
    v_vt, '791 Crandon Blvd', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    250, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053611101', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.6, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','pool','luxury','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='virginia-key';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'historic-virginia-key-beach-park',
    'Historic Virginia Key Beach Park',
    v_vt, '4020 Virginia Beach Dr', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'info@virginiakeybeachpark.net', '+13059604600', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','waterfront','historic','outdoor_space','stage');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'bill-baggs-cape-florida-state-park',
    'Bill Baggs Cape Florida State Park',
    v_vt, '1200 S Crandon Blvd', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'jorge.brito@floridadep.gov', '+17865822673', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','waterfront','historic','outdoor_space','marina');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'crandon-park',
    'Crandon Park',
    v_vt, '6747 Crandon Blvd', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    3000, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053615421', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.7, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('beach_access','waterfront','outdoor_space','marina','parking');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='country_club';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'crandon-golf-at-key-biscayne',
    'Crandon Golf at Key Biscayne',
    v_vt, '6700 Crandon Blvd', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053619129', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','gardens','historic','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='yacht';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'key-biscayne-yacht-club',
    'Key Biscayne Yacht Club',
    v_vt, '180 Harbor Dr', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'medium'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053619171', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','marina','private_rooms','luxury');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'key-biscayne-community-center',
    'Key Biscayne Community Center',
    v_vt, '10 Village Green Way', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    150, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'acolls@keybiscayne.fl.gov', '+13053658900', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('handicap_accessible','kitchen','parking','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Key Biscayne';
  v_dist := null;
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='sports_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'crandon-park-tennis-center',
    'Crandon Park Tennis Center',
    v_vt, '7300 Crandon Blvd', '33149',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    200, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13053652300', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.5, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','beach_access','historic','parking');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='stadium';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'nu-stadium-at-miami-freedom-park',
    'Nu Stadium at Miami Freedom Park',
    v_vt, '1400 NW 37th Ave', '33125',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    26700, 'stadium', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13054280611', true);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','led_walls','loading_dock','parking','handicap_accessible','vip_areas');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'hilton-miami-airport-blue-lagoon',
    'Hilton Miami Airport Blue Lagoon',
    v_vt, '5101 Blue Lagoon Dr', '33126',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1000, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13052621000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('waterfront','pool','parking','av_included','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'miami-airport-marriott',
    'Miami Airport Marriott',
    v_vt, '1201 NW LeJeune Rd', '33126',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    600, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056495000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included','multiple_floors');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'courtyard-miami-airport-marriott-connection',
    'Courtyard Miami Airport (Marriott Connection)',
    v_vt, '1201 NW LeJeune Rd', '33126',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    120, 'small', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056428200', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'sheraton-miami-airport-hotel-emc',
    'Sheraton Miami Airport Hotel & EMC',
    v_vt, '3900 NW 21st St', '33142',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    450, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13058713800', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included','private_rooms');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='hotel_ballroom';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'embassy-suites-miami-international-airport',
    'Embassy Suites Miami International Airport',
    v_vt, '3974 NW South River Dr', '33142',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    390, 'mid', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056345000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.0, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('pool','parking','av_included','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'miami-airport-convention-center-macc-doubletree',
    'Miami Airport Convention Center (MACC/DoubleTree)',
    v_vt, '711 NW 72nd Ave', '33126',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    2500, 'mega', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', 'sales@macc.com', '+13052613800', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 3.8, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('loading_dock','parking','av_included','multiple_floors','kitchen');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='event_venue';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'magic-city-casino-stage-305',
    'Magic City Casino (Stage 305)',
    v_vt, '450 NW 37th Ave', '33126',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    1500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13056493000', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.1, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('stage','parking','full_bar','historic','live_music');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='outdoor_space';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'grapeland-water-park',
    'Grapeland Water Park',
    v_vt, '1550 NW 37th Ave', '33125',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    800, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059602950', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.4, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','pool','parking','art_installations');
END $$;


DO $$
DECLARE
  v_loc uuid;
  v_dist uuid;
  v_ctry uuid;
  v_r1 uuid;
  v_r2 uuid;
  v_vt uuid;
  new_venue_id uuid;
BEGIN
  select id into v_loc from localities where name='Miami';
  select id into v_dist from districts where slug='freedom-park';
  select id into v_ctry from countries where iso_alpha_2='US';
  select id into v_r1 from region_level_1 where code='FL';
  select id into v_r2 from region_level_2 where name='Miami-Dade County';
  select id into v_vt from venue_types where code='park';

  insert into venues (
    slug, name, venue_type_id, address_line_1, postal_code,
    locality_id, district_id, region_level_1_id, region_level_2_id, country_id,
    capacity_standing, capacity_range, is_active,
    active_verified_at, data_confidence
  ) values (
    'grapeland-heights-park',
    'Grapeland Heights Park',
    v_vt, '1550 NW 37th Ave', '33125',
    v_loc, v_dist, v_r1, v_r2, v_ctry,
    500, 'large', true,
    '2026-04-16'::timestamptz, 'high'
  ) returning id into new_venue_id;

  insert into venue_contacts (venue_id, role, email, phone_e164, is_primary)
  values (new_venue_id, 'booking', null, '+13059602950', true);

  insert into venue_ratings (venue_id, source, score, captured_at)
  values (new_venue_id, 'google', 4.3, '2026-04-16'::timestamptz);

  insert into venue_features (venue_id, feature_id)
  select new_venue_id, id from features where slug in ('outdoor_space','parking','pet_friendly','handicap_accessible');
END $$;
