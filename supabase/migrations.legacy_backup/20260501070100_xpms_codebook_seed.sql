-- LYTEHAUS Technologies · XPMS · XTC Protocol™ codebook seed (v1.0)
--
-- Seeds the canonical ten classes, their published divisions, the published
-- sections within each division, and a representative set of position-root
-- line items per the v1.0 whitepaper.
--
-- Append-only governance: codes never renumber. Future growth occupies
-- X100..X799 (standard track) and X800..X999 (org-private extension).

------------------------------------------------------------------
-- Classes (whitepaper §5)
------------------------------------------------------------------
insert into xtc_classes (code, name, domain, ord, description) values
  (0, 'EXECUTIVE',   'Leadership, Finance, Legal, HR, Strategy, Business Development, Compliance Policy, Insurance', 0,
      'Org-level command and control. Funds, governs, and bonds every other class.'),
  (1, 'CREATIVE',    'Design, Art Direction, Brand, Digital Assets, Source Files, Renders, Content, IP and Rights', 1,
      'Authoring class. Brand systems, source files, renders, deliverables — the work itself.'),
  (2, 'TALENT',      'Performer Bookings, Programming, Curation, Talent Operations, Agency, Riders', 2,
      'Anyone who appears in front of the audience and the apparatus that gets them there.'),
  (3, 'MARKETING',   'Strategy, Social, PR, Press, Sponsorship Sales, Partnerships, CRM, Analytics', 3,
      'Audience acquisition, positioning, and revenue partnerships before / during / after.'),
  (4, 'BUILD',       'Site Operations, Scenic Fabrication, Construction, Installation, Wayfinding, Tents, Structures', 4,
      'Everything physically erected on site. Site, scenic, structural, wayfinding, hard goods.'),
  (5, 'PRODUCTION',  'Audio Systems, Lighting Systems, Video and LED, Staging and Rigging, Power Distribution, SFX', 5,
      'Show systems. Sound, light, video, rigging, power, atmosphere — the technical envelope.'),
  (6, 'OPERATIONS',  'Event Operations, Labor and Staffing, Logistics, Transport, Security, Medical, Permits Execution, Workplace', 6,
      'People + flow. Unifies labor and human-org into one addressable class — no dual-record schism.'),
  (7, 'EXPERIENCE',  'Guest Experience, Activations, Retail and Merchandise, Accessibility, Sponsorship Fulfillment', 7,
      'Audience-facing surface. Activations, accessibility, retail, sponsor fulfillment.'),
  (8, 'HOSPITALITY', 'Food and Beverage, Bar, Catering, Lodging, VIP Services, Artist Hospitality', 8,
      'Care of body. F&B, bar, lodging, VIP, artist hospitality.'),
  (9, 'TECHNOLOGY',  'Digital Experiences, IT, Networking, RF, Ticketing, Data, AR/VR/XR', 9,
      'Bits and signals. Networking, RF, ticketing, data, immersive technology.')
on conflict (code) do nothing;

------------------------------------------------------------------
-- Divisions  (XY)  — 9 per class
------------------------------------------------------------------
insert into xtc_divisions (code, class_code, digit, name, description) values
  -- 0 EXECUTIVE
  (1, 0, 1, 'Leadership',                'C-suite, board, principals'),
  (2, 0, 2, 'Finance & Treasury',        'Capital, accounting, treasury'),
  (3, 0, 3, 'Legal & Compliance',        'Contracts, compliance policy, regulatory'),
  (4, 0, 4, 'Human Resources',           'People ops, benefits, employment policy'),
  (5, 0, 5, 'Strategy & Planning',       'Corporate strategy, OKRs, planning'),
  (6, 0, 6, 'Business Development',      'New business, partnerships at the corporate layer'),
  (7, 0, 7, 'Risk & Insurance',          'Insurance program, enterprise risk'),
  (8, 0, 8, 'Governance',                'Board, committees, governance instruments'),
  (9, 0, 9, 'Office of the CEO',         'Special projects, principal''s office'),
  -- 1 CREATIVE
  (11, 1, 1, 'Brand Systems',            'Brand identity, brand books, naming'),
  (12, 1, 2, 'Art Direction',            'Art direction, mood, visual systems'),
  (13, 1, 3, 'Design',                   'Graphic, environmental, motion design'),
  (14, 1, 4, 'Production Renders',       'CGI, renders, visualisation'),
  (15, 1, 5, 'Source Files',             'CAD, native files, masters, archive'),
  (16, 1, 6, 'Content & Copy',           'Editorial, scripts, narrative'),
  (17, 1, 7, 'Digital Assets',           'DAM-tracked outputs and packaged kits'),
  (18, 1, 8, 'IP & Rights',              'Music sync, image rights, releases'),
  (19, 1, 9, 'AI Provenance',            'AI-assisted assets — tagged, audited'),
  -- 2 TALENT
  (21, 2, 1, 'Performer Bookings',       'Headliners, support, opening sets'),
  (22, 2, 2, 'Programming & Curation',   'Lineup composition, narrative arc'),
  (23, 2, 3, 'Talent Operations',        'Day-of-show talent ops, runners, holds'),
  (24, 2, 4, 'Agency & Reps',            'Agency relationships, reps, managers'),
  (25, 2, 5, 'Riders',                   'Technical + hospitality riders'),
  (26, 2, 6, 'Travel & Accommodation',   'Talent travel, hotels, ground'),
  (27, 2, 7, 'Press & Promo',            'Talent press, promo schedules'),
  (28, 2, 8, 'Settlements',              'Talent settlements, walkout cash, percentages'),
  (29, 2, 9, 'Talent Compliance',        'Visas, work authorisation, age compliance'),
  -- 3 MARKETING
  (31, 3, 1, 'Marketing Strategy',       'Positioning, narrative, channel plan'),
  (32, 3, 2, 'Social & Content',         'Social platforms, creator content'),
  (33, 3, 3, 'PR & Press',               'Press releases, media relations'),
  (34, 3, 4, 'Performance Marketing',    'Paid media, attribution, conversion'),
  (35, 3, 5, 'Sponsorship Sales',        'Sponsorship sales pipeline'),
  (36, 3, 6, 'Partnerships',             'Brand partnerships, co-marketing'),
  (37, 3, 7, 'CRM & Lifecycle',          'Email, lifecycle, audience'),
  (38, 3, 8, 'Analytics & Insights',     'Attribution, reach, sentiment'),
  (39, 3, 9, 'Owned Channels',           'Site, app, newsletter'),
  -- 4 BUILD
  (41, 4, 1, 'Staging & Decking',        'Stages, decks, risers, modular structures'),
  (42, 4, 2, 'Scenic Fabrication',       'Scenic build, finishes, surfaces'),
  (43, 4, 3, 'Site Operations',          'Site planning, fencing, perimeter'),
  (44, 4, 4, 'Tents & Structures',       'Tents, marquees, pavilions, semi-permanent'),
  (45, 4, 5, 'Construction & Installation', 'Hard build, install, anchoring'),
  (46, 4, 6, 'Wayfinding & Signage',     'Wayfinding (USCS) — directional, identity, regulatory'),
  (47, 4, 7, 'Site Power Infrastructure', 'Generators, distribution to atomic site systems'),
  (48, 4, 8, 'Site Plumbing & Sanitation','Water, waste, sanitation infrastructure'),
  (49, 4, 9, 'Site Closeout & Strike',   'Disassembly, strike, restoration'),
  -- 5 PRODUCTION
  (51, 5, 1, 'Lighting Systems',         'Front-light, key, wash, beam, intelligent'),
  (52, 5, 2, 'Video & LED',              'LED walls, projection, IMAG, video infra'),
  (53, 5, 3, 'Audio Systems',            'PA, monitor, broadcast audio'),
  (54, 5, 4, 'Staging & Rigging',        'Trussing, motors, riggers, dead-hangs'),
  (55, 5, 5, 'Power Distribution',       'Distro from generator to fixture, cable runs'),
  (56, 5, 6, 'SFX & Atmosphere',         'Pyro, hazers, lasers, confetti, effects'),
  (57, 5, 7, 'Show Control',             'Show control, MIDI, OSC, automation'),
  (58, 5, 8, 'Communications',           'Comms — IFB, PL, walkies, intercom'),
  (59, 5, 9, 'Broadcast & Capture',      'Multi-cam, broadcast, recording, livestream'),
  -- 6 OPERATIONS
  (61, 6, 1, 'Event Operations',         'Event ops desk, ROS execution, TOC'),
  (62, 6, 2, 'Labor & Staffing',         'Crew positions, labor pool, dispatch'),
  (63, 6, 3, 'Certifications & Credentials', 'ETCP, CDL, OSHA, medical certs'),
  (64, 6, 4, 'Logistics & Freight',      'Freight, drayage, customs'),
  (65, 6, 5, 'Transport & Dispatch',     'Vehicles, dispatch, runner network'),
  (66, 6, 6, 'Security',                 'Guarding, screening, escorts'),
  (67, 6, 7, 'Medical',                  'EMT, MD-on-site, medical encounters'),
  (68, 6, 8, 'Permits & Regulatory',     'Permit pull, inspections, occupancy'),
  (69, 6, 9, 'Workplace & Office',       'Production office, comms hub, workplace'),
  -- 7 EXPERIENCE
  (71, 7, 1, 'Guest Experience',         'Guest journey, ushering, host program'),
  (72, 7, 2, 'Activations',              'Brand activations, immersive moments'),
  (73, 7, 3, 'Retail & Merchandise',     'Merch booths, retail, fulfillment'),
  (74, 7, 4, 'Accessibility',            'ADA, accommodations, inclusive design'),
  (75, 7, 5, 'Sponsor Fulfillment',      'Sponsorship deliverables, asset placement'),
  (76, 7, 6, 'Wayfinding (Guest)',       'Public-facing wayfinding rendered to guest'),
  (77, 7, 7, 'Concierge & VIP',          'VIP concierge, special guests, hosts'),
  (78, 7, 8, 'Photo Activations',        'Photo moments, social hooks, branded sets'),
  (79, 7, 9, 'Languages & Interpretation','Translation, interpretation, captioning'),
  -- 8 HOSPITALITY
  (81, 8, 1, 'Food & Beverage',          'F&B program, menus, kitchen'),
  (82, 8, 2, 'Bar Program',              'Bars, beverage program, mixology'),
  (83, 8, 3, 'Catering',                 'Crew catering, talent catering'),
  (84, 8, 4, 'Lodging',                  'Hotels, blocks, room assignments'),
  (85, 8, 5, 'VIP Services',             'VIP suites, host program, gifting'),
  (86, 8, 6, 'Artist Hospitality',       'Green rooms, hospitality riders'),
  (87, 8, 7, 'Service Equipment',        'Tables, chairs, linen, service ware'),
  (88, 8, 8, 'Specialty Beverage',       'Coffee, tea, water, non-alc'),
  (89, 8, 9, 'Sustainability F&B',       'Compostables, sourcing, waste streams'),
  -- 9 TECHNOLOGY
  (91, 9, 1, 'Networking & Connectivity','LAN, WAN, fiber, satellite uplink'),
  (92, 9, 2, 'IT Infrastructure',        'Servers, workstations, endpoints'),
  (93, 9, 3, 'Wireless & RF',            'Wifi, BLE, RFID, RF coordination'),
  (94, 9, 4, 'Ticketing & Access',       'Ticketing, scanning, access control'),
  (95, 9, 5, 'Data & Telemetry',         'Data ingestion, telemetry, metrics'),
  (96, 9, 6, 'AR / VR / XR',             'Immersive technology'),
  (97, 9, 7, 'Digital Signage & DOOH',   'Powered signage, dynamic content'),
  (98, 9, 8, 'Cybersecurity',            'Security, posture, access management'),
  (99, 9, 9, 'AI Systems',               'AI agents, models, inference')
on conflict (code) do nothing;

------------------------------------------------------------------
-- Sections (XYZ) — representative spread, append-only
------------------------------------------------------------------
insert into xtc_sections (code, division_code, digit, name, description) values
  -- 0 EXECUTIVE
  (11, 1, 1, 'Principals',                  'Founders, principals, equity holders'),
  (21, 2, 1, 'Capital & Funding',           'Capital sources, equity, debt'),
  (22, 2, 2, 'Accounting & GL',             'Accounting, GL, controls'),
  (31, 3, 1, 'Contracts',                   'MSAs, SOWs, NDAs, IP'),
  (41, 4, 1, 'Employment & Benefits',       'Hire, separate, benefits'),
  -- 1 CREATIVE
  (111, 11, 1, 'Brand Identity',            'Logo systems, identity'),
  (131, 13, 1, 'Graphic Design',            'Print, key art, collateral'),
  (132, 13, 2, 'Environmental Design',      'Graphic environments, scenic graphics'),
  (133, 13, 3, 'Motion Design',             'Motion, looped content'),
  (143, 14, 3, 'Approved Hero Frames',      'Approved hero renders, stills'),
  (171, 17, 1, 'Asset Kits',                'Bundled deliverable kits'),
  (191, 19, 1, 'AI-Assisted Renders',       'AI-assisted hero renders, audit-tagged'),
  -- 2 TALENT
  (211, 21, 1, 'Headliners',                'Top-of-bill talent'),
  (212, 21, 2, 'Support Acts',              'Support / undercard'),
  (251, 25, 1, 'Technical Riders',          'Backline, monitor, FOH requirements'),
  (252, 25, 2, 'Hospitality Riders',        'Green-room, food, beverage'),
  -- 3 MARKETING
  (321, 32, 1, 'Social Posts',              'Per-platform posts'),
  (351, 35, 1, 'Sponsorship Pipeline',      'Live sponsor opportunities'),
  -- 4 BUILD
  (411, 41, 1, 'Stages',                    'Stage units (main, B-stage, satellite)'),
  (412, 41, 2, 'Decking',                   'Modular decking, risers, platforms'),
  (413, 41, 3, 'Modular Decks',             '4×8 modular decking inventory'),
  (421, 42, 1, 'Scenic Walls',              'Walls, flats, finished surfaces'),
  (431, 43, 1, 'Site Plan',                 'Site plan, footprint, zone definition'),
  (461, 46, 1, 'Identity Signage',          'Identity / placemaking signs (USCS)'),
  (462, 46, 2, 'Directional Signage',       'Directional wayfinding (USCS)'),
  (463, 46, 3, 'Regulatory Signage',        'Regulatory / safety signage (USCS)'),
  -- 5 PRODUCTION
  (511, 51, 1, 'Lighting Personnel',        'Lighting designer, programmer, ME'),
  (521, 52, 1, 'Video Personnel',           'Video director, technical director, V1/V2'),
  (531, 53, 1, 'Audio Personnel',           'FOH, monitor, system tech, A2'),
  (532, 53, 2, 'PA & Loudspeakers',         'Mains, subs, fills, monitor wedges'),
  (533, 53, 3, 'Mixing & Outboard',         'Consoles, racks, processing'),
  (541, 54, 1, 'Rigging Personnel',         'Riggers, ETCP, motor techs'),
  (551, 55, 1, 'Generators',                'Diesel, hybrid, mains tie-in'),
  (561, 56, 1, 'Pyro & SFX',                'Pyro tech, SFX operator'),
  -- 6 OPERATIONS
  (611, 61, 1, 'Event Operations Desk',     'EOD, TOC, command'),
  (621, 62, 1, 'Hospitality Crew',          'Bar, F&B, hospitality labor'),
  (622, 62, 2, 'Stagehands',                'Stagehands, loaders'),
  (623, 62, 3, 'Production Assistants',     'PAs, runners'),
  (631, 63, 1, 'ETCP Certifications',       'ETCP rigger / arena / theatre'),
  (632, 63, 2, 'OSHA Certifications',       'OSHA 10/30, fall protection'),
  (641, 64, 1, 'Freight & Drayage',         'Freight providers, drayage units'),
  (651, 65, 1, 'Vehicles',                  'Vehicles in dispatch fleet'),
  (661, 66, 1, 'Security Personnel',        'Guards, screeners, escorts'),
  (671, 67, 1, 'Medical Personnel',         'EMT, MD on site'),
  -- 7 EXPERIENCE
  (711, 71, 1, 'Guest Hosts',               'Guest hosts, ushers'),
  (721, 72, 1, 'Brand Activations',         'Brand-led activations'),
  (731, 73, 1, 'Merch Booths',              'Booth fixtures, retail moments'),
  (741, 74, 1, 'Accessibility Services',    'ADA wayfinding, accommodations'),
  -- 8 HOSPITALITY
  (811, 81, 1, 'Crew Catering',             'Crew meals'),
  (821, 82, 1, 'Bars',                      'Public bar units'),
  (831, 83, 1, 'Catering Services',         'Catering vendor service'),
  (841, 84, 1, 'Hotel Blocks',              'Hotel blocks for talent / crew / guests'),
  (851, 85, 1, 'VIP Concierge',             'VIP concierge service'),
  (861, 86, 1, 'Green Rooms',               'Talent green rooms'),
  -- 9 TECHNOLOGY
  (911, 91, 1, 'Wired Network',             'Switches, fiber backbones'),
  (931, 93, 1, 'Wifi Network',              'Wifi access points, captive portal'),
  (941, 94, 1, 'Ticketing',                 'Ticketing platform integration'),
  (942, 94, 2, 'Access Control',            'Gate scanners, badge readers'),
  (951, 95, 1, 'Data Pipelines',            'Telemetry pipelines'),
  (971, 97, 1, 'Digital Signage',           'Powered signage panels'),
  (991, 99, 1, 'AI Agents',                 'In-platform AI agents')
on conflict (code) do nothing;

------------------------------------------------------------------
-- Line items (XYZWW) — canonical position roots and key codes
------------------------------------------------------------------
insert into xtc_codes (code, section_code, line_digit, name, face, is_position_root, description) values
  -- 1 CREATIVE example
  (14300, 143, 0, 'Hero Render Frame',                       'finance', false, 'Approved hero frame as a billable creative deliverable'),
  -- 2 TALENT
  (21100, 211, 0, 'Headliner — Single Set',                  'finance', false, 'Headliner single set engagement'),
  (25100, 251, 0, 'Technical Rider Spec',                    'finance', false, 'Technical rider spec line item'),
  -- 4 BUILD position roots + spec codes
  (41300, 413, 0, 'Modular Deck — 4×8',                      'finance', false, 'Modular deck unit'),
  (46100, 461, 0, 'Identity Sign — Standard',                'finance', false, 'Identity signage standard package'),
  (46200, 462, 0, 'Directional Sign — Standard',             'finance', false, 'Directional signage standard package'),
  (46300, 463, 0, 'Regulatory Sign — Standard',              'finance', false, 'Regulatory signage standard package'),
  -- 5 PRODUCTION position roots
  (51100, 511, 0, 'Lighting Designer',                       'both', true,  'Lighting Designer (LD) — position root'),
  (51110, 511, 1, 'Lighting Designer — Day Rate',            'finance', false, 'LD day rate'),
  (51120, 511, 2, 'Lighting Designer — Overtime',            'finance', false, 'LD overtime rate'),
  (52100, 521, 0, 'Video Director',                          'both', true,  'Video Director — position root'),
  (53100, 531, 0, 'FOH Engineer (Lead)',                     'both', true,  'FOH Engineer (Lead) — canonical worked example'),
  (53110, 531, 1, 'FOH Engineer — Day Rate',                 'finance', false, 'FOH day rate'),
  (53120, 531, 2, 'FOH Engineer — Overtime',                 'finance', false, 'FOH overtime'),
  (53130, 531, 3, 'FOH Engineer — Weekend Premium',          'finance', false, 'FOH weekend premium'),
  (53200, 532, 0, 'Main PA Stack',                           'finance', false, 'Main PA stack inventory unit'),
  (53210, 532, 1, 'Subwoofer Array',                         'finance', false, 'Subwoofer array'),
  (53220, 532, 2, 'Front Fill',                              'finance', false, 'Front fill loudspeaker'),
  (53300, 533, 0, 'Digital Mixing Console — FOH',            'finance', false, 'FOH digital console'),
  (54100, 541, 0, 'Head Rigger (ETCP)',                      'both', true,  'Head Rigger — position root'),
  (54110, 541, 1, 'Rigger — Day Rate',                       'finance', false, 'Rigger day rate'),
  (55100, 551, 0, 'Diesel Generator (large)',                'finance', false, 'Diesel generator (large)'),
  -- 6 OPERATIONS position roots
  (61100, 611, 0, 'Event Operations Director',               'both', true,  'EOD — position root'),
  (62100, 621, 0, 'Bar Back',                                'both', true,  'Bar Back — position root'),
  (62110, 621, 1, 'Bar Back — Day Rate',                     'finance', false, 'Bar Back day rate'),
  (62200, 622, 0, 'Stagehand',                               'both', true,  'Stagehand — position root'),
  (62210, 622, 1, 'Stagehand — Day Rate',                    'finance', false, 'Stagehand day rate'),
  (62220, 622, 2, 'Stagehand — Overtime',                    'finance', false, 'Stagehand overtime'),
  (62300, 623, 0, 'Production Assistant',                    'both', true,  'PA — position root'),
  (63100, 631, 0, 'ETCP Rigger Certification',               'org', false, 'ETCP Rigger credential record'),
  (63200, 632, 0, 'OSHA 30',                                 'org', false, 'OSHA 30 credential record'),
  (65100, 651, 0, 'Cargo Van — Daily',                       'finance', false, 'Cargo van daily rental rate'),
  (66100, 661, 0, 'Security Guard',                          'both', true,  'Security Guard — position root'),
  (67100, 671, 0, 'EMT On-Site',                             'both', true,  'EMT — position root'),
  -- 7 EXPERIENCE
  (71100, 711, 0, 'Guest Host',                              'both', true,  'Guest Host — position root'),
  (72100, 721, 0, 'Activation — Standard',                   'finance', false, 'Brand activation deliverable'),
  -- 8 HOSPITALITY
  (81100, 811, 0, 'Crew Meal — Standard',                    'finance', false, 'Crew meal — standard cost line'),
  (82100, 821, 0, 'Public Bar Unit',                         'finance', false, 'Public bar unit'),
  (83100, 831, 0, 'Catering Service Hour',                   'finance', false, 'Catering service hour'),
  (84100, 841, 0, 'Hotel Room Night',                        'finance', false, 'Hotel room-night posting'),
  -- 9 TECHNOLOGY
  (91100, 911, 0, 'Network Switch',                          'finance', false, 'Network switch deployment'),
  (93100, 931, 0, 'Wifi Access Point',                       'finance', false, 'Wifi AP deployment'),
  (94100, 941, 0, 'Ticketing Platform Setup',                'finance', false, 'Ticketing platform integration setup'),
  (94200, 942, 0, 'Gate Scanner',                            'finance', false, 'Gate scanner unit')
on conflict (code) do nothing;
