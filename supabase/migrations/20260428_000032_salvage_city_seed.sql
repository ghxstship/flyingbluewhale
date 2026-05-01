-- flyingbluewhale · EDCLV26 Salvage City Supper Club seed (v3)
-- Project + 7 persona-scoped event_guides for the Boarding Pass KBYG.
-- Idempotent: re-applying refreshes guide content without duplicating the project.
-- v3 sourced from the 2026 ProductionPlaybook_EDCLV26.SC and EDCLV26_SalvageCity_ProductionPlaybook
-- Google Sheets. Lean Black-Coffee-style 4-section structure for guest-facing personas
-- (Guests, Sponsors, Talent, Temporary Access); rich operational structure for internal
-- personas (Production, Operations, F&B). Persona banners override the system defaults
-- with the user-facing labels (PRODUCTION / OPERATIONS / FOOD & BEVERAGE / SPONSORS /
-- TALENT / GUESTS / TEMPORARY ACCESS).

-- 1. Project row -------------------------------------------------------------
insert into projects (
  org_id, slug, name, description, status, start_date, end_date, created_by
)
select
  o.id,
  'edclv26-salvage-city',
  'EDCLV26 Salvage City Supper Club',
  'Salvage City Supper Club at EDC Las Vegas 2026 — a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway. Five seatings nightly, May 15 through 17, 2026, presented by Five Senses Group with GHXSTSHIP as production partner. Creative direction by No Ceilings Entertainment / Corazon Entertainment, food and beverage by Levy with Chef Eyal Banayan, dessert by Crème by Me, bar program by Dirty Olive, technical production by R-Tech, 4Wall, Paradox, and JTPro / ROCKFORCE, container build by The Pineapple Agency, and ticketing through Ticket Fairy.',
  'active',
  date '2026-05-15',
  date '2026-05-17',
  u.id
from orgs o
cross join users u
where o.slug = 'demo' and u.email = 'julian.clarkson@ghxstship.pro'
on conflict (org_id, slug) do nothing;

-- ===========================================================================
-- 2a. PRODUCTION (staff, tier 1) — RICH
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'staff'::guide_persona, 1, 'PRODUCTION',
  'Salvage City — Production',
  'Command-center KBYG covering load-in (May 8–14), three show nights (May 15–17), and strike (May 18–19).',
  true,
  $JSON${
  "pageTitles": ["Show", "Build & Strike", "Contacts", "Safety", "Site"],
  "sections": [
    {
      "type": "overview",
      "heading": "Salvage City Supper Club at EDC Las Vegas 2026",
      "body": "Salvage City is a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway. We run five 60-minute seatings each night across May 15, 16, and 17, 2026, with a maximum of 80 guests per seating served family-style on 20-tops. Five Senses Group is producer of record; GHXSTSHIP delivers production. Insomniac is the venue partner. Creative is led by No Ceilings Entertainment with Corazon Entertainment as performance producer. Food and beverage is led by Chef Eyal Banayan (Eyal Sauce Factory) with Crème by Me on dessert. Dirty Olive runs the bar program. Technical production is split across R-Tech (audio), 4Wall (lighting, decking, FX), Paradox Productions (lighting design), and JTPro / ROCKFORCE (stage labor). The Pineapple Agency handles container build. Ticket Fairy is our ticketing platform.",
      "callouts": [
        {"kind": "red",  "title": "Wind contingency at sustained 25 mph", "body": "Insomniac's standing rule is full shutdown of elevated and aerial elements at sustained 25 mph wind. The 'Wind 25' code on Channel 1 triggers roof closure, replaces aerial cues with floor-only choreography, and pauses the fire-act cue. Reference the Emergency Weather Action Plan linked in the production playbook."},
        {"kind": "gold", "title": "Insomniac Safety & Social Media Form", "body": "Every member of the on-site team — production, talent, F&B, bar, vendors — must complete the INSOMNIAC 2026 Safety & Social Media form before first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field. The form link is in the playbook MAPS & LINKS sheet."},
        {"kind": "pink", "title": "One source of truth", "body": "The 2026 Production Playbook is the canonical reference for contacts, schedule, run of show, maps, credentials, radio assignments, and permits. This guide mirrors the playbook — when in doubt, the playbook wins."}
      ]
    },
    {
      "type": "timeline",
      "heading": "Build, show, and strike",
      "entries": [
        {"time": "Sun 5/10", "activity": "Cast rehearsals continue offsite at The ROCK Center for Dance (09:00–18:00). Production load-in begins on site at 17:00 with trussing call.", "note": "Trussing through the night to 02:00."},
        {"time": "Mon 5/11", "activity": "Cast rehearsals offsite (09:00–18:00). Lighting and audio load-in begins at 09:00 — 4Wall fixture install, R-Tech audio rig.", "note": "Catering lunch on site 11:00–14:00."},
        {"time": "Tue 5/12", "activity": "Lighting and audio continues. F&B load-in begins at 09:00. Experiential load-in (furniture, retail fixtures) at 10:00; art, decor, and props at 12:00. Cast moves on site at 13:00.", "note": "First on-site rehearsal block."},
        {"time": "Wed 5/13", "activity": "On-site cast rehearsals continue. Tech Rehearsal 1 at 18:00 and Tech Rehearsal 2 at 19:30 — full cue review.", "note": "All departments hot for first integrated run."},
        {"time": "Thu 5/14", "activity": "Full F&B team arrival and prep at 15:00. Dress Rehearsal 1 at 16:00, Dress Rehearsal 2 at 18:00. Friends & Family soft open: cocktail hour at 20:00, seated dinner at 20:30.", "note": "Soft-open feedback rolls into Day 1 cues."},
        {"time": "Fri 5/15", "activity": "Show Day 1 — call at 16:00, pre-show briefing 17:15, doors 18:00. Five seatings between 18:30 and 23:30. Wrap 23:30–00:00.", "note": "First public night."},
        {"time": "Sat 5/16", "activity": "Show Day 2 — same call cadence. Speakeasy Social extended (18:00–19:00). Five seatings; Saturday rolls into the after-party (end time per venue).", "note": "Saturday is our peak night."},
        {"time": "Sun 5/17", "activity": "Show Day 3 — final-night gratitude moment after the closing seating.", "note": "Last public service of the run."},
        {"time": "Mon 5/18", "activity": "Strike Day 1 — F&B, bar, decor, lighting, and audio load out concurrently from 09:00.", "note": "Container BOH cleared first."},
        {"time": "Tue 5/19", "activity": "Strike Day 2 — trussing and containers out. Site is clear by end of day.", "note": "All credentials returned to production."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Show-day call sheet",
      "entries": [
        {"time": "16:00", "activity": "All-department call. Boxed lunch / dinner available in the greenroom.", "location": "Greenroom and BOH"},
        {"time": "17:15", "activity": "Pre-show briefing — production manager runs the room, includes show caller, F&B leads, bar leads, security liaison.", "location": "BOH"},
        {"time": "17:45", "activity": "Departments to position. Last bar batch top-off, last BOH allergen brief.", "location": "All zones"},
        {"time": "18:00", "activity": "Salvage City Speakeasy Social — doors open, welcome cocktails poured.", "location": "Public Dining"},
        {"time": "18:30", "activity": "Seating I begins (60 minutes).", "location": "Public Dining"},
        {"time": "19:30", "activity": "Seating II begins. Mid-show bar batch staged between Seatings II and III.", "location": "Public Dining"},
        {"time": "20:30", "activity": "Seating III begins.", "location": "Public Dining"},
        {"time": "21:30", "activity": "Seating IV begins.", "location": "Public Dining"},
        {"time": "22:30", "activity": "Seating V begins.", "location": "Public Dining"},
        {"time": "23:30", "activity": "Post-show wrap — debrief, daysheet, BOH and bar reset for next day.", "location": "BOH"}
      ]
    },
    {
      "type": "set_times",
      "heading": "Show beats per seating (60-minute runtime)",
      "entries": [
        {"artist": "Pre-show ambience and Speakeasy Social", "stage": "Public Dining", "start": "T-30", "end": "T-0"},
        {"artist": "Scene 1a — Sweatbox prelude", "stage": "Main Stage / Aerial", "start": "00:00", "end": "00:02"},
        {"artist": "Scene 1b — Opening intro on '1975'", "stage": "Main Stage", "start": "00:02", "end": "00:05"},
        {"artist": "Scene 1c — Full-cast opening", "stage": "Main Stage and roving", "start": "00:05", "end": "00:09"},
        {"artist": "Scene 2 — Host script", "stage": "Main Stage and floor", "start": "00:09", "end": "00:13"},
        {"artist": "Scene 3a — Godspeed (live vocal)", "stage": "Main Stage", "start": "00:13", "end": "00:17"},
        {"artist": "Scene 3b — Hypnosis mash on Sean Paul remix", "stage": "Main Stage and floor", "start": "00:17", "end": "00:23"},
        {"artist": "Mid-show roving acts during main course", "stage": "Public Dining floor and Roof", "start": "00:23", "end": "00:33"},
        {"artist": "Fire-act transition (Match cue armed)", "stage": "Stage front fire-safe perimeter", "start": "00:33", "end": "00:38"},
        {"artist": "Final number — full cast", "stage": "Main Stage", "start": "00:38", "end": "00:50"},
        {"artist": "Dessert plate-up and house-out", "stage": "Public Dining", "start": "00:50", "end": "01:00"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Production call sheet",
      "entries": [
        {"header": "Five Senses Group — Producer of Record"},
        {"role": "Executive Producer", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com", "phone": "(856) 373-6541"},
        {"role": "Operations Director", "name": "Julian Clarkson", "email": "julian@five-senses.co", "phone": "(407) 885-6011"},
        {"role": "Production Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
        {"role": "Production Manager — F&B", "name": "Kade Barrett", "email": "Kadebarrett808@icloud.com", "phone": "(443) 735-887"},
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
        {"role": "Production Manager", "name": "Corrine Lepere", "email": "Corrinelepere@gmail.com", "phone": "(845) 406-0261"},
        {"role": "Hospitality Manager", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
        {"role": "Credentials, Travel & Logistics", "name": "Margo Williams", "email": "margo@five-senses.co", "phone": "(619) 302-7039"},
        {"role": "Finance Controller", "name": "Alvaro Hernandez"},
        {"header": "GHXSTSHIP — Production Crew"},
        {"role": "Production Crew (Heavy Equipment)", "name": "Brett Mosher"},
        {"role": "Production Crew (Skilled Carpentry / AV)", "name": "Adam Waddle"},
        {"role": "Production Crew (Skilled Carpentry / AV)", "name": "Josh Parra"},
        {"role": "Production Assistant / Driver", "name": "Mariah Williams"},
        {"role": "Project Coordinator (Remote)", "name": "Amy Reed"},
        {"header": "Stage Production"},
        {"role": "R-Tech Audio Director", "name": "Ramiro Valenzuela", "email": "ramiro@rtechproductions.com", "phone": "(619) 454-1722"},
        {"role": "R-Tech Technical Director", "name": "Andrew (AJ) Jacobson", "email": "aj@rtechproductions.com", "phone": "(619) 410-5889"},
        {"role": "4Wall Lighting / Decking / FX"},
        {"role": "Paradox Productions Lighting Design"},
        {"role": "JTPro / ROCKFORCE Stage Labor"},
        {"header": "Creative — No Ceilings Entertainment & Corazon Entertainment"},
        {"role": "Corazon Lead", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.com"},
        {"role": "Corazon Coordinator", "name": "Celine Franco", "email": "info@corazonentertainment.com"},
        {"role": "Corazon Producer", "name": "Brandy"},
        {"header": "Food & Beverage — Levy + Chef Eyal Banayan"},
        {"role": "Executive Chef / Culinary Lead", "name": "Eyal Banayan (Eyal Sauce Factory)", "email": "Chefbanayan@gmail.com", "phone": "(310) 666-5451"},
        {"role": "Tendiez Lead (BOH 10)", "name": "Robert Anderson", "email": "robander765@gmail.com", "phone": "(702) 596-4344"},
        {"role": "FOH 01 (Salvage)", "name": "Jon Long", "email": "jonathanlong65@icloud.com", "phone": "(310) 880-8344"},
        {"header": "Dessert — Crème by Me"},
        {"role": "Dessert Chef", "name": "Matthew Effendy", "email": "meffendy@cremebyme.com"},
        {"role": "Dessert Chef", "name": "Ariana Genilla", "email": "agenilla@cremebyme.com"},
        {"header": "Bar Operations — Dirty Olive"},
        {"role": "Bar Operations Manager", "name": "Madeleine (Maddie) Bruner", "email": "madeleinebruner@gmail.com", "phone": "(702) 540-6383"},
        {"role": "Bar Operations Manager", "name": "Brittany Ashton", "email": "bashton_00@yahoo.com", "phone": "(702) 622-5650"},
        {"role": "Bar Operations Manager", "name": "Alex Bruner", "email": "abru3@yahoo.com", "phone": "(702) 575-1223"},
        {"role": "Bar Operations Manager", "name": "Dave Severino", "email": "davidmseverino@gmail.com", "phone": "(702) 819-0558"},
        {"role": "BOH Lead Barback", "name": "Cliff Cabral", "email": "cabral541@yahoo.com", "phone": "(702) 964-9215"},
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
        {"role": "Insomniac Security", "name": "Lead TBC"},
        {"role": "Insomniac IT", "name": "Lead TBC"},
        {"role": "Insomniac Fire Marshal Liaison", "name": "Lead TBC"},
        {"role": "Insomniac Permits", "name": "Lead TBC"},
        {"role": "Insomniac Warehouse", "name": "Lead TBC"},
        {"role": "Insomniac Site Plan", "name": "Lead TBC"},
        {"role": "Insomniac Programming", "name": "Lead TBC"},
        {"role": "Insomniac Advancing", "name": "Lead TBC"},
        {"header": "Travel & Lodging · Ticketing"},
        {"role": "Travel and Lodging — Fan Experiences", "name": "Lead TBC"},
        {"role": "Ticket Fairy Account Manager", "name": "Ritesh Patel", "email": "ritesh@theticketfairy.com"}
      ]
    },
    {
      "type": "credentials",
      "heading": "Access matrix by zone",
      "columns": ["Production", "Operations", "F&B", "Sponsors", "Talent", "Guests", "Temporary"],
      "rows": [
        {"area": "Public Dining (during seating)", "access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": "Activation windows", "Talent": "When cued", "Guests": true, "Temporary": "Escorted"}},
        {"area": "Main Stage", "access": {"Production": true, "Operations": "Reset only", "F&B": "Service only", "Sponsors": false, "Talent": true, "Guests": false, "Temporary": false}},
        {"area": "Backstage and Greenroom", "access": {"Production": true, "Operations": "Lead only", "F&B": false, "Sponsors": false, "Talent": true, "Guests": false, "Temporary": "Escorted"}},
        {"area": "BOH Kitchen", "access": {"Production": true, "Operations": "Service handoff", "F&B": true, "Sponsors": false, "Talent": false, "Guests": false, "Temporary": false}},
        {"area": "Bar (Main + Roof)", "access": {"Production": true, "Operations": "Runner support", "F&B": true, "Sponsors": "Activation only", "Talent": false, "Guests": "Service-side only", "Temporary": false}},
        {"area": "Container BOH (Storage)", "access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": false, "Talent": false, "Guests": false, "Temporary": "Delivery windows"}},
        {"area": "Roof Deck", "access": {"Production": true, "Operations": "Service only", "F&B": "Service only", "Sponsors": "VIP windows", "Talent": "When cued", "Guests": "When cued", "Temporary": false}},
        {"area": "Aerial / Rigging Zone", "access": {"Production": true, "Operations": false, "F&B": false, "Sponsors": false, "Talent": "While performing", "Guests": false, "Temporary": false}},
        {"area": "Tunnel / Marshalling", "access": {"Production": true, "Operations": true, "F&B": "Load times", "Sponsors": false, "Talent": "At call only", "Guests": false, "Temporary": "Escorted"}}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio plan and code words",
      "channels": [
        {"channel": "1 — SC OPS", "purpose": "All-team scan. Production leads, Insomniac liaison, incident dispatch."},
        {"channel": "2 — SHOW CALL", "purpose": "Show caller to talent, lighting, and audio. Stay clear during cues."},
        {"channel": "3 — FOH/BOH", "purpose": "Front-of-house to back-of-house service handoffs and runners."},
        {"channel": "4 — BAR", "purpose": "Bar replenishment, batching, and 86 calls."},
        {"channel": "5 — SECURITY", "purpose": "Insomniac security perimeter, entrance, and exit control."},
        {"channel": "6 — F&B BOH", "purpose": "Chef Eyal's kitchen line and expediter. Allergen calls land here."}
      ],
      "codeWords": [
        {"code": "Ace", "meaning": "Medical incident — dispatch the Insomniac medic with a location."},
        {"code": "Spotlight", "meaning": "VIP escort moving through the floor — clear path."},
        {"code": "Switch", "meaning": "POS failover — move the bar to the backup terminal."},
        {"code": "Wind 25", "meaning": "Sustained 25 mph wind. Roof closes, aerial cues replaced with floor choreography, fire cue paused."},
        {"code": "Match", "meaning": "Fire cue armed and ready — fire watch confirms perimeter."},
        {"code": "Lost+1", "meaning": "Guest separated from their party. Concierge to reunite."},
        {"code": "Backup", "meaning": "Additional staff requested at a position."}
      ]
    },
    {
      "type": "sops",
      "heading": "Day-of standard operating procedures",
      "entries": [
        {"code": "SOP-01", "title": "Doors and seating",                "steps": ["Confirm the scan list with Ticket Fairy 60 minutes before doors.", "Verify each guest's EDC wristband and Salvage reservation at the outer rope.", "Hand off to a host within 30 seconds of greeting; host seats family-style on assigned 20-tops.", "Seat all guests no later than the start of Scene 1a — late arrivals forfeit the opening course (room locks at scene 1a).", "Server takes allergens and dietary needs at the table before opening course; relays via Channel 6 to BOH."]},
        {"code": "SOP-02", "title": "Show-call handoff",                "steps": ["Show caller owns Channel 2 from Scene 0 through bows.", "Pre-show preset confirmation: aerial point, sweatbox cube, LED fans, sphere, fire perimeter.", "Hold all cues for the music timecode start.", "Lighting follows the ROS document — Paradox primary, 4Wall secondary.", "After bows, hand off to FOH for dessert plate-up on Channel 3."]},
        {"code": "SOP-03", "title": "Wind contingency at 25 mph",      "steps": ["Listen for 'Wind 25' on Channel 1 from production lead or Insomniac.", "Suspend rooftop bar service and retrieve guests under cover.", "Hold all aerial cues — performers fall back to the floor-only choreography.", "Pause the fire-act cue if it is in the next 10 minutes.", "Resume only on the production lead's all-clear."]},
        {"code": "SOP-04", "title": "Fire-performer protocol",         "steps": ["Performer holds a current Clark County Fire / Nevada State Fire Marshal Performer Permit.", "Clear and fly-check the 20-foot perimeter before doors each night.", "Pre-show fuel test in BOH per Insomniac fire safety; log on the daysheet.", "Stage fire watch with extinguisher in ready position for every show.", "Cue 'Match' on Channel 1 to arm — abort the cue if the perimeter is breached."]},
        {"code": "SOP-05", "title": "Bar batching three times daily",   "steps": ["Pre-show batch lands at 13:00 each show day.", "Mid-show batch happens between Seatings II and III (≈20:30).", "After-party batch (Saturday only) tops the roof for post-Seating V extended service.", "Roof coolers run on a dedicated power drop — confirm with 4Wall before doors.", "Glassware loss tracked nightly; replacement budget line carries into 2026."]},
        {"code": "SOP-06", "title": "POS and Wi-Fi failover",           "steps": ["Bar POS runs on the primary network.", "If POS drops, call 'Switch' on Channel 1 — IT switches to the backup network.", "If both networks fail for more than five minutes, fall back to manual paper tabs.", "Document any outage on the daysheet for sponsor reconciliation."]},
        {"code": "SOP-07", "title": "Strike and load-out",              "steps": ["Mon May 18: F&B, bar, decor, lighting, and audio load out concurrently from 09:00.", "Tue May 19: trussing and containers out.", "Coordinate Insomniac warehouse pallet returns with the warehouse lead ahead of time.", "All credentials, radios, and keys returned to production by end of day on May 19."]}
      ]
    },
    {
      "type": "resources",
      "heading": "Site resources and reference points",
      "entries": [
        {"name": "Emergency Weather Action Plan", "location": "Google Doc", "details": "https://docs.google.com/document/d/1X77SUdMweLZhpuwdu9EjRC-S0F1vkqtvZZh4GzK5vXY/edit"},
        {"name": "Salvage City Guest Shuttle Route", "location": "Google Slides", "details": "https://docs.google.com/presentation/d/1bHB7oayJY9DYXFeDGZ7-j4GL461tguZ2LWdQ38H56eQ/edit"},
        {"name": "Container Table Schematics", "location": "Google Slides", "details": "https://docs.google.com/presentation/d/186Vu2OpCY-C6EEtvN9uijqA6YoQ7I6VoSGzG2doHkHo/edit"},
        {"name": "Insomniac Safety & Social Media Form", "location": "Google Form", "details": "Required for every team member before first call. Department / Vendor: 'Salvage City — No Ceilings'."},
        {"name": "EDC LV V7 site map", "location": "Production Playbook MAPS & LINKS", "details": "URL TBC — confirm in playbook before Day 1."},
        {"name": "Salvage City close-up map V6", "location": "Production Playbook MAPS & LINKS", "details": "URL TBC — confirm in playbook before Day 1."},
        {"name": "Run of Show 2026", "location": "Production Playbook MAPS & LINKS", "details": "URL TBC — current cue sheet carries forward from 2025."},
        {"name": "Fire extinguishers", "location": "BOH (×2), Bar (×2), Container (×1), Roof (×1)", "details": "Inspect before doors every show day."},
        {"name": "Aerial point", "location": "Position 3", "details": "Hoop and lyra rigged from a standard motor — manual cue, not time-coded."},
        {"name": "Sweatbox cube", "location": "Center dancefloor at position 2", "details": "8 ft × 8 ft, 2-inch poles."}
      ]
    },
    {
      "type": "evacuation",
      "heading": "Evacuation routes",
      "routes": [
        {"from": "Public Dining floor", "to": "Nomads Land main aisle", "via": "Speakeasy front (south doors)"},
        {"from": "Main Stage and BOH",  "to": "Nomads Land main aisle", "via": "Stage-left fire egress and BOH service alley"},
        {"from": "Roof Deck",           "to": "Ground level",            "via": "Roof stair A primary, stair B secondary"},
        {"from": "Greenroom",           "to": "Nomads Land main aisle", "via": "Backstage corridor and BOH service alley"}
      ],
      "assemblyPoint": "Nomads Land main aisle, north end (final assembly point per Insomniac EHS — see EDCLV V7 site map)."
    },
    {
      "type": "fire_safety",
      "heading": "Fire safety inventory",
      "entries": [
        {"item": "ABC extinguishers", "location": "BOH (×2), bar (×2), container (×1), roof (×1)", "note": "Inspected before doors every show day."},
        {"item": "Kitchen Ansul system", "location": "Hot line", "note": "Maintained by Levy; verify armed before every service."},
        {"item": "Fire watch during the show", "location": "Within 20 feet of the fire-performer cue", "note": "Required by Insomniac fire safety throughout the cue window."},
        {"item": "Fire-performer permit", "location": "On file with Insomniac Fire Marshal liaison", "note": "Clark County / Nevada State Fire Marshal Performer Permit required."},
        {"item": "Fire blanket", "location": "Stage-side and BOH", "note": ""}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility provisions",
      "entries": [
        {"item": "Wheelchair access", "detail": "Guests use the main festival ADA path; the host coordinates seating on arrival."},
        {"item": "ADA seating", "detail": "Reserve table-end positions on the family-style 20-tops for guests using mobility devices."},
        {"item": "Allergens", "detail": "Server takes allergens and dietary needs at the table before opening course; kitchen accommodates with local ingredients."},
        {"item": "Under-21 service", "detail": "Soft drinks and non-alcoholic beverages only; wristband marker required at the bar."},
        {"item": "Quiet exit", "detail": "Tunnel BOH egress is available for guests who need a low-stimulation path out."}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability commitments",
      "entries": [
        {"item": "Glassware and dinnerware reuse", "detail": "Tracked nightly; replacement budget line carries 2025 → 2026 to absorb breakage."},
        {"item": "Composting", "detail": "BOH organics flow into the Insomniac sustainability program."},
        {"item": "Single-use reduction", "detail": "Reusable plate-ware used wherever the show ROS allows."},
        {"item": "Insomniac sustainability", "detail": "Salvage participates in the venue-wide sustainability program."}
      ]
    },
    {
      "type": "code_of_conduct",
      "heading": "Code of conduct",
      "entries": [
        {"item": "Insomniac 2026 Safety & Social Media Policy", "detail": "Every member of the Salvage team signs the Insomniac form before first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field."},
        {"item": "Substance use", "detail": "Zero tolerance during work hours per the deal memo — violations result in immediate termination."},
        {"item": "Guest interaction", "detail": "Stay in show character. Concierge handles complaints; escalate to production via Channel 1 if needed."},
        {"item": "Filming and photography", "detail": "Production-approved capture only; talent waivers on file with Corazon."}
      ]
    },
    {
      "type": "faq",
      "heading": "Production FAQ",
      "entries": [
        {"q": "Where is the canonical schedule, contacts, and ROS?", "a": "The 2026 Production Playbook in Google Drive — single source of truth. This guide mirrors the playbook."},
        {"q": "Who is producer of record?", "a": "Five Senses Group, with GHXSTSHIP delivering production."},
        {"q": "Where do credentials, meals, parking, and radios advance?", "a": "Through Margo Williams (Five Senses, margo@five-senses.co)."},
        {"q": "What's our wind-contingency threshold?", "a": "Sustained 25 mph triggers SOP-03 — see the SOPs section."},
        {"q": "What's required for the fire performer?", "a": "A current Clark County / Nevada State Fire Marshal Performer Permit, a 20-foot perimeter, and a pre-show fuel test — see SOP-04."},
        {"q": "Where is the Insomniac safety form?", "a": "Linked in the Production Playbook MAPS & LINKS sheet. Use 'Salvage City — No Ceilings' in the Department / Vendor field."}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2b. OPERATIONS (crew, tier 2) — RICH
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'crew'::guide_persona, 2, 'OPERATIONS',
  'Salvage City — Operations',
  'Day-of crew KBYG for production assistants, hospitality leads, and runners.',
  true,
  $JSON${
  "pageTitles": ["Run of Day", "Contacts", "Safety"],
  "sections": [
    {
      "type": "overview",
      "heading": "Operations brief",
      "body": "This guide is for the day-of operations crew running the Salvage City floor: production assistants, hospitality leads, and runners who keep five 60-minute seatings on time across May 15, 16, and 17 inside Nomads Land. You report to Production Manager Skylar Contini-Enneper (or Corrine Lepere on alternate days), with Hospitality Manager Vida Sotakoun owning floor flow and Production Director Sarah Fry escalation. Five Senses is producer of record; GHXSTSHIP delivers production.",
      "callouts": [
        {"kind": "gold", "title": "Stay on the right radio channel", "body": "Channel 1 (SC OPS) is your home channel — keep it on for the full shift. Use Channel 3 (FOH/BOH) for hospitality handoffs and Channel 4 (BAR) only if you're running for the bar. Stay off Channel 2 (Show Call) unless you are specifically cued in."},
        {"kind": "red",  "title": "If you see something, say something", "body": "For a medical incident, call 'Ace' on Channel 1 with the guest's location. For a lost guest, escort them to the host stand — never leave them unattended. If you hear leadership call 'Wind 25' for a wind hold, relay it to anyone within earshot."}
      ]
    },
    {
      "type": "timeline",
      "heading": "Build days, show days, and strike",
      "entries": [
        {"time": "Tue 5/12 — Thu 5/14", "activity": "Build days. Closed-toe footwear required all days; high-vis vests during build only.", "note": "PAs assist Pineapple Agency and 4Wall as directed."},
        {"time": "Thu 5/14", "activity": "Talent on site; runners begin shifts. Friends & Family soft open at 20:00.", "note": ""},
        {"time": "Fri 5/15 — Sun 5/17", "activity": "Show days — five seatings each night between 18:30 and 23:30.", "note": "Saturday rolls into the after-party."},
        {"time": "Mon 5/18 — Tue 5/19", "activity": "Strike days — assist with returns, credential turn-in, and load-out.", "note": ""}
      ]
    },
    {
      "type": "schedule",
      "heading": "Show-day call",
      "entries": [
        {"time": "16:00", "activity": "Crew call — radio check, credentials check, assignments. Boxed lunch / dinner in greenroom.", "location": "BOH and Greenroom"},
        {"time": "16:30", "activity": "Floor reset and seating prep — wipe tables, set 20-tops, place menus.", "location": "Public Dining"},
        {"time": "17:15", "activity": "Pre-show briefing — production manager runs the room.", "location": "BOH"},
        {"time": "17:45", "activity": "Departments to position. Final walk of the floor.", "location": "All zones"},
        {"time": "18:00", "activity": "Doors — Salvage City Speakeasy Social. PAs hold the rope, runners deploy.", "location": "Front rope"},
        {"time": "18:30 / 19:30 / 20:30 / 21:30 / 22:30", "activity": "Seatings I–V, 60 minutes each. Cycle: greet, escort, seat, run service, exit.", "location": "Public Dining"},
        {"time": "23:30", "activity": "Post-show wrap — reset, debrief, daysheet handoff.", "location": "BOH"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Lead points of contact",
      "entries": [
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
        {"role": "Production Manager", "name": "Corrine Lepere", "email": "Corrinelepere@gmail.com", "phone": "(845) 406-0261"},
        {"role": "Production Director (escalation)", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
        {"role": "Hospitality Manager", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
        {"role": "Operations Director (final escalation)", "name": "Julian Clarkson", "email": "julian@five-senses.co", "phone": "(407) 885-6011"},
        {"role": "F&B Lead", "name": "Kade Barrett", "email": "Kadebarrett808@icloud.com", "phone": "(443) 735-887"},
        {"role": "Bar Operations Manager", "name": "Madeleine Bruner", "email": "madeleinebruner@gmail.com", "phone": "(702) 540-6383"},
        {"role": "Insomniac Production Counterpart", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com", "phone": "(856) 373-6541"}
      ]
    },
    {
      "type": "credentials",
      "heading": "Where you can go",
      "columns": ["Crew"],
      "rows": [
        {"area": "Public Dining floor", "access": {"Crew": true}},
        {"area": "Backstage and Greenroom", "access": {"Crew": "Lead only"}},
        {"area": "BOH Kitchen", "access": {"Crew": "Service handoff only"}},
        {"area": "Main Stage", "access": {"Crew": "Reset windows only — never during the show"}},
        {"area": "Roof Deck", "access": {"Crew": "Service only"}},
        {"area": "Aerial Zone", "access": {"Crew": false}}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio channels",
      "channels": [
        {"channel": "1 — SC OPS", "purpose": "Your home channel — keep it on for the full shift."},
        {"channel": "3 — FOH/BOH", "purpose": "Hospitality and service handoffs between front-of-house and back-of-house."},
        {"channel": "5 — SECURITY", "purpose": "Listen-only unless you need to escalate to Insomniac security."}
      ],
      "codeWords": [
        {"code": "Ace", "meaning": "Medical incident — follow up with the guest's location."},
        {"code": "Lost+1", "meaning": "Lost-guest escort needed; meet at your location."},
        {"code": "Spotlight", "meaning": "VIP escort moving across the floor — clear path."}
      ]
    },
    {
      "type": "sops",
      "heading": "Crew standard operating procedures",
      "entries": [
        {"code": "OP-01", "title": "Ingress flow", "steps": ["Greet each guest at the outer rope.", "Verify their EDC wristband and Salvage reservation.", "Hand off to a host within 30 seconds of greeting.", "If the line stalls, call 'Backup' on Channel 1 to surge support."]},
        {"code": "OP-02", "title": "Dinner-service handoff", "steps": ["Course-out cues come from the show caller on Channel 2.", "FOH leads relay course on Channel 3 to runners.", "Runners reset tables between courses without crossing the show floor.", "Last-call dessert at T-5 — the close beat holds for it."]},
        {"code": "OP-03", "title": "Bar replenishment runs", "steps": ["Bartender calls 'Refill' on Channel 4 when stock is low.", "A runner fetches the order from the BOH cooler.", "Track depletions on the nightly inventory sheet — sponsor brands are tracked per SKU."]},
        {"code": "OP-04", "title": "Lost guest", "steps": ["Walk the guest to the host stand calmly.", "Host re-confirms seating against the manifest.", "Never leave the guest unescorted — wait until the host has them."]},
        {"code": "OP-05", "title": "Medical or incident handoff", "steps": ["Call 'Ace' on Channel 1 with the guest's exact location.", "Stay with the guest until a medic arrives.", "Production logs the incident — do not post about it on social or with personal devices."]}
      ]
    },
    {
      "type": "ppe",
      "heading": "Personal protective equipment",
      "entries": [
        {"item": "Closed-toe footwear", "required": true, "note": "Required all days, all zones."},
        {"item": "High-visibility vest", "required": true, "note": "Required during build days only (Tuesday – Thursday)."},
        {"item": "Work gloves", "required": false, "note": "Recommended for prop builds and scenic loads."},
        {"item": "Hearing protection", "required": false, "note": "Recommended near the stage during sound check."}
      ]
    },
    {
      "type": "evacuation",
      "heading": "Evacuation routes",
      "routes": [
        {"from": "Public Dining floor", "to": "Nomads Land main aisle", "via": "Speakeasy front"},
        {"from": "BOH",                 "to": "Nomads Land main aisle", "via": "BOH service alley"}
      ],
      "assemblyPoint": "Nomads Land main aisle, north end."
    },
    {
      "type": "fire_safety",
      "heading": "Fire safety basics",
      "entries": [
        {"item": "Extinguishers", "location": "BOH, bar, container, and roof", "note": "Identify your nearest unit before doors each show."},
        {"item": "If you see fire", "location": "Anywhere on site", "note": "Call 'Match' on Channel 1 with the location and step back — do not engage the fire yourself."}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "ADA seating", "detail": "Coordinate seating with the host on the guest's arrival."},
        {"item": "Allergens", "detail": "Servers log allergies on arrival and alert the kitchen via Channel 6."},
        {"item": "Quiet exit", "detail": "Use the tunnel BOH path for guests who need a low-stimulation route out."}
      ]
    },
    {
      "type": "faq",
      "heading": "Crew FAQ",
      "entries": [
        {"q": "Where do I check in?", "a": "Report to BOH at 16:00 on show days for radio check and credentials."},
        {"q": "Where do I eat?", "a": "Boxed lunch / dinner in the greenroom from 16:00. Eat before doors — no eating on the floor."},
        {"q": "Can I take photos?", "a": "Production-approved capture only. Do not post on social during work hours."},
        {"q": "What if my radio dies?", "a": "Swap it at the BOH radio cage. Never leave the floor without a working radio."},
        {"q": "Where's the closest restroom?", "a": "Insomniac public restrooms are along the Nomads Land aisle. Crew restrooms are at the BOH."}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2c. FOOD & BEVERAGE (vendor, tier 3) — RICH
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'vendor'::guide_persona, 3, 'FOOD & BEVERAGE',
  'Salvage City — Food & Beverage',
  'Kitchen, bar, and F&B sponsor activations for the BOH and FOH crews.',
  true,
  $JSON${
  "pageTitles": ["Service", "Contacts", "Safety"],
  "sections": [
    {
      "type": "overview",
      "heading": "F&B brief",
      "body": "Salvage City is a 60-minute progressive supper club: amuse-bouche, opening course, main, sides, and dessert, served family-style on 20-tops with a hard cap of 80 guests per seating across five seatings nightly (May 15–17). Levy operates the house F&B with Chef Eyal Banayan (Eyal Sauce Factory) leading culinary, and Crème by Me on dessert. Dirty Olive runs the bar program. Sponsor activations come from White Claw, Skyy, Bacardi (with Mr Black and Tres Generaciones), Hello Soju, and Hiyo — each poured against dedicated SKUs in the Square POS so depletions report cleanly per night.",
      "callouts": [
        {"kind": "gold", "title": "Allergens are intaken on arrival", "body": "Salvage policy is to take allergen and dietary information at the table when guests arrive — before the opening course. The kitchen accommodates with local ingredients. We do not take advance allergy intake; communicate every time, every guest."},
        {"kind": "red",  "title": "Bar batches three times a day", "body": "Pre-show batch lands at 13:00. Mid-show batch happens between Seatings II and III (≈20:30). After-party batch is Saturday only. Roof coolers run on a dedicated power drop — confirm the drop with 4Wall before doors each night."}
      ]
    },
    {
      "type": "schedule",
      "heading": "F&B day at a glance",
      "entries": [
        {"time": "10:00", "activity": "BOH receive and prep begin — verify temps and invoices.", "location": "BOH"},
        {"time": "13:00", "activity": "Bar batch #1 (pre-show).", "location": "Bar"},
        {"time": "16:00", "activity": "Final mise-en-place; pickup brief with show caller.", "location": "BOH"},
        {"time": "17:00", "activity": "Service starts (Seating I doors at 18:00, dinner at 18:30).", "location": "Floor and Bar"},
        {"time": "≈20:30", "activity": "Bar batch #2 between Seatings II and III.", "location": "Bar"},
        {"time": "Sat post-show", "activity": "Bar batch #3 plus burger-grill activation (Saturday only).", "location": "Roof and Public Dining"},
        {"time": "Wrap", "activity": "BOH cleaning, depletion log, and waste log.", "location": "BOH"}
      ]
    },
    {
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
        {"role": "Dessert Chef", "name": "Matthew Effendy", "email": "meffendy@cremebyme.com"},
        {"role": "Dessert Chef", "name": "Ariana Genilla", "email": "agenilla@cremebyme.com"},
        {"role": "Dessert Chef", "name": "Julius Acoba", "email": "juliusacoba@hotmail.com"},
        {"role": "Dessert Chef", "name": "Jamie Jin", "email": "Jjin022892@gmail.com"},
        {"role": "Dessert Chef", "name": "Mark Madarang", "email": "marc.angelico24@gmail.com"},
        {"role": "Dessert Chef", "name": "Zac Grosso", "email": "zgrosso@gmail.com"},
        {"header": "Bar Operations — Dirty Olive"},
        {"role": "Bar Operations Manager", "name": "Madeleine (Maddie) Bruner", "email": "madeleinebruner@gmail.com", "phone": "(702) 540-6383"},
        {"role": "Bar Operations Manager", "name": "Brittany Ashton", "email": "bashton_00@yahoo.com", "phone": "(702) 622-5650"},
        {"role": "Bar Operations Manager", "name": "Alex Bruner", "email": "abru3@yahoo.com", "phone": "(702) 575-1223"},
        {"role": "Bar Operations Manager", "name": "Dave Severino", "email": "davidmseverino@gmail.com", "phone": "(702) 819-0558"},
        {"role": "BOH Lead Barback", "name": "Cliff Cabral", "email": "cabral541@yahoo.com", "phone": "(702) 964-9215"},
        {"header": "Production"},
        {"role": "F&B Production Manager", "name": "Kade Barrett", "email": "Kadebarrett808@icloud.com", "phone": "(443) 735-887"},
        {"role": "Production Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
        {"role": "Sponsor Activations Lead", "name": "Margo Williams (Five Senses)", "email": "margo@five-senses.co", "phone": "(619) 302-7039"},
        {"role": "Ticketing", "name": "Ritesh Patel (Ticket Fairy)", "email": "ritesh@theticketfairy.com"}
      ]
    },
    {
      "type": "sops",
      "heading": "F&B standard operating procedures",
      "entries": [
        {"code": "FB-01", "title": "Kitchen open and close", "steps": ["Receive deliveries at 10:00 and verify temps and invoices on arrival.", "Mise-en-place complete by the 16:00 brief.", "Service window runs from 17:00 to the final dessert call.", "Close the line by cooling, labeling, logging waste, sanitizing, and shutting down the hood."]},
        {"code": "FB-02", "title": "Allergen handling", "steps": ["Server takes allergens at the table on arrival before opening course.", "Server flags the ticket and relays the allergen via Channel 6 to BOH.", "Chef-on-duty confirms the substitution before pickup.", "A dedicated allergen pickup window prevents cross-contact; severe allergens (nut, shellfish) get plate-by-plate confirmation."]},
        {"code": "FB-03", "title": "Bar batching three times daily", "steps": ["Levy provides liquor and mixers; Dirty Olive batches to recipe cards.", "Log batched volumes on the depletion sheet.", "Pre-show batch lands at 13:00, mid-show between Seatings II and III, after-party Saturday only.", "Track glassware loss nightly against the 2026 replacement budget line."]},
        {"code": "FB-04", "title": "Sponsor product handling", "steps": ["Pour White Claw, Skyy, Bacardi, Mr Black, Hello Soju, and Hiyo into their dedicated Square POS SKUs.", "Track depletions through Square exports for sponsor reporting.", "Use branded glassware for activation pours where the sponsor requires it."]},
        {"code": "FB-05", "title": "POS and Wi-Fi failover", "steps": ["Bar POS runs on the primary network.", "If POS drops, call 'Switch' on Channel 1 — IT triggers the backup network.", "If both networks fail for more than five minutes, fall back to manual paper tabs."]}
      ]
    },
    {
      "type": "ppe",
      "heading": "Personal protective equipment",
      "entries": [
        {"item": "Slip-resistant footwear", "required": true, "note": "BOH at all hours."},
        {"item": "Hairnet or hat", "required": true, "note": "BOH per food code."},
        {"item": "Food-safe gloves", "required": true, "note": "Required at all stations per food code."},
        {"item": "Closed-toe footwear", "required": true, "note": "FOH service."},
        {"item": "Apron or jacket", "required": true, "note": "Branded per Salvage standards."}
      ]
    },
    {
      "type": "resources",
      "heading": "F&B resources",
      "entries": [
        {"name": "Kitchen equipment drop", "location": "BOH", "details": "Confirmed with TCI and RSVP; invoice tracking sits with Five Senses."},
        {"name": "Ice plan", "location": "Bar BOH and roof coolers", "details": "Power drops confirmed with 4Wall before doors."},
        {"name": "Chemical storage", "location": "BOH back wall", "details": "Locked cage — chef and bar leads only."},
        {"name": "Dishpit", "location": "BOH", "details": "Glassware loss tracked nightly."},
        {"name": "Q-Mat and water", "location": "BOH and container storage", "details": "Pulled from the Insomniac F&B advance."},
        {"name": "BOH water station", "location": "BOH", "details": "Hydration drops every seating change."}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio channels",
      "channels": [
        {"channel": "6 — F&B BOH", "purpose": "Kitchen channel for chef, sous, and BOH leads. Allergen calls land here."},
        {"channel": "4 — BAR", "purpose": "Bar replenishment requests, batching coordination, and 86 calls."},
        {"channel": "3 — FOH/BOH", "purpose": "Service handoffs between front-of-house and back-of-house."}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability commitments",
      "entries": [
        {"item": "Composting", "detail": "BOH organics flow into the Insomniac sustainability program."},
        {"item": "Single-use reduction", "detail": "Use reusable plate-ware wherever the show ROS allows."},
        {"item": "Glassware reuse", "detail": "Tracked nightly with a replacement line in the 2026 budget for breakage."}
      ]
    },
    {
      "type": "faq",
      "heading": "F&B FAQ",
      "entries": [
        {"q": "Do we take advance allergy notes?", "a": "No — servers take allergies at the table on arrival, before opening course."},
        {"q": "What's the capacity per seating?", "a": "A maximum of 80 guests, served family-style on 20-tops."},
        {"q": "How do we handle under-21 service?", "a": "Soft drinks and non-alcoholic beverages only. A wristband marker is required at the bar."},
        {"q": "How is sponsor activation reported?", "a": "Square POS depletions are exported each night for sponsor reports — White Claw, Skyy, Bacardi, Mr Black, Hello Soju, and Hiyo each have dedicated SKUs."},
        {"q": "When is the late-guest dessert call?", "a": "Last call is at T-5. The show climax holds for the close."}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2d. SPONSORS (sponsor, tier 4) — LEAN (Black-Coffee 4-section model)
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'sponsor'::guide_persona, 4, 'SPONSORS',
  'Salvage City Supper Club — Sponsor Guide',
  'EDC Las Vegas 2026 · brand activations and sanctioned photo moments inside Nomads Land.',
  true,
  $JSON${
  "pageTitles": ["The Experience", "Schedule", "FAQ", "Contacts"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome, partners",
      "body": "Salvage City Supper Club is a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway across May 15, 16, and 17, 2026. We run five seatings nightly with a hard cap of 80 guests per seating — roughly 1,200 unique guests across the run. Your activation lives within a fully art-directed post-civilization world, with brand-aligned moments built into the bar program and sanctioned capture zones throughout the footprint. Square POS exports cover depletion reporting per seating for every activated SKU.",
      "callouts": [
        {"kind": "gold", "title": "How activations are running this year", "body": "White Claw, Skyy, Bacardi (with Mr Black and Tres Generaciones), Hello Soju, and Hiyo are pouring through dedicated SKUs in branded glassware. Square POS depletions export per seating for nightly sponsor reporting."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Sponsor-relevant moments per night",
      "entries": [
        {"time": "18:00", "activity": "Salvage City Speakeasy Social — guests arrive, cocktails poured, brand-capture window opens.", "location": "Public Dining"},
        {"time": "18:30 / 19:30 / 20:30 / 21:30 / 22:30", "activity": "Seatings I–V — 60 minutes each. Sponsor product visible on family-style 20-tops.", "location": "Public Dining"},
        {"time": "Show climax (≈40 min into seating)", "activity": "Hero moment — sphere lights, aerial soars, fire-act transition into the final number.", "location": "Main Stage"},
        {"time": "Sat after-party (post-Seating V)", "activity": "Saturday extended hours — rooftop bar and burger-grill activation.", "location": "Roof"}
      ]
    },
    {
      "type": "faq",
      "heading": "Sponsor FAQ",
      "entries": [
        {"q": "How do we report activation results?", "a": "Square POS depletions export each night by F&B Operations and ship to your team."},
        {"q": "Can we send a photographer?", "a": "Yes — credentials run through the concierge ahead of time. Personal cell capture of talent is not allowed; talent and guest faces require a signed waiver before publication."},
        {"q": "What's the capacity per seating?", "a": "Each seating caps at 80 guests across five seatings nightly — roughly 1,200 unique guests across the run."},
        {"q": "Can we attend the after-party?", "a": "Saturday only. The after-party runs after Seating V on the rooftop with the burger-grill activation."},
        {"q": "Where is Salvage at the venue?", "a": "Inside Nomads Land at the Las Vegas Motor Speedway. Guests need an EDC wristband and a Salvage reservation to enter."},
        {"q": "How do ambush activations work?", "a": "They don't. All activations are coordinated through Five Senses and the Salvage production team."}
      ]
    },
    {
      "type": "contacts",
      "heading": "Commercial leads",
      "entries": [
        {"role": "Operations Director (Five Senses)", "name": "Julian Clarkson", "email": "julian@five-senses.co", "phone": "(407) 885-6011"},
        {"role": "Sponsor Activations & Logistics", "name": "Margo Williams (Five Senses)", "email": "margo@five-senses.co", "phone": "(619) 302-7039"},
        {"role": "Insomniac Production Counterpart", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com", "phone": "(856) 373-6541"},
        {"role": "Concierge", "email": "hello@salvagecitysupperclub.com"}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2e. TALENT (artist, tier 4) — LEAN (Black-Coffee 4-section model)
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'artist'::guide_persona, 4, 'TALENT',
  'Salvage City — Talent',
  'Cast, vocalists, aerialists, specialty performers, and the fire performer.',
  true,
  $JSON${
  "pageTitles": ["Calls", "Show", "FAQ", "Contacts"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome to Salvage City",
      "body": "You are the show. We run five 60-minute seatings each night across May 15, 16, and 17 inside Nomads Land at the Las Vegas Motor Speedway. Creative is led by No Ceilings Entertainment with Corazon Entertainment (Rodrigo Guzman, Celine Franco) as performance producer. The show runs as: Scene 1a sweatbox prelude · Scene 1b opening on '1975' · Scene 1c full-cast opening · Scene 2 host script · Scene 3a Godspeed live vocal · Scene 3b Hypnosis mash on the Sean Paul remix · mid-show roving · fire-act transition · final number · dessert and exit. The aerial point lives at position 3, the sweatbox cube center, and the fire performer carries a current Clark County Fire / Nevada State Fire Marshal Performer Permit.",
      "callouts": [
        {"kind": "red", "title": "Insomniac safety form is mandatory", "body": "Sign the INSOMNIAC 2026 Safety & Social Media Policy form before your first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field. The link is in the 2026 production playbook."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Talent day",
      "entries": [
        {"time": "16:00", "activity": "First call, warm-up, gratitude circle. Boxed lunch / dinner in the greenroom.", "location": "Greenroom"},
        {"time": "16:30", "activity": "Soundcheck for vocalists.", "location": "Main Stage"},
        {"time": "17:00", "activity": "Aerial and rigging safety checks.", "location": "Aerial point (position 3)"},
        {"time": "17:30", "activity": "Staggered dinner.", "location": "BOH"},
        {"time": "18:00", "activity": "Final costume and makeup; pre-show briefing with the show caller.", "location": "Greenroom"},
        {"time": "18:30 / 19:30 / 20:30 / 21:30 / 22:30", "activity": "Show — 60 minutes per seating, repeated five times each night.", "location": "Public Dining and Main Stage"},
        {"time": "23:30", "activity": "Notes, cool-down, costume returns.", "location": "Greenroom"}
      ]
    },
    {
      "type": "faq",
      "heading": "Talent FAQ",
      "entries": [
        {"q": "Where do I check in?", "a": "Greenroom container at first call (16:00)."},
        {"q": "Where do I eat?", "a": "Boxed lunch / dinner in the greenroom from 16:00, with a staggered dinner block at 17:30."},
        {"q": "Can I post on social?", "a": "Production-approved capture only during work hours. By performing, you consent to filming for promotional and social use by Salvage / Five Senses / Insomniac."},
        {"q": "What if I'm running late?", "a": "Call or text Skylar (Production Manager) at (702) 689-6907 at least 30 minutes ahead. Don't Slack."},
        {"q": "Where do fittings happen?", "a": "Off-site at The ROCK Center for Dance through May 11; on-site greenroom from May 12 onward."},
        {"q": "What should I bring?", "a": "Knee pads, dance shoes, personal flashlight (the venue is dark backstage), reusable water bottle. Daytime highs run around 99°F — hydrate every break."}
      ]
    },
    {
      "type": "contacts",
      "heading": "Creative and production leads",
      "entries": [
        {"role": "Corazon Lead (Creative)", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.com"},
        {"role": "Corazon Coordinator", "name": "Celine Franco", "email": "info@corazonentertainment.com"},
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
        {"role": "Production Director", "name": "Sarah Fry", "email": "FrySarah8@gmail.com", "phone": "(615) 708-3676"},
        {"role": "Hospitality Manager", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
        {"role": "Operations Director (escalation)", "name": "Julian Clarkson", "email": "julian@five-senses.co", "phone": "(407) 885-6011"}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2f. GUESTS (guest, tier 5) — LEAN (Black-Coffee 4-section model)
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'guest'::guide_persona, 5, 'GUESTS',
  'Salvage City Supper Club — Guest Guide',
  'EDC Las Vegas 2026 · May 15–17 · inside Nomads Land at the Las Vegas Motor Speedway.',
  true,
  $JSON${
  "pageTitles": ["The Experience", "Schedule", "FAQ", "Concierge"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome to Salvage City",
      "body": "Salvage City Supper Club is a 60-minute progressive supper club paired with an immersive show — an oasis of abundance set beyond the end of civilization. We're inside Nomads Land at the Las Vegas Motor Speedway during EDC Las Vegas 2026 (May 15 through 17). Your reservation includes a five-course culinary journey by Chef Eyal Banayan and Crème by Me on dessert, free-flowing cocktails, wines, and soft drinks throughout the experience, private performances by our immersive cast, and elevated views of high-flying acts.",
      "callouts": [
        {"kind": "gold", "title": "An EDC wristband is required", "body": "Salvage City is only available to EDC Las Vegas pass holders. Wear your EDC wristband — without it, we can't let you in. Check in 15 minutes before your seating with your ticket confirmation and a valid ID. Late guests forfeit the opening course; the room locks at the start of Scene 1a."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Seatings",
      "entries": [
        {"time": "Friday, May 15", "activity": "Five seatings between 18:30 and 23:30 — 60 minutes each.", "note": "Doors at 18:00; check in 15 minutes before your seating."},
        {"time": "Saturday, May 16", "activity": "Five seatings, plus an after-party on the rooftop.", "note": "Saturday is the only night with extended hours."},
        {"time": "Sunday, May 17", "activity": "Five seatings — final-night gratitude moment closes the run.", "note": "Doors at 18:00."},
        {"time": "Per seating", "activity": "Cocktail welcome → opening course → main and show → climax → dessert and exit. The show runs 60 minutes from cocktail welcome to dessert.", "note": ""}
      ]
    },
    {
      "type": "faq",
      "heading": "Guest FAQ",
      "entries": [
        {"q": "How much is a reservation?", "a": "A Supper Club VIP reservation is $189 per person plus an 18% service charge, taxes, and fees. An Insomniac Staff tier is also available at $69."},
        {"q": "Do I need an EDC ticket?", "a": "Yes — Salvage City is only available to EDC Las Vegas pass holders. You must wear your festival wristband to enter."},
        {"q": "What's the dress code?", "a": "Festival-glam works perfectly. Embrace the post-civilization aesthetic. Closed-toe footwear is recommended for the Speedway grounds."},
        {"q": "Is there an age limit?", "a": "Yes, the experience is 18 and over. Please bring a valid government-issued ID."},
        {"q": "What's included with my reservation?", "a": "A five-course culinary journey, free-flowing cocktails, wines, and soft drinks, private performances by our immersive cast, and elevated views of the high-flying acts. The 18% service charge is included."},
        {"q": "Can I make dietary requests in advance?", "a": "We don't take dietary requests in advance. Share allergies and dietary needs with your server on arrival; the kitchen accommodates with local ingredients."},
        {"q": "Can I sit with my friends?", "a": "Tables seat 20 guests family-style. Groups should arrive early to coordinate seating with the host."},
        {"q": "What time should I arrive?", "a": "Check in 15 minutes before your seating. Late guests forfeit the opening course (the room locks at Scene 1a)."},
        {"q": "Where is Salvage at the festival?", "a": "Inside Nomads Land at the Las Vegas Motor Speedway."},
        {"q": "How do I cancel or transfer my reservation?", "a": "Refunds and transfers are handled by Ticket Fairy. The full policy is on your purchase confirmation."},
        {"q": "Is there a shuttle?", "a": "Yes — see the Salvage City Guest Shuttle Route shared in your reservation confirmation."}
      ]
    },
    {
      "type": "contacts",
      "heading": "Concierge",
      "entries": [
        {"role": "Concierge", "name": "Average response about two hours", "email": "hello@salvagecitysupperclub.com"},
        {"role": "Help desk", "email": "help@salvagecitysupperclub.com"},
        {"role": "Instagram", "name": "@salvagecitysupperclub"},
        {"role": "Tickets", "name": "Ticket Fairy", "email": "support@theticketfairy.com"}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();

-- ===========================================================================
-- 2g. TEMPORARY ACCESS (custom, tier 5) — LEAN (Black-Coffee 4-section model)
-- ===========================================================================
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'custom'::guide_persona, 5, 'TEMPORARY ACCESS',
  'Salvage City — Temporary Access',
  'Day-pass holders, journalists, vendor walks, fire-marshal site visits, photographer pool, and talent +1s.',
  true,
  $JSON${
  "pageTitles": ["Your Visit", "Schedule", "FAQ", "Contacts"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome — temporary access",
      "body": "You're entering Salvage City on a one-shot or limited-window credential. That might mean a vendor walk-through, a fire-marshal site visit, a journalist preview, a photographer pool slot, a Pineapple Agency container delivery, or a talent +1. The window printed on your day-pass is hard — we cannot extend access on site. Your shepherd's name and phone are on the day-pass; if you can't find them when you arrive, call the Salvage Ops line on the back of the pass.",
      "callouts": [
        {"kind": "red", "title": "If you arrive unescorted, wait at the gate", "body": "Wait at the Salvage City front gate until your shepherd arrives. Do not enter unattended areas under any circumstances. Photography is production-approved only; do not capture talent or guests without explicit permission."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Your access window",
      "entries": [
        {"time": "Per day-pass", "activity": "Access is valid only within the window printed on your pass.", "note": "The end time is a hard-out — we cannot extend access on site."},
        {"time": "Build days (May 12 – 14)", "activity": "Vendor, delivery, and inspection windows.", "note": "PPE is required throughout the build (closed-toe footwear; high-vis on the build floor)."},
        {"time": "Show days (May 15 – 17)", "activity": "Press preview and photographer-pool slots only.", "note": "Coordinate slots through the concierge ahead of time."}
      ]
    },
    {
      "type": "faq",
      "heading": "Temporary access FAQ",
      "entries": [
        {"q": "Where do I check in?", "a": "Salvage City front gate. Bring your day-pass and a valid ID."},
        {"q": "Can I bring a +1?", "a": "Only if your day-pass explicitly lists +1. Otherwise, no."},
        {"q": "Can I extend my access?", "a": "No — passes are time-limited and cannot be extended on site."},
        {"q": "What if my shepherd is late?", "a": "Wait at the front gate and call the Salvage Ops number printed on your pass."},
        {"q": "Can I take photos?", "a": "Production-approved capture only. Do not photograph talent or guests without explicit permission."},
        {"q": "Can I move around unescorted?", "a": "No. If your escort steps away briefly, wait where you are — do not move."}
      ]
    },
    {
      "type": "contacts",
      "heading": "Your shepherd and back-up contacts",
      "entries": [
        {"role": "On-site shepherd", "name": "Listed on your day-pass"},
        {"role": "Salvage Ops (back-up)", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
        {"role": "Concierge", "email": "hello@salvagecitysupperclub.com"},
        {"role": "Operations Director (escalation)", "name": "Julian Clarkson", "email": "julian@five-senses.co", "phone": "(407) 885-6011"}
      ]
    }
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();
