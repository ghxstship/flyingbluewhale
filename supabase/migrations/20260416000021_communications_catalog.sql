-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 021: Communications Catalog (Workplace)
-- Adds radios, earpieces, chargers, batteries, repeaters
-- ═══════════════════════════════════════════════════════

-- ═══ GROUP: Workplace ═══
insert into advance_category_groups (id, name, slug, sort_order) values
  ('a0000001-0000-0000-0000-000000000005', 'Workplace', 'workplace', 5)
on conflict (id) do nothing;

-- ═══ CATEGORY: Communications (under Workplace group) ═══
insert into advance_categories (id, group_id, name, slug, sort_order) values
  ('b0000001-0000-0000-0000-000000000025', 'a0000001-0000-0000-0000-000000000005', 'Communications', 'communications', 4);

-- ═══ SUBCATEGORIES ═══
insert into advance_subcategories (id, category_id, name, slug, sort_order) values
  ('c0000001-0000-0000-0000-000000000084', 'b0000001-0000-0000-0000-000000000025', 'Two-Way Radios', 'two-way-radios', 1),
  ('c0000001-0000-0000-0000-000000000085', 'b0000001-0000-0000-0000-000000000025', 'Earpieces & Headsets', 'earpieces-headsets', 2),
  ('c0000001-0000-0000-0000-000000000086', 'b0000001-0000-0000-0000-000000000025', 'Chargers & Batteries', 'chargers-batteries', 3),
  ('c0000001-0000-0000-0000-000000000087', 'b0000001-0000-0000-0000-000000000025', 'Radio Accessories', 'radio-accessories', 4),
  ('c0000001-0000-0000-0000-000000000088', 'b0000001-0000-0000-0000-000000000025', 'Repeaters & Infrastructure', 'repeaters-infrastructure', 5);

-- ═══ ITEMS: Two-Way Radios ═══
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000084', 'Motorola CP200d (UHF)', 'cp200d-uhf', 'Motorola Solutions', 'CP200d UHF', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "channels": 16, "watts": 4, "digital": true, "analog": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola CP200d (VHF)', 'cp200d-vhf', 'Motorola Solutions', 'CP200d VHF', 'each', '{production}', '{"type": "two_way_radio", "band": "VHF", "channels": 16, "watts": 5, "digital": true, "analog": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola XPR 7550e (UHF)', 'xpr7550e-uhf', 'Motorola Solutions', 'XPR 7550e', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "channels": 1000, "watts": 4, "digital": true, "gps": true, "bluetooth": true, "display": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola XPR 3500e', 'xpr3500e', 'Motorola Solutions', 'XPR 3500e', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "channels": 32, "watts": 4, "digital": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola R7 (Full Keypad)', 'r7-full', 'Motorola Solutions', 'R7', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF/VHF", "channels": 1000, "watts": 5, "digital": true, "display": true, "wifi": true, "bluetooth": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola R7 (No Keypad)', 'r7-nkp', 'Motorola Solutions', 'R7 NKP', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF/VHF", "watts": 5, "digital": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola DTR700', 'dtr700', 'Motorola Solutions', 'DTR700', 'each', '{production}', '{"type": "two_way_radio", "band": "900MHz", "license_free": true, "digital": true, "channels": 25}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola T800', 't800', 'Motorola Solutions', 'Talkabout T800', 'each', '{production}', '{"type": "two_way_radio", "band": "FRS/GMRS", "license_free": true, "range_miles": 35}'),
  ('c0000001-0000-0000-0000-000000000084', 'Motorola CLS1410', 'cls1410', 'Motorola Solutions', 'CLS1410', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "channels": 4, "watts": 1, "license_free": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Hytera PD685 (UHF)', 'pd685', 'Hytera', 'PD685', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "watts": 4, "digital": true, "display": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Kenwood NX-3320 (UHF)', 'nx3320', 'Kenwood', 'NX-3320', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "watts": 5, "digital": true, "display": true}'),
  ('c0000001-0000-0000-0000-000000000084', 'Kenwood NX-1300 (UHF)', 'nx1300', 'Kenwood', 'NX-1300', 'each', '{production}', '{"type": "two_way_radio", "band": "UHF", "watts": 5, "digital": true}');

-- ═══ ITEMS: Earpieces & Headsets ═══
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000085', '1-Wire Surveillance Earpiece', 'earpiece-1wire', 'Various', '1-Wire Kit', 'each', '{production}', '{"type": "earpiece", "wires": 1, "ptt": "inline", "acoustic_tube": true}'),
  ('c0000001-0000-0000-0000-000000000085', '2-Wire Surveillance Earpiece', 'earpiece-2wire', 'Various', '2-Wire Kit', 'each', '{production}', '{"type": "earpiece", "wires": 2, "ptt": "separate", "acoustic_tube": true}'),
  ('c0000001-0000-0000-0000-000000000085', '3-Wire Surveillance Earpiece', 'earpiece-3wire', 'Various', '3-Wire Kit', 'each', '{production}', '{"type": "earpiece", "wires": 3, "ptt": "separate", "acoustic_tube": true, "receive_only_option": true}'),
  ('c0000001-0000-0000-0000-000000000085', 'D-Ring Earpiece w/ PTT', 'earpiece-d-ring', 'Various', 'D-Ring', 'each', '{production}', '{"type": "earpiece", "style": "d_ring", "ptt": "inline"}'),
  ('c0000001-0000-0000-0000-000000000085', 'Receive-Only Earpiece (3.5mm)', 'earpiece-rx-only', 'Various', '3.5mm Receive-Only', 'each', '{production}', '{"type": "earpiece", "receive_only": true, "connector": "3.5mm"}'),
  ('c0000001-0000-0000-0000-000000000085', 'Lightweight Over-Head Headset', 'headset-lightweight', 'Various', 'Lightweight Headset', 'each', '{production}', '{"type": "headset", "style": "over_head", "noise_cancelling": false}'),
  ('c0000001-0000-0000-0000-000000000085', 'Heavy-Duty Noise-Cancel Headset', 'headset-heavy-duty', 'Various', 'Heavy-Duty', 'each', '{production}', '{"type": "headset", "style": "over_head", "noise_cancelling": true, "noise_reduction_db": 24}'),
  ('c0000001-0000-0000-0000-000000000085', 'Motorola PMMN4013 Speaker Mic', 'pmmn4013', 'Motorola Solutions', 'PMMN4013', 'each', '{production}', '{"type": "speaker_mic", "remote_ptt": true, "swivel_clip": true}'),
  ('c0000001-0000-0000-0000-000000000085', 'Motorola PMMN4025 Windport Speaker Mic', 'pmmn4025', 'Motorola Solutions', 'PMMN4025', 'each', '{production}', '{"type": "speaker_mic", "windporting": true, "ip55": true}');

-- ═══ ITEMS: Chargers & Batteries ═══
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000086', 'Single-Unit Rapid Charger', 'charger-single', 'Motorola Solutions', 'WPLN4137', 'each', '{production}', '{"type": "charger", "bays": 1, "rapid": true, "charge_time_hrs": 3}'),
  ('c0000001-0000-0000-0000-000000000086', '6-Bay Multi-Unit Charger', 'charger-6bay', 'Motorola Solutions', 'WPLN4232', 'each', '{production}', '{"type": "charger", "bays": 6, "rapid": true, "charge_time_hrs": 3}'),
  ('c0000001-0000-0000-0000-000000000086', '12-Bay Multi-Unit Charger', 'charger-12bay', 'Motorola Solutions', 'WPLN4219', 'each', '{production}', '{"type": "charger", "bays": 12, "rapid": true}'),
  ('c0000001-0000-0000-0000-000000000086', 'Vehicle Charger (12V)', 'charger-vehicle', 'Motorola Solutions', 'RLN6434', 'each', '{production}', '{"type": "charger", "input": "12V_DC", "mounting": "vehicle"}'),
  ('c0000001-0000-0000-0000-000000000086', 'Spare Battery (Li-Ion, Standard)', 'battery-standard', 'Motorola Solutions', 'PMNN4409', 'each', '{production}', '{"type": "battery", "chemistry": "li_ion", "mah": 2150, "runtime_hrs": 14}'),
  ('c0000001-0000-0000-0000-000000000086', 'Spare Battery (Li-Ion, High-Cap)', 'battery-high-cap', 'Motorola Solutions', 'PMNN4544', 'each', '{production}', '{"type": "battery", "chemistry": "li_ion", "mah": 2900, "runtime_hrs": 20}'),
  ('c0000001-0000-0000-0000-000000000086', 'Spare Battery (Li-Ion, IMPRES)', 'battery-impres', 'Motorola Solutions', 'PMNN4488', 'each', '{production}', '{"type": "battery", "chemistry": "li_ion", "mah": 3000, "impres": true, "runtime_hrs": 22}'),
  ('c0000001-0000-0000-0000-000000000086', 'AA Battery Tray (CP200d)', 'battery-tray-aa', 'Motorola Solutions', 'PMLN6745', 'each', '{production}', '{"type": "battery_tray", "cell_type": "AA", "cells": 5}');

-- ═══ ITEMS: Radio Accessories ═══
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000087', 'Belt Clip (Spring-Action)', 'belt-clip-spring', 'Motorola Solutions', 'HLN9714A', 'each', '{production}', '{"type": "belt_clip", "style": "spring_action"}'),
  ('c0000001-0000-0000-0000-000000000087', 'Leather Carry Case w/ Belt Loop', 'carry-case-leather', 'Motorola Solutions', 'PMLN5839', 'each', '{production}', '{"type": "carry_case", "material": "leather", "swivel_belt_loop": true}'),
  ('c0000001-0000-0000-0000-000000000087', 'Nylon Carry Case w/ Belt Loop', 'carry-case-nylon', 'Motorola Solutions', 'PMLN5840', 'each', '{production}', '{"type": "carry_case", "material": "nylon", "swivel_belt_loop": true}'),
  ('c0000001-0000-0000-0000-000000000087', 'Chest Harness Pack', 'chest-harness', 'Various', 'Universal Chest Pack', 'each', '{production}', '{"type": "harness", "style": "chest_mount", "universal_fit": true}'),
  ('c0000001-0000-0000-0000-000000000087', 'UHF Stubby Antenna', 'antenna-stubby', 'Motorola Solutions', 'PMAE4079', 'each', '{production}', '{"type": "antenna", "band": "UHF", "style": "stubby", "length_inches": 3.5}'),
  ('c0000001-0000-0000-0000-000000000087', 'UHF Whip Antenna', 'antenna-whip', 'Motorola Solutions', 'PMAE4069', 'each', '{production}', '{"type": "antenna", "band": "UHF", "style": "whip", "length_inches": 6.3}'),
  ('c0000001-0000-0000-0000-000000000087', 'Radio Dust Cover', 'dust-cover', 'Various', 'Universal Dust Cover', 'each', '{production}', '{"type": "dust_cover"}'),
  ('c0000001-0000-0000-0000-000000000087', 'Channel Label Kit', 'channel-labels', 'Various', 'Adhesive Labels', 'pack', '{production}', '{"type": "labeling", "quantity_per_pack": 50}'),
  ('c0000001-0000-0000-0000-000000000087', 'Programming Cable (USB)', 'programming-cable', 'Motorola Solutions', 'PMKN4265', 'each', '{production}', '{"type": "cable", "connector": "USB", "use": "programming"}');

-- ═══ ITEMS: Repeaters & Infrastructure ═══
insert into advance_items (subcategory_id, name, slug, manufacturer, model, unit, visibility_tags, specifications) values
  ('c0000001-0000-0000-0000-000000000088', 'Motorola SLR 5700 Repeater', 'slr5700', 'Motorola Solutions', 'SLR 5700', 'each', '{production}', '{"type": "repeater", "watts": 50, "digital": true, "analog": true, "rack_mount": true}'),
  ('c0000001-0000-0000-0000-000000000088', 'Motorola SLR 1000 Repeater (Compact)', 'slr1000', 'Motorola Solutions', 'SLR 1000', 'each', '{production}', '{"type": "repeater", "watts": 10, "digital": true, "compact": true, "license_free_option": true}'),
  ('c0000001-0000-0000-0000-000000000088', 'Repeater Antenna (High-Gain UHF)', 'repeater-antenna-hg', 'Various', 'High-Gain UHF Collinear', 'each', '{production}', '{"type": "antenna", "band": "UHF", "gain_dbi": 9, "style": "collinear"}'),
  ('c0000001-0000-0000-0000-000000000088', 'Repeater Antenna (Yagi Directional)', 'repeater-antenna-yagi', 'Various', 'Yagi UHF', 'each', '{production}', '{"type": "antenna", "band": "UHF", "gain_dbi": 11, "style": "yagi", "directional": true}'),
  ('c0000001-0000-0000-0000-000000000088', 'Duplexer (UHF)', 'duplexer-uhf', 'Various', 'UHF Bandpass', 'each', '{production}', '{"type": "duplexer", "band": "UHF", "insertion_loss_db": 1.5}'),
  ('c0000001-0000-0000-0000-000000000088', 'Coax Cable (LMR-400, per ft)', 'coax-lmr400', 'Times Microwave', 'LMR-400', 'linear_ft', '{production}', '{"type": "cable", "model": "LMR-400", "impedance_ohms": 50}'),
  ('c0000001-0000-0000-0000-000000000088', 'Antenna Mast (Portable, 25ft)', 'antenna-mast-25', 'Various', '25ft Portable Mast', 'each', '{production}', '{"type": "mast", "height_ft": 25, "portable": true}'),
  ('c0000001-0000-0000-0000-000000000088', 'Radio Programming Service (per radio)', 'radio-programming', 'Service', 'Channel Programming', 'per_radio', '{production}', '{"type": "service", "includes": "frequency_programming, channel_labels, testing"}');
