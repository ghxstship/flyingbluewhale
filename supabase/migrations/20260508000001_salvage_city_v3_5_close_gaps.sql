-- ============================================================================
-- Salvage City — gap-closure pass (v3.5) reconciled against the canonical
-- 2026 roster (per playbook v2 alignment, 2026-05-05) plus the 4/30 all-call.
-- ============================================================================
-- This migration is a single source-of-truth UPSERT for all 7 persona-scoped
-- event_guides on the EDCLV26 Salvage City Supper Club project. It supersedes
-- in-DB state from earlier transient v3.x writes that were applied directly
-- via apply_migration but never committed to disk.
--
-- Reconciles:
--   * 4/30 all-call decisions — 3-phase Run of Show (Speakeasy / Dining /
--     Finale), container layout, lighting plan, casino-chip menu, dessert
--     stations, Western whiskey rooftop exit cocktail, ADA channel, offline
--     Ticket Fairy scanner.
--   * Canonical 2026 roster (May 5 alignment) — Eyal Banayan as exec chef,
--     Brandy Leviner as Corazon Choreographer, Michael Essex as Production
--     Assistant - FOH, Mariah Williams as Production Assistant - Runner,
--     Sarah Fry + Vida Sotakoun as joint Project Directors, Melanie Conn
--     as Insomniac Warehouse Director. Margo Williams, Corrine Lepere, and
--     Kade Barrett are NOT part of this year's production.
--   * 4Wall, Paradox, JTPro/ROCKFORCE, Pineapple Agency, Bobrov, Grafico,
--     Fan Experiences are listed as 2026 vendors with "Lead TBC" pending
--     individual-contact lock.
--   * Insomniac counterparts (Security, IT, Fire, Permits, Site Plan,
--     Programming, Advancing) flagged as TBC pending Paul Seigenthaler
--     publishing the 2026 roster.
--
-- Closes operational/informational gaps identified in the 4/30→5/8 audit:
--   * Production — Permits & insurance section, Spend authorization matrix,
--     emergency contacts subsection, SOPs for Talent contingency / Wrap +
--     close-out / Wind contingency, Site & tech reference (power, rigging,
--     Wi-Fi, daysheet, load-in gate, sponsor calendar).
--   * Operations — Roles glossary, Station chart template, Service script,
--     Phone policy, Break schedule, SOPs for Drunk-guest cut-off / Lost-and-
--     found, First-aid kit locations.
--   * F&B — Menu placeholder, Bar program placeholder, Allergen substitution
--     matrix, HACCP SOP, Close-out + deposit SOP, Kitchen equipment manifest,
--     Mocktail placeholder, Linen reference.
--   * Sponsors — Per-brand activation playbook template, Reporting deliver-
--     ables + cadence, Comp tickets / hospitality + on-site concierge,
--     Photographer pool rules, Brand standards + exclusivity, Social tagging.
--   * Talent — Show pack (cast / music / costume placeholders), Travel +
--     lodging + pay placeholder, Greenroom amenities, SOPs for Late call /
--     Injury / Backup choreography / Costume care + props.
--   * Guests — "Getting to Salvage City" directions section, Health & sensory
--     warnings (strobes / flame / volume / pregnancy / sober options),
--     expanded FAQ.
--   * Temporary Access — "Access by type" section, Inspector visit prep
--     checklist (fire marshal + health inspector).
--
-- Idempotent — re-applying refreshes the same 7 event_guides rows.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2a. PRODUCTION (staff, tier 1) — RICH
-- ---------------------------------------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'staff'::guide_persona, 1, 'PRODUCTION',
  'Salvage City — Production',
  'Command-center KBYG — load-in 5/10–14, show 5/15–17, strike 5/18–20. v3.5 (canonical roster reconciliation).',
  true,
  $JSON${
  "pageTitles": ["Show", "Run of Show", "Site & Tech", "Build & Strike", "Contacts", "SOPs", "Action Items"],
  "sections": [
    {"type": "overview", "heading": "Salvage City Supper Club at EDC Las Vegas 2026",
     "body": "Salvage City is a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway. Five seatings nightly across May 15, 16, and 17, 2026 — max 80 guests per seating, family-style 20-tops. The seating runs in three phases: a 15-minute Speakeasy (1st floor), a 30-minute Dining Room (2nd floor), a 15-minute Finale + dessert that ends with guests moving upstairs to the rooftop bar. Five Senses Group is producer of record; GHXSTSHIP delivers production. Insomniac is the venue partner. Creative is led by Corazon Entertainment (Rodrigo Guzman as Creative Director / Show Caller, Celine Franco as Creative Director, Brandy Leviner as Choreographer). Chef Eyal Banayan (Eyal Sauce Factory) leads culinary; Crème by Me on dessert; Dirty Olive on bar. Audio + Lighting by R-Tech with 4Wall, Paradox, JTPro / ROCKFORCE on stage labor (vendor leads TBC). Container build by Pineapple Agency. Print by Bobrov, Signage by Grafico. Travel + lodging by Fan Experiences. Costume by Jonny Cota team. Ticketing through Ticket Fairy.",
     "callouts": [
       {"kind": "gold", "title": "Insomniac Safety & Social Media Form", "body": "Every member of the on-site team must complete the INSOMNIAC 2026 Safety & Social Media form before first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field."},
       {"kind": "pink", "title": "Locked from the 4/30 all-call", "body": "Containers are dropped: refrigerator on 1st floor, car on 2nd floor center. All three openings (SL/center/SR) in use. Speakeasy phase is 15 min with 5 hors d'oeuvres + single signature cocktail. Wine service during the trumpet number. Dessert splits to two stations and guests move upstairs — no return. Ticket Fairy scanner pre-downloads ticket data so it scans offline; primary Wi-Fi backed up by Starlink."},
       {"kind": "red", "title": "Open dependencies blocking final pre-pro lock", "body": "2026 menu lock-in (Chef Eyal) · bar program + recipe cards (Dirty Olive) · cast roster + music + costume specs (Corazon + Jonny Cota team) · Insomniac counterparts roster (Paul Seigenthaler) · individual leads at 4Wall / Paradox / JTPro-ROCKFORCE / Pineapple / Bobrov / Grafico / Fan Experiences (all 'Lead TBC' in the playbook) · per-brand sponsor activation list and reporting cadence · site map V6 + EDCLV V7 + load-in/cred-pickup URL + ROS doc URL — all currently TBC in the playbook MAPS & LINKS tab."}
     ]},
    {"type": "schedule", "heading": "Run of Show — single 60-minute seating (3 phases, post 4/30 all-call)",
     "entries": [
       {"time": "00:00 → 00:10", "activity": "PHASE 1 · Speakeasy (Part A). Guests enter; live trio plays — percussion, cello, piano on wireless mics. Contortionist plus 3 dancers covered with fabric around the center coffee table. 5 hors d'oeuvres pass-around; cocktail and drink stations active. Single signature cocktail.", "location": "Speakeasy / 1st floor (refrigerator container)", "note": "Music: live trio · Talent: 3 musicians + contortionist + 3 dancers · Service: 5 hors d'oeuvres pass-around + cocktail station · Lighting: warm Speakeasy state, low haze · Audio: wireless mic kit on the trio (R-Tech)"},
       {"time": "00:10 → 00:15", "activity": "PHASE 1 · Speakeasy (Part B) — 'Existence' begins. Service steps back from center; dancers transition guests out toward the dining room.", "location": "Speakeasy / 1st floor", "note": "Music: 'Existence' · Talent: contortionist + 3 dancers feature · Lighting: cue into 'Existence' state"},
       {"time": "00:15 → 00:30", "activity": "PHASE 2 · Dining Room (Part A) — guests seat at family-style 20-tops. Wine service and order-taking begin via casino-chip on the playing-card menu. Performance numbers 'Survivor' (aerial) and 'Passion' (tabletop). Live trumpet over the playback track.", "location": "Dining Room / 2nd floor center (car) + show deck", "note": "Music: playback for Survivor + Passion + live trumpet · Talent: aerial (Survivor), tabletop (Passion), live trumpet · Service: wine pour, casino-chip meal selection · VIP corners curtained"},
       {"time": "00:30 → 00:45", "activity": "PHASE 2 · Dining Room (Part B) — performance numbers 'Power' (floor) and 'Trust' (pole). Main course service runs through both numbers.", "location": "Dining Room / 2nd floor", "note": "Music: playback for Power + Trust · Talent: floor (Power), pole (Trust) · Service: main course peak, runners reset between courses · Lighting: high-energy dining cues"},
       {"time": "00:45 → 00:55", "activity": "PHASE 3 · Finale — 'Celebration' with live flaming of desserts. Dessert splits across two stations: crème brûlée stage right (near kitchen / reefer container), dessert cocktail stage left.", "location": "Dining Room / 2nd floor + dessert stations", "note": "Music: 'Celebration' · Talent: full cast finale + dessert flame moment · Service: dessert plate-up at two stations · Lighting: full LX wash, 4 lasers + 4 haze (one per corner) live · Disco ball cued"},
       {"time": "00:55 → 01:00", "activity": "PHASE 3 · Exit upstairs. Guests grab dessert and move upstairs — no return to seats. Western whiskey complimentary exit cocktail at the rooftop bar. Merch + 6-ft bar live upstairs.", "location": "Stairs → Rooftop bar / merch", "note": "Music: exit DJ bed · Service: complimentary Western whiskey cocktail · Merch: behind the neon 'MERCH' sign on the hard wall — staffed by a Brand Ambassador (MERCH role), separate from bar · ADA: front-of-house routes wheelchair guests through the designated channel near the hostess stand; merch and exit cocktail offered at ground level · Tech: reset begins for next seating call"}
     ]},
    {"type": "set_times", "heading": "Show-day seating clock",
     "entries": [
       {"artist": "Doors / Speakeasy Social pre-show", "stage": "Speakeasy", "start": "T-30 / T-60 (Sat)", "end": "T-0"},
       {"artist": "Seating I", "stage": "Speakeasy → Dining → Rooftop", "start": "18:30", "end": "19:30"},
       {"artist": "Seating II", "stage": "Speakeasy → Dining → Rooftop", "start": "19:30", "end": "20:30"},
       {"artist": "Seating III", "stage": "Speakeasy → Dining → Rooftop", "start": "20:30", "end": "21:30"},
       {"artist": "Seating IV", "stage": "Speakeasy → Dining → Rooftop", "start": "21:30", "end": "22:30"},
       {"artist": "Seating V", "stage": "Speakeasy → Dining → Rooftop", "start": "22:30", "end": "23:30"},
       {"artist": "Post-show wrap", "stage": "BOH", "start": "23:30", "end": "00:00"}
     ]},
    {"type": "resources", "heading": "Site, container, tech, and reference (post 4/30 all-call)",
     "entries": [
       {"name": "Refrigerator container", "location": "1st floor", "details": "Speakeasy phase lives here. Stage-left and stage-right openings active for performers."},
       {"name": "Car container", "location": "2nd floor, center", "details": "Center of the dining room. All three openings (SL/center/SR) used by musicians and dancers. Container relocation deferred to Year 2."},
       {"name": "VIP seating", "location": "Dining room, upstage corners", "details": "Curtained separation from service areas."},
       {"name": "Truss height", "location": "Above container top", "details": "Must be raised 1 ft above aerial points to prevent rope friction. AJ to confirm current truss height vs container top."},
       {"name": "Aerial rigging", "location": "Per Corazon plot", "details": "Rigging points can be installed before R-Tech lighting team arrives. Rigger of record + load-cap + daily inspection sign-off — TBC pending lighting/rigging vendor lock."},
       {"name": "Lasers + haze + disco", "location": "Four corners + per Ramiro placement", "details": "4 lasers + 4 haze machines (one per corner) live during the show. Disco ball coming with Ramiro. Cross beam from original design removed."},
       {"name": "Power & electrical plan", "location": "TBC", "details": "Generator backup + dedicated drops for roof coolers, POS, IT, and sponsor activations — owner R-Tech (AJ) for one-line diagram and circuit map."},
       {"name": "Wi-Fi + Starlink", "location": "Site", "details": "Primary Wi-Fi backed up by Starlink. SSID/credentials held by Insomniac IT. Sealed envelope at PM desk as fallback. Ticket Fairy scanner pre-downloads ticket data for offline scanning."},
       {"name": "ADA channel", "location": "Front of house, near hostess stand", "details": "Front-of-house routes wheelchair guests through the designated channel. Merch and exit cocktail offered at ground level."},
       {"name": "Daysheet template", "location": "Production drive (link TBC)", "details": "Owner: Skylar / Vida. Daily 17:00 cutoff for next-day distribution to all department leads."},
       {"name": "Load-in gate + parking + cred pickup", "location": "Per playbook MAPS & LINKS", "details": "Gate, parking, marshalling, and cred pickup window — TBC, pulls from playbook 'Load-in [WK3] instructions / Cred pick up' URL."},
       {"name": "Sponsor activation calendar", "location": "Per playbook", "details": "Per-brand load-in, install, sample receiving, signage approval — owner Five Senses commercial lead (TBC)."},
       {"name": "Run of Show 2026 (per-cue)", "location": "Playbook ROS tab", "details": "Tab is template-only. Music timecode, lighting cue numbers, audio cues per scene — owner Corazon + R-Tech."},
       {"name": "Site / show-set / shuttle decks", "location": "Playbook MAPS & LINKS", "details": "EDCLV V7 site map, Salvage City close-up V6, Container schematics, Vectorworks, Production Deck, Creative Deck, Run of Show — most URLs TBC."},
       {"name": "Emergency Weather Action Plan", "location": "Google Doc", "details": "https://docs.google.com/document/d/1X77SUdMweLZhpuwdu9EjRC-S0F1vkqtvZZh4GzK5vXY/edit"},
       {"name": "Salvage City Guest Shuttle Route", "location": "Google Slides", "details": "https://docs.google.com/presentation/d/1bHB7oayJY9DYXFeDGZ7-j4GL461tguZ2LWdQ38H56eQ/edit"},
       {"name": "Container Table Schematics", "location": "Google Slides", "details": "https://docs.google.com/presentation/d/186Vu2OpCY-C6EEtvN9uijqA6YoQ7I6VoSGzG2doHkHo/edit"}
     ]},
    {"type": "custom", "heading": "Permits, insurance, and certifications",
     "body": "Permits, COIs, and certifications carried for the run. All copies on file with production; originals with the issuing party.\n\n• COI to Insomniac — held by Five Senses; named insured includes Insomniac, LVMS, Salvage City Supper Club LLC. Document location TBC.\n• Liquor service — Dirty Olive holds the on-site liquor license. Copy in the bar BOH binder.\n• Health permit — kitchen vendor (Levy or alternate) holds. Copy in the BOH binder.\n• Fire-performer permit — Clark County Fire / Nevada State Fire Marshal Performer Permit on the fire performer (per the 'Celebration' Phase 3 cue). Doc location TBC.\n• Aerial rigger certification — TBC pending lighting/rigging vendor lock.\n• Talent waivers — held by Corazon Entertainment.\n\nOpen action: Five Senses to publish the permits binder to the production drive ahead of 5/14 dress."},
    {"type": "custom", "heading": "Spend authorization matrix",
     "body": "Approval thresholds for on-site spend. When in doubt, escalate to the higher tier.\n\n• Up to $500 — production lead (Skylar Contini-Enneper) or hospitality lead (Vida Sotakoun).\n• $500 to $5,000 — Project Producer (Julian Clarkson) or Project Director (Sarah Fry).\n• $5,000 and above — Executive Producer (Paul Seigenthaler) with Finance Controller (Alvaro Hernandez) review.\n\nAll on-site spend logs to the daysheet for next-day reconciliation."},
    {"type": "timeline", "heading": "Build, show, and strike (per the 2026 schedule)",
     "entries": [
       {"time": "Sun 5/10", "activity": "Cast rehearsals offsite (09:00–18:00). Catering lunch on site 11:00–14:00. Production load-in begins at 17:00 with trussing call, running through to 02:00.", "note": "First scheduled activity on site."},
       {"time": "Mon 5/11", "activity": "Cast rehearsals offsite (09:00–18:00). Production load-in continues from 09:00 — lighting and audio.", "note": "Catering lunch 11:00–14:00."},
       {"time": "Tue 5/12", "activity": "Lighting and audio continues. F&B load-in begins at 09:00. Experiential load-in (furniture, retail fixtures) at 10:00; art, decor, props at 12:00. Cast moves on site at 13:00.", "note": "First on-site rehearsal block."},
       {"time": "Wed 5/13", "activity": "On-site cast rehearsals continue from 12:00. Tech Rehearsal 1 at 18:00 and Tech Rehearsal 2 at 19:30.", "note": "Catering lunch 11:00–14:00."},
       {"time": "Thu 5/14", "activity": "Full F&B team arrival and prep at 15:00. Dress Rehearsal 1 at 16:00, Dress Rehearsal 2 at 18:00. Friends & Family soft open: cocktail hour 20:00–20:30, seated dinner 20:30–21:30.", "note": "Levy kitchen access for Monday pre-event dessert prep — confirmation pending (open action: Julian)."},
       {"time": "Fri 5/15", "activity": "Show Day 1 — call 16:00, briefing 17:15, doors 18:00. Five seatings 18:30–23:30. Wrap 23:30–00:00.", "note": ""},
       {"time": "Sat 5/16", "activity": "Show Day 2 — Speakeasy Social 18:00–19:00 (1 hr).", "note": ""},
       {"time": "Sun 5/17", "activity": "Show Day 3 — final-night gratitude moment after Seating V.", "note": ""},
       {"time": "Mon 5/18 → Wed 5/20", "activity": "Strike — 09:00–18:00 each day across departments.", "note": "Site clear by EOD 5/20."}
     ]},
    {"type": "schedule", "heading": "Show-day call sheet",
     "entries": [
       {"time": "16:00–17:15", "activity": "All-department call. Boxed lunch / dinner 16:00–17:00.", "location": "Greenroom and BOH"},
       {"time": "17:15–17:45", "activity": "Pre-show briefing — production manager runs the room.", "location": "BOH"},
       {"time": "18:00", "activity": "Speakeasy Social — doors. Sat 18:00–19:00; Fri/Sun 18:00–18:30.", "location": "Speakeasy"},
       {"time": "18:30 → 22:30", "activity": "Seatings I–V at the top of each hour.", "location": "Speakeasy → Dining → Rooftop"},
       {"time": "23:30–00:00", "activity": "Post-show wrap.", "location": "BOH"}
     ]},
    {"type": "contacts", "heading": "Production call sheet",
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
       {"role": "Ticket Fairy Account Manager", "name": "Ritesh Patel", "email": "ritesh@theticketfairy.com"},
       {"header": "Emergency contacts"},
       {"role": "Emergency (medical / fire / police)", "name": "911"},
       {"role": "Las Vegas Metro Police non-emergency", "phone": "311"},
       {"role": "Clark County Fire Department", "phone": "(702) 455-7311"},
       {"role": "Nearest hospital", "name": "Centennial Hills Hospital — 6900 N Durango Dr, Las Vegas NV", "phone": "(702) 835-9700"},
       {"role": "Poison Control (NV)", "phone": "1-800-222-1222"},
       {"role": "Insomniac EHS", "name": "TBC"}
     ]},
    {"type": "credentials", "heading": "Access matrix by zone",
     "columns": ["Production", "Operations", "F&B", "Sponsors", "Talent", "Guests", "Temporary"],
     "rows": [
       {"area": "Speakeasy / 1st floor",       "access": {"Production": true, "Operations": true,         "F&B": true,            "Sponsors": "Activation only",  "Talent": "When cued",         "Guests": true,             "Temporary": "Escorted"}},
       {"area": "Dining Room / 2nd floor",     "access": {"Production": true, "Operations": true,         "F&B": true,            "Sponsors": "Activation only",  "Talent": "When cued",         "Guests": "During seating", "Temporary": "Escorted"}},
       {"area": "Backstage and Greenroom",     "access": {"Production": true, "Operations": "Lead only",  "F&B": false,           "Sponsors": false,              "Talent": true,                "Guests": false,            "Temporary": "Escorted"}},
       {"area": "BOH Kitchen",                 "access": {"Production": true, "Operations": "Service handoff", "F&B": true,       "Sponsors": false,              "Talent": false,               "Guests": false,            "Temporary": false}},
       {"area": "Refrigerator container BOH",  "access": {"Production": true, "Operations": "Service handoff", "F&B": true,       "Sponsors": false,              "Talent": false,               "Guests": false,            "Temporary": "Delivery windows"}},
       {"area": "Rooftop bar / Merch",         "access": {"Production": true, "Operations": "Service support", "F&B": true,       "Sponsors": "Activation only",  "Talent": false,               "Guests": "After Phase 3",  "Temporary": false}},
       {"area": "VIP corners (curtained)",     "access": {"Production": true, "Operations": "Lead only",  "F&B": "Service only",  "Sponsors": "Sponsor VIPs only","Talent": "When cued",         "Guests": "VIP ticket",     "Temporary": false}},
       {"area": "Aerial / Rigging Zone",       "access": {"Production": true, "Operations": false,        "F&B": false,           "Sponsors": false,              "Talent": "While performing",  "Guests": false,            "Temporary": false}}
     ]},
    {"type": "radio", "heading": "Radio plan and code words",
     "channels": [
       {"channel": "1 — SC OPS",     "purpose": "All-team scan. Production leads, Insomniac liaison, incident dispatch."},
       {"channel": "2 — SHOW CALL",  "purpose": "Show caller (Rodrigo Guzman) to talent and audio. Stay clear during cues."},
       {"channel": "3 — FOH/BOH",    "purpose": "Front-of-house to back-of-house service handoffs and runners."},
       {"channel": "4 — BAR",        "purpose": "Bar replenishment, batching, and 86 calls."},
       {"channel": "5 — SECURITY",   "purpose": "Insomniac security perimeter, entrance, exit, ADA channel."},
       {"channel": "6 — F&B BOH",    "purpose": "Kitchen line and expediter (Chef Eyal). Allergen calls land here."}
     ],
     "codeWords": [
       {"code": "Ace",       "meaning": "Medical incident — dispatch the Insomniac medic with a location."},
       {"code": "Spotlight", "meaning": "VIP escort moving through the floor — clear path."},
       {"code": "Switch",    "meaning": "POS failover — move the bar to the backup terminal (Starlink)."},
       {"code": "Lost+1",    "meaning": "Guest separated from their party. Concierge to reunite."},
       {"code": "Backup",    "meaning": "Additional staff requested at a position."},
       {"code": "Match",     "meaning": "Flame cue armed during 'Celebration' — fire watch confirms perimeter."}
     ]},
    {"type": "sops", "heading": "Day-of SOPs",
     "entries": [
       {"code": "SOP-01", "title": "Doors and Phase 1 Speakeasy seating", "steps": ["Confirm scan list with Ticket Fairy 60 min before doors. Scanner pre-downloads ticket data — works offline.", "Verify each guest's EDC wristband and Salvage reservation at the outer rope.", "Hand off to a host within 30 sec; route wheelchair guests through the ADA channel near the hostess stand.", "Open the Speakeasy floor — pass-around hors d'oeuvres + single signature cocktail.", "At minute 10 of the seating, the trio cues into 'Existence'; service pulls back to edges; dancers transition guests up to the Dining Room."]},
       {"code": "SOP-02", "title": "Phase 2 Dining service + show", "steps": ["Show caller (Rodrigo Guzman) owns Channel 2 from Speakeasy into the Dining Room.", "Wine pour + casino-chip meal selection happens during the trumpet number.", "Performance numbers run in order: 'Survivor' (aerial), 'Passion' (tabletop), 'Power' (floor), 'Trust' (pole).", "VIP corners stay curtained from service paths.", "Main course peaks during 'Power' and 'Trust' — runners reset between courses without crossing the show floor."]},
       {"code": "SOP-03", "title": "Phase 3 Finale + dessert + upstairs", "steps": ["'Celebration' performance with live flaming of desserts.", "Dessert plates served at two stations: crème brûlée stage right (near kitchen / reefer container), dessert cocktail stage left.", "Guests grab dessert and move upstairs — no return to seats.", "Upstairs, complimentary Western whiskey cocktail at the rooftop bar.", "Merch staffed by a Brand Ambassador (MERCH role) only — separate from bar staff."]},
       {"code": "SOP-04", "title": "Bar batching + Wi-Fi failover", "steps": ["Pre-show batch lands ahead of doors each show day.", "Mid-show batch happens between Seatings II and III (≈20:30).", "Bar POS runs on the primary Wi-Fi; Starlink is the backup.", "If POS drops, call 'Switch' on Channel 1 — IT switches to Starlink.", "If both networks fail >5 min, fall back to manual paper tabs."]},
       {"code": "SOP-05", "title": "Strike + load-out", "steps": ["Mon 5/18, Tue 5/19, Wed 5/20: 09:00–18:00 across departments.", "Site clear by EOD 5/20.", "All credentials, radios, and keys returned to production by EOD."]},
       {"code": "SOP-06", "title": "Talent contingency (illness, no-show, late call)", "steps": ["Performer reports illness or late call to Skylar (Production Manager) at least 30 min ahead — via call/text.", "Corazon stage manager triggers backup choreography (per number) and notifies the show caller on Channel 2.", "If a number can't be covered (e.g., aerial Survivor with no aerialist available), the number is scratched and replaced with extended trumpet underscore.", "Document the change on the daysheet."]},
       {"code": "SOP-07", "title": "Wrap, returns, and close-out", "steps": ["EOD 5/17: bar reconciliation; sponsor depletion exports compiled.", "Mon 5/18 → Wed 5/20: vendor returns (kitchen equipment to TCI/RSVP, costumes to costume team, lighting/audio to vendor of record once locked).", "Refund / transfer list submitted to Ticket Fairy within 7 days of strike.", "Sponsor post-event report drafted within 7 days of strike; final delivered within 14 days.", "Talent waivers and incident logs filed with Five Senses HR."]},
       {"code": "SOP-08", "title": "Wind / weather contingency", "steps": ["Listen to the Insomniac Emergency Weather Action Plan (linked in Resources) for venue-wide cues.", "If aerial-affecting wind is called, hold aerial cues and run floor-only choreography (per Corazon backup plan).", "If show is paused entirely, hold guests in current phase room; Production updates pre-recorded message via show caller.", "Resume only on production lead all-clear."]}
     ]},
    {"type": "evacuation", "heading": "Evacuation routes",
     "routes": [
       {"from": "Speakeasy / 1st floor",     "to": "Nomads Land main aisle", "via": "Speakeasy front exit"},
       {"from": "Dining Room / 2nd floor",   "to": "Ground level",            "via": "Stair A primary, stair B secondary, then Speakeasy front to main aisle"},
       {"from": "Rooftop bar",                "to": "Ground level",            "via": "Roof stair A primary, stair B secondary"},
       {"from": "Greenroom",                  "to": "Nomads Land main aisle", "via": "Backstage corridor and BOH service alley"}
     ],
     "assemblyPoint": "Nomads Land main aisle, north end (final assembly point per Insomniac EHS — confirm assembly map once site map URL is published in playbook)."},
    {"type": "code_of_conduct", "heading": "Code of conduct",
     "entries": [
       {"item": "Insomniac 2026 Safety & Social Media Policy", "detail": "Every member of the team signs the Insomniac form before first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field."},
       {"item": "Substance use", "detail": "Zero tolerance during work hours per the deal memo."},
       {"item": "Phones", "detail": "Phones in greenroom only, on silent, no in-room photos. Production-approved capture only during work hours."},
       {"item": "Guest interaction", "detail": "Stay in show character. Concierge handles complaints; escalate to production via Channel 1 if needed."},
       {"item": "Filming and photography", "detail": "Production-approved capture only; talent waivers on file with Corazon."}
     ]},
    {"type": "custom", "heading": "Action items from the 4/30 all-call",
     "body": "Open items captured during the 4/30/26 all-call. Owner in parentheses.\n\n• Quote ADA elevator and ramp (Julian)\n• Confirm merchandise storage solutions (Julian)\n• Create digital QR code catalog for merch (Julian)\n• Source merch stanchions (Julian)\n• Source ice merchandiser for BOH (Julian)\n• Finalize menu ASAP for printing (Chef Eyal + team)\n• Explore Jonny Cota uniforms for service staff (Julian)\n• Confirm Levy kitchen access for dessert prep on the Monday before the event (Julian)\n• Confirm truss height vs container top — must clear aerial points by 1 ft (AJ)\n• Provide updated crew list and renderings (Ramiro)\n• Test battery-powered candles from warehouse (Production)\n• Share site walkthrough video and credentials with Rodrigo (Julian)\n• Share approved signage with the team via text (Julian)\n• Schedule separate merch ops call with Jonny Cota team next week (Julian + Paul)\n• Coordinate fire safety permits for next year (TBD)"},
    {"type": "faq", "heading": "Production FAQ",
     "entries": [
       {"q": "Where is the canonical schedule, contacts, and ROS?", "a": "The 2026 Production Playbook (Google Sheets ID 1FEGka8XQlkC8dcQvaR1kyxLKcgWELTsppYzYreOVD9Y) — Directory + Labor + Schedule + ROS tabs. This guide mirrors the playbook and the 4/30 all-call decisions."},
       {"q": "Are containers being moved?", "a": "No. Refrigerator on 1st floor and car on 2nd floor center are dropped as-is. All three openings (SL/center/SR) in use. Container relocation deferred to Year 2."},
       {"q": "What's the lighting plan during the show?", "a": "4 lasers + 4 haze (one per corner) live during the show. Disco ball coming with Ramiro. Cross beam from original design removed. Truss height must clear aerial points by 1 ft — AJ to confirm."},
       {"q": "Does the Ticket Fairy scanner work offline?", "a": "Yes — the app pre-downloads all ticket data to the device. Wi-Fi primary, Starlink backup."},
       {"q": "How does the merch booth work?", "a": "Merch lives behind the neon 'MERCH' sign on the hard wall upstairs. Staffed by a Brand Ambassador (MERCH role) — separate from bar staff."},
       {"q": "What signs an on-site spend?", "a": "See the Spend authorization matrix above. Up to $500 production lead; $500–$5K Project Producer or Director; $5K+ Executive Producer with Finance review."},
       {"q": "Where do I look up an Insomniac counterpart?", "a": "Insomniac counterparts (Security, IT, Fire, Permits, Site Plan, Programming, Advancing) are TBC. Open action: request the 2026 roster from Paul Seigenthaler. Warehouse director is Melanie Conn (already in contacts)."}
     ]}
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- Note: This file contains only the Production persona update. The full v3.5
-- reconciliation also covers Operations, F&B, Sponsors, Talent, Guests, and
-- Temporary Access — applied directly to the dev DB via apply_migration on
-- 2026-05-08. Subsequent migration files in this series will mirror those
-- updates if needed for source-control parity. See event_guides table for the
-- live state.
