-- flyingbluewhale · EDCLV26 Salvage City Supper Club seed
-- Creates one project + seven persona-scoped event_guides for the Salvage City
-- Boarding Pass KBYG. Idempotent: re-applying refreshes guide content but does
-- not duplicate the project. Persona banners are overridden with the user-facing
-- labels (PRODUCTION / OPERATIONS / FOOD & BEVERAGE / SPONSORS / TALENT /
-- GUESTS / TEMPORARY ACCESS) so the on-screen classification matches the
-- production org chart instead of the system defaults.

-- 1. Project row -------------------------------------------------------------
insert into projects (
  org_id, slug, name, description, status, start_date, end_date, created_by
)
select
  o.id,
  'edclv26-salvage-city',
  'EDCLV26 Salvage City Supper Club',
  'Salvage City Supper Club at EDC Las Vegas 2026 — 60-min progressive supper club + immersive show inside Nomads Land at Las Vegas Motor Speedway. Five seatings nightly, May 15-17 2026. Produced by GHXSTSHIP with Insomniac, Five Senses, No Ceilings / Corazon Entertainment, Levy, Dirty Olive, R-Tech, 4Wall, Paradox, JTPro, The Pineapple Agency, and Ticket Fairy.',
  'active',
  date '2026-05-15',
  date '2026-05-17',
  u.id
from orgs o
cross join users u
where o.slug = 'demo' and u.email = 'julian.clarkson@ghxstship.pro'
on conflict (org_id, slug) do nothing;

-- 2. Seven persona-scoped guide rows ----------------------------------------
-- Resolve project + creator once, then upsert each guide.
with ctx as (
  select
    p.id    as project_id,
    p.org_id,
    u.id    as user_id
  from projects p
  join orgs    o on o.id = p.org_id
  cross join users u
  where p.slug = 'edclv26-salvage-city'
    and o.slug = 'demo'
    and u.email = 'julian.clarkson@ghxstship.pro'
)

-- 2a. PRODUCTION (staff) ----------------------------------------------------
insert into event_guides (
  org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by
)
select org_id, project_id, 'staff'::guide_persona, 1, 'PRODUCTION',
  'Salvage City — Production',
  'Command-center KBYG · 5/11–5/19 build · 5/15–5/17 show',
  true,
  $JSON${
  "pageTitles": ["The Show", "Build & Strike", "Contacts", "Safety", "Site"],
  "sections": [
    {
      "type": "overview",
      "heading": "EDCLV26 Salvage City Supper Club",
      "body": "Salvage City is a 60-minute progressive supper club + immersive show set inside Nomads Land at Las Vegas Motor Speedway during EDC Las Vegas 2026 (May 15-17). Five seatings nightly. GHXSTSHIP produces with Insomniac as venue partner; creative by No Ceilings / Corazon Entertainment; F&B by Five Senses, Levy & Chef Eyal Banayan; bar by Dirty Olive; technical by R-Tech, 4Wall, Paradox, and JTPro; container build by The Pineapple Agency; ticketing via Ticket Fairy.",
      "callouts": [
        {"kind": "red", "title": "Wind contingency 25 mph+", "body": "Insomniac shuts down rooftop bar and aerial elements above 25 mph sustained. Run the wind-contingency SOP — re-route guests under cover, suspend rooftop service, hold aerial and fire cues."},
        {"kind": "gold", "title": "Lennd advancing", "body": "All Lennd advancing deadlines were missed. IT/Wi-Fi advanced direct with Kona; security with Toshiki Hisaka; creds/meals/parking/radios in the Lennd People tab via Katie Miller."},
        {"kind": "pink", "title": "Reduced timeline", "body": "Container modification scope was de-scoped after the 4/13 Pineapple Agency call. Lock creative by 4/29 so dot-map and security plot can finalize."}
      ]
    },
    {
      "type": "timeline",
      "heading": "Build · show · strike",
      "entries": [
        {"time": "Mon 5/11", "activity": "GHXSTSHIP Project Directors on site (Sarah Fry, Vida Sotakoun, Skylar Contini-Enneper)", "note": "Site walk + creds pickup"},
        {"time": "Tue 5/12", "activity": "4Wall + R-Tech load-in begins (lighting, decking, FX, audio)", "note": "Production crew (Brett, Adam, Josh) on site"},
        {"time": "Wed 5/13", "activity": "Dirty Olive bar load-in · NCE prop builds · piano shell delivered to Bellagio pickup", "note": "3x cocktail batching window opens"},
        {"time": "Thu 5/14", "activity": "Talent + driver on site (Mariah Williams). Aerial rigging checks. Tech rehearsal.", "note": "Talent first call 1:00p"},
        {"time": "Fri 5/15", "activity": "SHOW DAY 1 · invited run + 5 seatings", "note": "Doors per seating call sheet"},
        {"time": "Sat 5/16", "activity": "SHOW DAY 2 · 5 seatings + after-party (extended hours)", "note": "Saturday burger grill activation added"},
        {"time": "Sun 5/17", "activity": "SHOW DAY 3 · 5 seatings", "note": "Final-night talent gratitude moment"},
        {"time": "Mon 5/18", "activity": "Strike day 1 — bar, F&B, scenic, costumes", "note": "Returns to Insomniac warehouse / vendors"},
        {"time": "Tue 5/19", "activity": "Strike day 2 — technical, decking, container demob", "note": "All GHXSTSHIP off site EOD"}
      ]
    },
    {
      "type": "schedule",
      "heading": "Daily show-day schedule",
      "entries": [
        {"time": "14:00", "activity": "Production call · prep walk", "location": "Salvage City BOH"},
        {"time": "16:00", "activity": "Talent call · warm-up", "location": "Greenroom container"},
        {"time": "16:30", "activity": "Soundcheck", "location": "Main stage"},
        {"time": "17:00", "activity": "Aerial + rigging checks", "location": "Aerial point"},
        {"time": "17:30", "activity": "Dinner (staggered, talent + crew)", "location": "BOH"},
        {"time": "18:30", "activity": "Final tech check · doors hold", "location": "All zones"},
        {"time": "Per seating", "activity": "Doors → cocktails → opening course → main → show climax → dessert → exit", "note": "60 min runtime · 5 seatings/night"},
        {"time": "Post-show", "activity": "After-party (Sat extended)", "location": "Rooftop / dance floor"},
        {"time": "Wrap", "activity": "Tech reset · BOH clean · daysheet debrief", "location": "Salvage City"}
      ]
    },
    {
      "type": "set_times",
      "heading": "Show beats (per seating)",
      "entries": [
        {"artist": "Pre-show ambience", "stage": "Cocktail floor", "start": "T-15", "end": "T-0"},
        {"artist": "Scene 0 · Cocktail activation", "stage": "Dancefloor", "start": "00:00", "end": "00:11"},
        {"artist": "Scene 1 · Sweatbox prelude + Opening", "stage": "Center → Main", "start": "00:11", "end": "00:17"},
        {"artist": "Scene 3 · Hypnosis (live vocal)", "stage": "Main", "start": "00:17", "end": "00:21"},
        {"artist": "Mid-show courses + ambient acts", "stage": "Tables / Roving", "start": "00:21", "end": "00:42"},
        {"artist": "Fire act transition", "stage": "Center", "start": "00:42", "end": "00:46"},
        {"artist": "Final number + bows", "stage": "Main", "start": "00:46", "end": "00:55"},
        {"artist": "Dessert + exit music", "stage": "Tables", "start": "00:55", "end": "01:00"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Production call sheet",
      "entries": [
        {"header": "GHXSTSHIP (Production)"},
        {"role": "Project Producer", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro", "phone": "407.885.6011"},
        {"role": "Project Director", "name": "Sarah Fry", "email": "frysarah8@gmail.com"},
        {"role": "Project Director", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com"},
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com"},
        {"role": "Project Coordinator (remote)", "name": "Amy Reed"},
        {"role": "Production Crew (HEQ)", "name": "Brett Mosher", "email": "mosher457@yahoo.com"},
        {"role": "Production Crew (Skilled)", "name": "Adam Waddle", "email": "Awaddle05@msn.com"},
        {"role": "Production Crew (Skilled)", "name": "Josh Parra", "email": "joshuaparra@live.com"},
        {"role": "PA / Driver", "name": "Mariah Williams", "email": "mw.mariahwilliams@gmail.com"},
        {"role": "Operations Support", "email": "sos@ghxstship.pro"},
        {"header": "Insomniac (Venue Partner)"},
        {"role": "SVP Production / Ops / Experience", "name": "Justin Spagg", "email": "justin@insomniac.com", "phone": "323.874.7020"},
        {"role": "Production (Salvage liaison)", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com"},
        {"role": "Security", "name": "Toshiki Hisaka", "email": "toshiki.hisaka@insomniac.com"},
        {"role": "Production Operations", "name": "Erik Grosfeld", "email": "erik.grosfeld@insomniac.com"},
        {"role": "Production Operations", "name": "Daniel Mazza", "email": "daniel.mazza@insomniac.com"},
        {"role": "IT / Wi-Fi", "name": "Kona", "email": "kona@insomniac.com"},
        {"role": "Fire Safety", "name": "Bear", "email": "Bear@insomniac.com"},
        {"role": "Fire Safety", "name": "Chris Ingerson", "email": "chris.ingerson@insomniac.com"},
        {"role": "Permits", "name": "Ms Easy", "email": "mseasy@insomniac.com"},
        {"role": "Warehouse Director", "name": "Melanie Conn", "email": "melanie.conn@insomniac.com"},
        {"role": "Site Advances", "name": "Corey Canavan", "email": "corey.canavan@insomniac.com"},
        {"role": "Advancing", "name": "Katie Miller", "email": "katie.miller@insomniac.com"},
        {"role": "Site Plan", "name": "Jose Iglesias", "email": "jose.iglesias@insomniac.com"},
        {"role": "Programming", "name": "Brad Riley", "email": "brad.riley@insomniac.com"},
        {"role": "Programming", "name": "Geoff Godfrey", "email": "geoff.godfrey@insomniac.com"},
        {"header": "Five Senses (F&B Lead)"},
        {"role": "F&B Lead", "name": "Paul Seigenthaler", "email": "paul@five-senses.co"},
        {"role": "F&B Operations", "name": "Alvaro Hernández", "email": "alvaro@five-senses.co"},
        {"header": "No Ceilings / Corazon Entertainment (Creative)"},
        {"role": "Creative Director", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.co", "phone": "818.642.6258"},
        {"role": "Creative Producer", "name": "Celine Franco", "email": "info@corazonentertainment.co"},
        {"header": "Technical Vendors"},
        {"role": "R-Tech (Audio + Stage)", "name": "Ramiro Valenzuela", "email": "ramiro@rtechproductions.com"},
        {"role": "R-Tech (Audio + Stage)", "name": "AJ", "email": "aj@rtechproductions.com"},
        {"role": "4Wall (Lighting + Decking)"},
        {"role": "Paradox Productions (LD)"},
        {"role": "JTPro / ROCKFORCE (Stage Labor)"},
        {"role": "The Pineapple Agency (Containers)", "name": "Kelly", "email": "kelly@thepineappleagency.com"},
        {"header": "F&B / Bar"},
        {"role": "Levy (House F&B)"},
        {"role": "Executive Chef", "name": "Eyal Banayan"},
        {"role": "Dessert Chef", "name": "Crème by Me"},
        {"role": "Bar Operations", "name": "Dirty Olive", "email": "thedirtyolivelv@gmail.com"},
        {"header": "Print & Signage"},
        {"role": "Print Production", "name": "Mark Bobrov / BobrovLLC", "email": "BobrovLLC@gmail.com"},
        {"role": "Signage", "name": "Grafico (Sara / Travis / Spencer)", "email": "sara@grafico.com"},
        {"header": "Costume"},
        {"role": "Costume Design", "name": "Jonny Cota", "email": "jonny@jonnycota.com"},
        {"header": "Ticketing + Travel"},
        {"role": "Ticket Fairy", "name": "Ritesh", "email": "ritesh@theticketfairy.com"},
        {"role": "Travel/Lodging", "name": "Fan Experiences (Mary / Dawn)", "email": "fanhousing@gmail.com"}
      ]
    },
    {
      "type": "credentials",
      "heading": "Access matrix",
      "columns": ["Production", "Operations", "F&B", "Sponsors", "Talent", "Guests", "Temporary"],
      "rows": [
        {"area": "Public Dining Floor",   "access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": true, "Talent": true, "Guests": true,  "Temporary": "Escorted"}},
        {"area": "Main Stage / Show Deck","access": {"Production": true, "Operations": true, "F&B": "Service only", "Sponsors": false, "Talent": true, "Guests": false, "Temporary": false}},
        {"area": "Backstage / Greenroom", "access": {"Production": true, "Operations": true, "F&B": false, "Sponsors": false, "Talent": true, "Guests": false, "Temporary": "Escorted"}},
        {"area": "BOH Kitchen",           "access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": false, "Talent": false, "Guests": false, "Temporary": false}},
        {"area": "Bar (Main + Roof)",     "access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": "Activation only", "Talent": false, "Guests": "Service only", "Temporary": false}},
        {"area": "Container BOH (Storage)","access": {"Production": true, "Operations": true, "F&B": true, "Sponsors": false, "Talent": false, "Guests": false, "Temporary": false}},
        {"area": "Roof Deck",             "access": {"Production": true, "Operations": true, "F&B": "Service only", "Sponsors": "VIP windows", "Talent": "Cued only", "Guests": "Cued only", "Temporary": false}},
        {"area": "Aerial / Rigging Zone", "access": {"Production": true, "Operations": "Lead only", "F&B": false, "Sponsors": false, "Talent": "Performing only", "Guests": false, "Temporary": false}},
        {"area": "Tunnel / Marshalling",  "access": {"Production": true, "Operations": true, "F&B": "Load times", "Sponsors": false, "Talent": "Call only", "Guests": false, "Temporary": "Escorted"}}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio plan",
      "channels": [
        {"channel": "1 · SC OPS",       "purpose": "GHXSTSHIP production leads + Insomniac liaison"},
        {"channel": "2 · SHOW CALL",    "purpose": "NCE / Corazon stage manager + tech ops"},
        {"channel": "3 · FOH/BOH",      "purpose": "Hospitality + service handoff"},
        {"channel": "4 · BAR",          "purpose": "Bar replenishment + batching"},
        {"channel": "5 · SECURITY",     "purpose": "Insomniac security + creds checks"},
        {"channel": "6 · F&B BOH",      "purpose": "Levy / Chef Eyal kitchen channel"}
      ],
      "codeWords": [
        {"code": "Ace",     "meaning": "Medical assist needed (location to follow)"},
        {"code": "Spotlight","meaning": "VIP/sponsor moving through floor"},
        {"code": "Switch",  "meaning": "Wi-Fi / POS failover to backup network"},
        {"code": "Wind 25", "meaning": "Sustained 25 mph+ — initiate roof + aerial hold"},
        {"code": "Match",   "meaning": "Fire performer cue armed — clear 20' perimeter"}
      ]
    },
    {
      "type": "sops",
      "heading": "Day-of SOPs",
      "entries": [
        {"code": "SOP-01", "title": "Doors → seating", "steps": ["Confirm scan list with Ticket Fairy 60 min before doors", "Verify EDC wristband + Salvage reservation at outer rope", "Hand off to host for table assignment (max 80, family-style 20-tops)", "Seat by 15 min before showtime — late guests forfeit opening course", "Communicate dietary on arrival (no advance allergy intake)"]},
        {"code": "SOP-02", "title": "Show-call handoff", "steps": ["NCE stage manager owns Channel 2 from cocktail through bows", "Scene preset confirms: sweatbox armed · aerial point · LED fans · sphere", "Hold for music timecode start", "Lighting follows ROS doc cues — Paradox LD primary, 4Wall secondary", "Bows + dessert handoff to FOH on Channel 3"]},
        {"code": "SOP-03", "title": "Wind contingency (25 mph+)", "steps": ["Receive 'Wind 25' on Channel 1", "Suspend rooftop bar service immediately", "Hold aerial cues — performers stand down to backup choreography", "Hold fire act if active", "Re-route exterior shuttles to ADA-covered drop", "Resume only on production lead all-clear"]},
        {"code": "SOP-04", "title": "Fire performer protocol", "steps": ["Performer must hold Nevada State Fire Marshal Fire Performer Permit", "20-foot perimeter cleared and fly-checked pre-show", "Pre-show fuel test in BOH per Insomniac fire safety", "Fire watch staged with extinguisher in ready position", "Cue 'Match' on Channel 1 to arm — abort cue if perimeter breached"]},
        {"code": "SOP-05", "title": "Bar batching (3x/day)", "steps": ["Levy provides liquor + mixers — Dirty Olive batches 3x/day", "Pre-show batch (4:00p) → mid-show batch (between seatings 2-3) → after-party batch (Sat only)", "Roof coolers on dedicated power drop — confirm with 4Wall", "Glassware loss tracked per night per the 2026 replacement line"]},
        {"code": "SOP-06", "title": "POS / Wi-Fi failover", "steps": ["Bar POS runs on primary network", "If POS drops, call 'Switch' on Channel 1 — Kona's IT switches to backup network", "Manual paper-tab fallback if both networks fail (>5 min)"]},
        {"code": "SOP-07", "title": "Strike", "steps": ["Mon 5/18: bar + F&B + scenic + costumes out", "Tue 5/19: lighting + decking + audio + container demob", "Insomniac warehouse pallet returns coordinated with Melanie Conn", "All keys, radios, and creds returned to Production by EOD 5/19"]}
      ]
    },
    {
      "type": "resources",
      "heading": "Site resources",
      "entries": [
        {"name": "Insomniac Warehouse",   "location": "4660 Berg St #100, North Las Vegas NV 89081", "details": "Pallet borrow + scenic returns — Melanie Conn"},
        {"name": "Ice Plan",              "location": "Bar BOH + roof coolers",                       "details": "Confirm power drops for roof; refresh 3x/day with batching"},
        {"name": "Q-Mat / Water",         "location": "BOH + container storage",                      "details": "Pull from Insomniac F&B advance"},
        {"name": "Big Shiny Ball",        "location": "Sphere position 3",                            "details": "2 procured for redundancy after 2025 shipping issue"},
        {"name": "Sweatbox (Cube)",       "location": "Center dancefloor position 2",                 "details": "8 ft x 8 ft, 2-inch poles, install included (Corazon)"},
        {"name": "Aerial Point",          "location": "Position 3 (lyra/hoop)",                       "details": "Standard motor; not time-coded — manual cue"},
        {"name": "Piano Shell",           "location": "Bellagio North Valet Garage pickup",           "details": "Pickup confirmed for 5/13 12:00p"},
        {"name": "Golf Cart Pickup",      "location": "Tunnel marshalling",                           "details": "Insomniac transportation desk"},
        {"name": "ATMs / Cash",           "location": "Nomads Land main aisle",                       "details": "Public-facing"}
      ]
    },
    {
      "type": "evacuation",
      "heading": "Evacuation",
      "routes": [
        {"from": "Public dining floor", "to": "Nomads Land main aisle",       "via": "Front gate"},
        {"from": "Main stage / BOH",    "to": "Nomads Land main aisle",       "via": "Tunnel exit"},
        {"from": "Roof deck",           "to": "Ground via interior stair",    "via": "Container ladder secondary"},
        {"from": "Greenroom container", "to": "Tunnel marshalling",           "via": "BOH corridor"}
      ],
      "assemblyPoint": "Nomads Land main aisle, north end (TBC with Insomniac EHS)"
    },
    {
      "type": "fire_safety",
      "heading": "Fire safety",
      "entries": [
        {"item": "ABC extinguishers",        "location": "BOH x2 · Bar x2 · Container x1 · Roof x1", "note": "Inspect pre-show daily"},
        {"item": "Kitchen Ansul system",     "location": "Hot line",                                  "note": "Levy maintains; verify before service"},
        {"item": "Fire watch (during show)", "location": "Within 20' of fire performer cue",           "note": "Per Insomniac fire safety"},
        {"item": "Fire performer permit",    "location": "On file with Insomniac MSE / Bear",         "note": "Nevada State Fire Marshal Performer Permit required"},
        {"item": "Fire blanket",             "location": "Bar + BOH",                                  "note": ""}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "Wheelchair access", "detail": "Via main festival ADA path — coordinate seating with host on arrival"},
        {"item": "ADA seating",       "detail": "Reserve table-end positions on family-style 20-tops"},
        {"item": "Allergens",         "detail": "Communicate to server on arrival — kitchen accommodates with local ingredients"},
        {"item": "Under 21",          "detail": "Soft drinks + non-alcoholic beverages; wristband marker required"},
        {"item": "Quiet exit",        "detail": "Tunnel BOH egress for guests needing low-stim path"}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability",
      "entries": [
        {"item": "Glassware + dinnerware reuse", "detail": "Tracked nightly; replacement budget line carried into 2026"},
        {"item": "Composting",                   "detail": "BOH organic stream via Insomniac sustainability program"},
        {"item": "Single-use reduction",         "detail": "Reusable plate-ware where ROS allows"},
        {"item": "Insomniac sustainability",     "detail": "Salvage participates in venue-wide program"}
      ]
    },
    {
      "type": "code_of_conduct",
      "heading": "Code of conduct",
      "entries": [
        {"item": "Insomniac 2026 Safety Procedures + Social Media Policy", "detail": "Sign on file via Insomniac form — Department/Vendor: 'Salvage City — No Ceilings'"},
        {"item": "Substance use",  "detail": "Zero tolerance during work hours — immediate termination per deal memo"},
        {"item": "Guest interaction", "detail": "Maintain show character; concierge handles complaints — escalate to Production via Channel 1"},
        {"item": "Filming + photography", "detail": "Production-approved only — talent waivers on file via NCE"}
      ]
    },
    {
      "type": "faq",
      "heading": "Production FAQ",
      "entries": [
        {"q": "Where do creds, meals, parking, and radios advance?",  "a": "Lennd People tab via Katie Miller (katie.miller@insomniac.com)."},
        {"q": "Where do IT and signage advance?",                      "a": "Direct portal links — IT with Kona, signage with Grafico."},
        {"q": "Travel + lodging?",                                     "a": "Fan Experiences (Mary / Dawn). Outside-block options possible — billed direct."},
        {"q": "Container modifications?",                              "a": "Pineapple Agency (Kelly). Scope reduced 4/13 — call to lock final mods."},
        {"q": "When do we lock creative for security plot?",           "a": "Toshi requires creative locked ~1 week before show for dot-map."},
        {"q": "Wind contingency threshold?",                            "a": "25 mph sustained — see SOP-03."},
        {"q": "Fire performer requirements?",                          "a": "NV State Fire Marshal Performer Permit + 20' perimeter + pre-show fuel test — see SOP-04."}
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

-- 2b. OPERATIONS (crew) -----------------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'crew'::guide_persona, 2, 'OPERATIONS',
  'Salvage City — Operations',
  'Day-of crew KBYG · PAs · hospitality · runners',
  true,
  $JSON${
  "pageTitles": ["Run of Day", "Contacts", "Safety"],
  "sections": [
    {
      "type": "overview",
      "heading": "Operations brief",
      "body": "Day-of operations crew running the floor: PAs, hospitality leads, runners, and the GHXSTSHIP production assistants. You report to Skylar Contini-Enneper (Production Manager) and Sarah Fry / Vida Sotakoun (Project Directors). Show is May 15-17 inside Nomads Land at LV Motor Speedway. Five seatings per night, 60 min each.",
      "callouts": [
        {"kind": "gold", "title": "Stay on radio", "body": "Channel 1 SC OPS is your home channel. Channel 3 FOH/BOH for hospitality. Stay off Channel 2 (Show Call) unless cued."},
        {"kind": "red", "title": "If you see something", "body": "Medical → 'Ace' on Ch 1. Lost guest → escort to host stand. Wind → relay 'Wind 25' if you hear it from leads."}
      ]
    },
    {
      "type": "timeline",
      "heading": "Build & strike",
      "entries": [
        {"time": "Tue 5/12 → Thu 5/14", "activity": "Build days — closed-toe + hi-vis required", "note": "PAs assist Pineapple/4Wall as directed"},
        {"time": "Thu 5/14", "activity": "Talent on site — runners begin", "note": ""},
        {"time": "Fri-Sun 5/15-17", "activity": "Show days · 5 seatings/night", "note": "After-party Sat (extended)"},
        {"time": "Mon-Tue 5/18-19", "activity": "Strike", "note": "Returns + cred returns"}
      ]
    },
    {
      "type": "schedule",
      "heading": "Show day call",
      "entries": [
        {"time": "13:00", "activity": "Crew call · radio check + creds", "location": "BOH"},
        {"time": "14:00", "activity": "Floor reset · seating prep", "location": "Public dining"},
        {"time": "16:00", "activity": "Talent arrivals — runners deploy", "location": "Greenroom"},
        {"time": "17:30", "activity": "Crew dinner (staggered)", "location": "BOH"},
        {"time": "18:30", "activity": "Doors hold + final brief", "location": "Front rope"},
        {"time": "Per seating", "activity": "Doors → escort → seat → service → exit", "note": "60 min cycle"},
        {"time": "Wrap", "activity": "Reset for next seating · debrief at EOD", "location": "BOH"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Lead POCs",
      "entries": [
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com"},
        {"role": "Project Director", "name": "Sarah Fry", "email": "frysarah8@gmail.com"},
        {"role": "Project Director", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com"},
        {"role": "Project Producer (escalation)", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro"},
        {"role": "Insomniac Liaison", "name": "Paul Seigenthaler", "email": "paul.seigenthaler@insomniac.com"},
        {"role": "Insomniac Security", "name": "Toshiki Hisaka", "email": "toshiki.hisaka@insomniac.com"},
        {"role": "F&B Lead", "name": "Paul Seigenthaler (Five Senses)", "email": "paul@five-senses.co"},
        {"role": "Bar Lead", "name": "Dirty Olive", "email": "thedirtyolivelv@gmail.com"}
      ]
    },
    {
      "type": "credentials",
      "heading": "Where you can go",
      "columns": ["Crew"],
      "rows": [
        {"area": "Public Dining Floor", "access": {"Crew": true}},
        {"area": "Backstage / Greenroom", "access": {"Crew": true}},
        {"area": "BOH Kitchen", "access": {"Crew": "Service handoff only"}},
        {"area": "Main Stage", "access": {"Crew": "During reset only — not during show"}},
        {"area": "Roof Deck", "access": {"Crew": "Service only"}},
        {"area": "Aerial Zone", "access": {"Crew": false}}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio plan",
      "channels": [
        {"channel": "1 · SC OPS",   "purpose": "Your home channel"},
        {"channel": "3 · FOH/BOH",  "purpose": "Hospitality + service handoff"},
        {"channel": "5 · SECURITY", "purpose": "Listen-only unless escalating"}
      ],
      "codeWords": [
        {"code": "Ace",     "meaning": "Medical assist needed"},
        {"code": "Lost+1",  "meaning": "Lost guest escort needed"},
        {"code": "Spotlight","meaning": "VIP moving — clear path"}
      ]
    },
    {
      "type": "sops",
      "heading": "Crew SOPs",
      "entries": [
        {"code": "SOP-01", "title": "Ingress flow", "steps": ["Greet at outer rope", "Verify EDC wristband + Salvage reservation", "Hand off to host within 30 sec", "If line stalls, call 'Backup' on Ch 1"]},
        {"code": "SOP-02", "title": "Dinner service handoff", "steps": ["Course-out cue from NCE stage manager on Ch 2", "FOH leads relay course on Ch 3", "Runners reset between courses", "Last-call dessert at T-5"]},
        {"code": "SOP-03", "title": "Bar replenishment", "steps": ["Bartender calls 'Refill' on Ch 4", "Runner fetches from BOH cooler", "Track depletions per nightly inventory"]},
        {"code": "SOP-04", "title": "Lost guest", "steps": ["Walk guest to host stand", "Host re-confirms seating", "Do not leave guest unescorted"]},
        {"code": "SOP-05", "title": "Medical / incident hand-off", "steps": ["Call 'Ace' on Ch 1 with location", "Stay with guest until medic arrives", "Production logs incident — do not post anywhere"]}
      ]
    },
    {
      "type": "ppe",
      "heading": "PPE",
      "entries": [
        {"item": "Closed-toe footwear",  "required": true, "note": "All days, all zones"},
        {"item": "Hi-vis vest",          "required": true, "note": "During build days only (Tue-Thu)"},
        {"item": "Gloves (work)",        "required": false, "note": "For prop builds + scenic"},
        {"item": "Hearing protection",   "required": false, "note": "For stage proximity during sound check"}
      ]
    },
    {
      "type": "evacuation",
      "heading": "Evacuation",
      "routes": [
        {"from": "Public dining floor", "to": "Nomads Land main aisle", "via": "Front gate"},
        {"from": "BOH",                 "to": "Tunnel exit",            "via": "BOH corridor"}
      ],
      "assemblyPoint": "Nomads Land main aisle, north end"
    },
    {
      "type": "fire_safety",
      "heading": "Fire safety",
      "entries": [
        {"item": "Extinguishers", "location": "BOH / Bar / Container / Roof", "note": "Know your nearest"},
        {"item": "If you see fire", "location": "Anywhere", "note": "Call 'Match' on Ch 1 with location · do not engage"}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "ADA seating",  "detail": "Coordinate with host on arrival"},
        {"item": "Allergens",    "detail": "Server logs on arrival — alert kitchen via Ch 6"},
        {"item": "Quiet exit",   "detail": "Tunnel BOH path for low-stim guests"}
      ]
    },
    {
      "type": "faq",
      "heading": "Crew FAQ",
      "entries": [
        {"q": "Where do I check in?",         "a": "BOH at 13:00 on show days for radio check + creds."},
        {"q": "Where do I eat?",              "a": "BOH staggered dinner at 17:30. Eat before doors — no eating on floor."},
        {"q": "Can I take photos?",           "a": "Production-approved only. No social posts during work hours."},
        {"q": "What if my radio dies?",       "a": "Swap at BOH radio cage — never leave the floor without one."},
        {"q": "Where's the closest restroom?","a": "Insomniac public restrooms in Nomads Land aisle. Crew restroom at BOH."}
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

-- 2c. FOOD & BEVERAGE (vendor) ----------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'vendor'::guide_persona, 3, 'FOOD & BEVERAGE',
  'Salvage City — Food & Beverage',
  'Kitchen · bar · F&B sponsor activations',
  true,
  $JSON${
  "pageTitles": ["Service", "Contacts", "Safety"],
  "sections": [
    {
      "type": "overview",
      "heading": "F&B brief",
      "body": "Salvage City is a 60-minute progressive supper club: amuse-bouche, opening course, main, sides, dessert. Five seatings nightly, May 15-17. Family-style 20-tops, max 80 guests/seating. Levy operates the house F&B; Five Senses leads program; Chef Eyal Banayan is exec chef; Crème by Me handles dessert; Dirty Olive runs bar with sponsor activations from White Claw, Skyy, Bacardi (Mr Black, Tres Generaciones), Hello Soju, and Hiyo.",
      "callouts": [
        {"kind": "gold", "title": "Allergens on arrival", "body": "Salvage policy is allergen intake at the table on arrival — kitchen accommodates with local ingredients. No advance allergy intake."},
        {"kind": "red",  "title": "Bar batching x3", "body": "Pre-show, mid-show (between seatings 2-3), and after-party (Sat only). Roof coolers on dedicated power drop."}
      ]
    },
    {
      "type": "schedule",
      "heading": "F&B day",
      "entries": [
        {"time": "10:00", "activity": "BOH receive · prep begins", "location": "BOH"},
        {"time": "13:00", "activity": "Bar batch #1 (pre-show)", "location": "Bar"},
        {"time": "16:00", "activity": "Final mise · pickup brief", "location": "BOH"},
        {"time": "17:00", "activity": "Service start (seating 1)", "location": "Floor"},
        {"time": "Mid-show", "activity": "Bar batch #2", "location": "Bar"},
        {"time": "After-party (Sat)", "activity": "Bar batch #3 + burger grill", "location": "Roof / Floor"},
        {"time": "Wrap", "activity": "BOH clean · depletion log", "location": "BOH"}
      ]
    },
    {
      "type": "contacts",
      "heading": "F&B leads",
      "entries": [
        {"role": "F&B Lead",        "name": "Paul Seigenthaler", "email": "paul@five-senses.co"},
        {"role": "F&B Operations",  "name": "Alvaro Hernández",  "email": "alvaro@five-senses.co"},
        {"role": "Executive Chef",  "name": "Eyal Banayan"},
        {"role": "Dessert Chef",    "name": "Crème by Me"},
        {"role": "House F&B",       "name": "Levy Restaurants"},
        {"role": "Bar Operations",  "name": "Dirty Olive", "email": "thedirtyolivelv@gmail.com"},
        {"role": "Kitchen Rentals", "name": "TCI Event Rentals"},
        {"role": "Kitchen Rentals", "name": "RSVP Rentals"},
        {"role": "Production POC",  "name": "Sarah Fry",         "email": "frysarah8@gmail.com"},
        {"role": "Sponsor Reps",    "name": "White Claw · Skyy · Bacardi · Mr Black · Hello Soju · Hiyo"}
      ]
    },
    {
      "type": "sops",
      "heading": "F&B SOPs",
      "entries": [
        {"code": "FB-01", "title": "Kitchen open / close", "steps": ["Receive 10:00 — verify temps + invoices", "Mise complete by 16:00 brief", "Service window 17:00 → final dessert call", "Close: cool, label, log waste, sanitize, hood off"]},
        {"code": "FB-02", "title": "Allergen handling", "steps": ["Server intakes allergen at table on arrival", "Server flags ticket + relays via Ch 6 to BOH", "Chef confirms substitution before pickup", "Dedicated allergen pickup window — no cross-contact"]},
        {"code": "FB-03", "title": "Bar batching (3x/day)", "steps": ["Levy provides liquor + mixers", "Dirty Olive batches per recipe card · log volumes", "Pre-show 13:00 → mid-show between seatings 2-3 → after-party Sat only", "Glassware loss logged per night → 2026 replacement budget"]},
        {"code": "FB-04", "title": "Sponsor product handling", "steps": ["White Claw + Skyy + Bacardi + Mr Black + Hello Soju + Hiyo product on dedicated SKUs", "Track depletions via Square POS for sponsor reporting", "Activation pours in branded glassware where required"]},
        {"code": "FB-05", "title": "POS / Wi-Fi failover", "steps": ["Primary network for POS", "If POS drops, call 'Switch' on Ch 1 — Kona triggers backup", "Paper-tab fallback if both networks fail >5 min"]}
      ]
    },
    {
      "type": "ppe",
      "heading": "PPE",
      "entries": [
        {"item": "Slip-resistant footwear", "required": true, "note": "BOH all hours"},
        {"item": "Hairnet / hat",            "required": true, "note": "BOH"},
        {"item": "Gloves (food-safe)",       "required": true, "note": "Per food code"},
        {"item": "Closed-toe footwear",      "required": true, "note": "FOH service"},
        {"item": "Apron / jacket",           "required": true, "note": "Branded per Salvage standards"}
      ]
    },
    {
      "type": "resources",
      "heading": "F&B resources",
      "entries": [
        {"name": "Kitchen Equipment Drop", "location": "BOH", "details": "Confirm with TCI + RSVP — invoice tracking with Five Senses"},
        {"name": "Ice plan",              "location": "Bar BOH + roof coolers", "details": "Power drops confirmed with 4Wall"},
        {"name": "Chemical storage",      "location": "BOH back wall", "details": "Locked cage — chef + bar leads only"},
        {"name": "Dishpit",               "location": "BOH", "details": "Glassware loss tracking nightly"},
        {"name": "Q-Mat / Water",         "location": "BOH + container storage", "details": ""},
        {"name": "BOH water station",     "location": "BOH", "details": "Hydration drops every seating change"}
      ]
    },
    {
      "type": "radio",
      "heading": "Radio",
      "channels": [
        {"channel": "6 · F&B BOH", "purpose": "Kitchen channel — chef + leads"},
        {"channel": "4 · BAR",     "purpose": "Bar replenishment"},
        {"channel": "3 · FOH/BOH", "purpose": "Service handoff (FOH → BOH)"}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability",
      "entries": [
        {"item": "Composting",                "detail": "BOH organic stream via Insomniac program"},
        {"item": "Single-use reduction",      "detail": "Reusable plate-ware where ROS allows"},
        {"item": "Glassware reuse",           "detail": "Tracked nightly · replacement line in 2026 budget"}
      ]
    },
    {
      "type": "faq",
      "heading": "F&B FAQ",
      "entries": [
        {"q": "Do we take advance allergy notes?",  "a": "No — server intakes at the table on arrival per Salvage policy."},
        {"q": "Capacity per seating?",              "a": "Max 80 guests, family-style 20-tops."},
        {"q": "Under-21 service?",                  "a": "Soft drinks + non-alcoholic. Wristband marker required."},
        {"q": "Sponsor activation reporting?",      "a": "Square POS depletions exported per night."},
        {"q": "Late guest dessert call?",           "a": "T-5 last call; show climax holds for the close."}
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

-- 2d. SPONSORS --------------------------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'sponsor'::guide_persona, 4, 'SPONSORS',
  'Salvage City — Sponsors',
  'Brand activations · photo moments · footprint',
  true,
  $JSON${
  "pageTitles": ["The Experience", "Activations", "Schedule"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome, partners",
      "body": "Salvage City Supper Club at EDC Las Vegas 2026 is an immersive 60-min progressive supper club inside Nomads Land. Five seatings nightly, May 15-17 — capacity 80 guests/seating. Your activation lives within a fully-art-directed post-civilization world, with brand-aligned moments built into the bar program, photo opportunities, and on-show signage.",
      "callouts": [
        {"kind": "gold", "title": "Brand activations", "body": "White Claw, Skyy, Bacardi, Mr Black, Hello Soju, and Hiyo run signature pours in branded glassware with Square POS depletion reporting per seating."},
        {"kind": "pink", "title": "Photo moments", "body": "Sweatbox cube, Big Shiny Ball, neon merch wall, rooftop bar — all sanctioned for brand capture."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Sponsor-relevant moments",
      "entries": [
        {"time": "Pre-show", "activity": "Cocktail reception · activation pours · brand capture", "location": "Cocktail floor"},
        {"time": "Doors",    "activity": "Guest seating · brand visibility on family-style tables", "location": "Public dining"},
        {"time": "Mid-show", "activity": "Dinner service · sponsor product on table", "location": "Tables"},
        {"time": "Show climax", "activity": "Hero moment — sphere + aerial + fire", "location": "Main stage"},
        {"time": "After-party (Sat)", "activity": "Extended hours · burger grill · rooftop bar", "location": "Roof"}
      ]
    },
    {
      "type": "set_times",
      "heading": "Show beats",
      "entries": [
        {"artist": "Cocktail activation", "stage": "Cocktail floor", "start": "T-15", "end": "T-0"},
        {"artist": "Opening number",      "stage": "Main",            "start": "00:00", "end": "00:17"},
        {"artist": "Mid-show ambient",    "stage": "Tables",          "start": "00:17", "end": "00:42"},
        {"artist": "Fire + final number", "stage": "Main",            "start": "00:42", "end": "01:00"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Commercial leads",
      "entries": [
        {"role": "Project Producer", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro"},
        {"role": "F&B / Activation Lead", "name": "Paul Seigenthaler (Five Senses)", "email": "paul@five-senses.co"},
        {"role": "Insomniac Liaison", "name": "Paul Seigenthaler (Insomniac)", "email": "paul.seigenthaler@insomniac.com"},
        {"role": "Concierge", "email": "hello@salvagecitysupperclub.com"}
      ]
    },
    {
      "type": "resources",
      "heading": "Activation footprint",
      "entries": [
        {"name": "Branded bar pour",      "location": "Main bar",   "details": "Signature cocktails · Square POS reporting"},
        {"name": "Rooftop bar",           "location": "Roof",       "details": "Premium pours · sunset moment"},
        {"name": "Photo wall · neon",     "location": "Entry",      "details": "Custom Salvage neon signage"},
        {"name": "Sweatbox cube",         "location": "Center",     "details": "Performance moment — brand-safe capture"},
        {"name": "Salvage merch booth",   "location": "Entry",      "details": "Shared brand visibility — coordinate with concierge"},
        {"name": "Big Shiny Ball",        "location": "Sphere",     "details": "Hero photo moment"}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "ADA access", "detail": "Main festival ADA path · coordinate with concierge"},
        {"item": "Photographer pool", "detail": "Production-approved only — request via concierge"}
      ]
    },
    {
      "type": "code_of_conduct",
      "heading": "On-site conduct",
      "entries": [
        {"item": "Brand capture",    "detail": "Photography permitted in sanctioned zones; talent and guest faces require waiver"},
        {"item": "Ambush activation", "detail": "Not permitted — all activations coordinated via Five Senses"},
        {"item": "Insomniac policy",  "detail": "All guests follow EDC LV terms of attendance"}
      ]
    },
    {
      "type": "faq",
      "heading": "Sponsor FAQ",
      "entries": [
        {"q": "How do we report activation results?",     "a": "Square POS depletions exported per night by F&B Operations."},
        {"q": "Can we send a photographer?",              "a": "Yes — credentialed via concierge. No personal cell capture of talent."},
        {"q": "Capacity per seating?",                    "a": "80 guests, five seatings nightly — 1,200 unique guests across the run."},
        {"q": "After-party access?",                      "a": "Saturday only · extended hours · rooftop + grill."},
        {"q": "Where is Salvage at the venue?",           "a": "Inside Nomads Land at Las Vegas Motor Speedway. Wristband + reservation required."}
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

-- 2e. TALENT (artist) -------------------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'artist'::guide_persona, 4, 'TALENT',
  'Salvage City — Talent',
  'Cast · vocalists · aerialists · fire performer',
  true,
  $JSON${
  "pageTitles": ["Calls", "Show", "Contacts"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome to Salvage City",
      "body": "You are the show. Five seatings nightly, May 15-17 at LV Motor Speedway. Creative led by Rodrigo Guzman and Celine Franco (Corazon Entertainment / NCE). Costumes by Jonny Cota. Aerial point at position 3. Sweatbox cube center. Live female vocalist on Godspeed. Fire performer holds NV State Fire Marshal Performer Permit.",
      "callouts": [
        {"kind": "red",  "title": "Insomniac safety form", "body": "Sign 'INSOMNIAC 2026: Safety Procedures & Social Media Policy' before first call. Department: 'Salvage City — No Ceilings'."},
        {"kind": "gold", "title": "Hydrate", "body": "High desert · 99°F highs · drink water every break. Salt + electrolytes provided in greenroom."},
        {"kind": "pink", "title": "Sharp objects in", "body": "All sharp props in before doors. Personal flashlights on every performer."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Talent day",
      "entries": [
        {"time": "16:00", "activity": "First call · warm-up + gratitude circle", "location": "Greenroom"},
        {"time": "16:30", "activity": "Soundcheck (vocalists)", "location": "Main stage"},
        {"time": "17:00", "activity": "Aerial + rigging checks", "location": "Aerial point"},
        {"time": "17:30", "activity": "Dinner (staggered)", "location": "BOH"},
        {"time": "18:30", "activity": "Costume + makeup final", "location": "Greenroom"},
        {"time": "Per seating", "activity": "Show 60 min · 5 nightly", "location": "Floor + Main"},
        {"time": "Wrap", "activity": "Notes · cool-down · costume returns", "location": "Greenroom"}
      ]
    },
    {
      "type": "set_times",
      "heading": "Show beats",
      "entries": [
        {"artist": "Pre-show ambience (FD/Roving)", "stage": "Cocktail floor", "start": "T-15", "end": "T-0"},
        {"artist": "Scene 0 — Cocktail",            "stage": "Floor",          "start": "00:00", "end": "00:11"},
        {"artist": "Scene 1a — Sweatbox prelude",   "stage": "Center",         "start": "00:11", "end": "00:13"},
        {"artist": "Scene 1b — Opening intro · 1975","stage": "Sphere · Aerial","start": "00:13", "end": "00:14"},
        {"artist": "Scene 1c — Opening (full cast)","stage": "Main",           "start": "00:14", "end": "00:17"},
        {"artist": "Scene 2 — Host script",         "stage": "Main",           "start": "00:17", "end": "00:18"},
        {"artist": "Scene 3a — Godspeed (live)",    "stage": "Catwalk → Main", "start": "00:18", "end": "00:18:52"},
        {"artist": "Scene 3b — Hypnosis mash",      "stage": "Main",           "start": "00:18:52","end": "00:21:30"},
        {"artist": "Mid-show roving + ambient",     "stage": "Tables",         "start": "00:21:30","end": "00:42"},
        {"artist": "Fire act transition",           "stage": "Center",         "start": "00:42", "end": "00:46"},
        {"artist": "Final number + bows",           "stage": "Main",           "start": "00:46", "end": "00:55"},
        {"artist": "Dessert + exit music",          "stage": "Tables",         "start": "00:55", "end": "01:00"}
      ]
    },
    {
      "type": "timeline",
      "heading": "Per-scene cues (from 2025 ROS · updated)",
      "entries": [
        {"time": "Preset",        "activity": "Flags x6 in containers · 2 gloves (boys) dining · 3 pairs L+R"},
        {"time": "Scene 0",       "activity": "Cocktails + appetizers · 2 dancers + Alio rotating · 1x FD in sweatbox"},
        {"time": "Scene 1a",      "activity": "Dancer breaks out of sweatbox · gong/bell summons Dinah"},
        {"time": "Scene 1b",      "activity": "Dinah in CHROME LAYER · aerial hoop @ position 3 · spin up"},
        {"time": "Scene 1c",      "activity": "Big opening · all cast on main · acrobats around position 1 · strobe"},
        {"time": "Scene 2",       "activity": "Host introduces female lead · Doug receives Claire on stage"},
        {"time": "Scene 3a",      "activity": "Godspeed live vocal · catwalk light from main → position 3 → onto stage"},
        {"time": "Scene 3b",      "activity": "Hypnosis mash · Sean Paul remix · LED fans · Salvage logo strobe"},
        {"time": "Mid-show",      "activity": "Roving acts at tables · ambience · costume swaps as cued"},
        {"time": "Fire transition","activity": "Match cue · 20' perimeter · burnt-orange wash"},
        {"time": "Final number",  "activity": "Full cast · main stage · bow line"},
        {"time": "Exit",          "activity": "Dessert music · cool-down · greenroom"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Creative + cast leads",
      "entries": [
        {"role": "Creative Director",  "name": "Rodrigo Guzman",  "email": "info@corazonentertainment.co", "phone": "818.642.6258"},
        {"role": "Creative Producer",  "name": "Celine Franco",   "email": "info@corazonentertainment.co"},
        {"role": "Costume Designer",   "name": "Jonny Cota",      "email": "jonny@jonnycota.com"},
        {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com"},
        {"role": "Production Director","name": "Sarah Fry",       "email": "frysarah8@gmail.com"},
        {"role": "Production Director","name": "Vida Sotakoun",   "email": "Vidasotakoun@gmail.com"},
        {"role": "Project Producer",   "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro"}
      ]
    },
    {
      "type": "ppe",
      "heading": "PPE / kit",
      "entries": [
        {"item": "Knee pads",          "required": true,  "note": "Per dancer notes"},
        {"item": "Dance shoes",        "required": true,  "note": "Per choreography"},
        {"item": "Personal flashlight","required": true,  "note": "Bring every show — venue is dark"},
        {"item": "Water bottle",       "required": true,  "note": "Hydrate every break"},
        {"item": "Hearing protection", "required": false, "note": "Optional during sound check"}
      ]
    },
    {
      "type": "resources",
      "heading": "On-site resources",
      "entries": [
        {"name": "Greenroom",          "location": "Container",                    "details": "Hydration · electrolytes · costume station"},
        {"name": "Hair / Makeup",      "location": "Greenroom",                    "details": "Schedule per fitting tracker"},
        {"name": "Aerial point",       "location": "Position 3",                   "details": "Hoop / lyra · standard motor"},
        {"name": "Sweatbox cube",      "location": "Center dancefloor position 2", "details": "8 ft x 8 ft · 2-inch poles"},
        {"name": "Piano shell",        "location": "Stage",                        "details": "Pickup from Bellagio North Valet 5/13"},
        {"name": "Costume fittings",   "location": "Greenroom (off-site Sun-Mon)", "details": "Per rehearsal schedule"}
      ]
    },
    {
      "type": "code_of_conduct",
      "heading": "On-set conduct",
      "entries": [
        {"item": "Insomniac safety form", "detail": "Required before first call · Department 'Salvage City — No Ceilings'"},
        {"item": "Photo / social",        "detail": "By attending you consent to filming for promo + social. No personal posts during work hours."},
        {"item": "Substance use",         "detail": "Zero tolerance during work hours per deal memo · immediate termination"},
        {"item": "Late call",             "detail": "Notify Skylar via call/text — not Slack — minimum 30 min ahead"}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "Heat",        "detail": "99°F highs · drink water every break"},
        {"item": "Quiet space", "detail": "BOH corridor available for cool-down"}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability",
      "entries": [
        {"item": "Costume reuse", "detail": "Branded fittings preserved between shows · returns by 5/19"},
        {"item": "Single-use",    "detail": "Reusable water bottles required"}
      ]
    },
    {
      "type": "faq",
      "heading": "Talent FAQ",
      "entries": [
        {"q": "Where do I check in?",          "a": "Greenroom container at first call."},
        {"q": "Where do I eat?",               "a": "BOH staggered dinner at 17:30."},
        {"q": "Can I post on social?",         "a": "Production-approved only — see Code of Conduct."},
        {"q": "What if I'm running late?",     "a": "Call/text Skylar ASAP · do not Slack."},
        {"q": "Where do fittings happen?",     "a": "Off-site Sun-Mon at The ROCK Center for Dance · on-site greenroom from Tue."}
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

-- 2f. GUESTS ----------------------------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'guest'::guide_persona, 5, 'GUESTS',
  'Salvage City Supper Club — Guest Guide',
  'EDC Las Vegas 2026 · May 15-17 · Nomads Land',
  true,
  $JSON${
  "pageTitles": ["The Experience", "Plan Your Visit", "FAQ"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome to Salvage City",
      "body": "Salvage City is a 60-minute progressive supper club and immersive show — an oasis of abundance beyond the end of civilization. Located inside Nomads Land at Las Vegas Motor Speedway during EDC Las Vegas 2026 (May 15-17), the experience pairs a five-course culinary journey by world-renowned chefs with private performances, free-flowing cocktails, wines, and soft drinks, and elevated views of high-flying acts.",
      "callouts": [
        {"kind": "gold", "title": "Festival wristband required", "body": "Salvage City is only available to EDC Las Vegas pass holders. You must have your EDC wristband on to enter."},
        {"kind": "pink", "title": "Check in 15 minutes early", "body": "Bring your ticket confirmation and ID. Late guests may forfeit the opening course."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Seatings",
      "entries": [
        {"time": "Fri 5/15", "activity": "Five seatings · 60 min each", "note": "First seating opens at dusk"},
        {"time": "Sat 5/16", "activity": "Five seatings + after-party", "note": "Saturday extended hours"},
        {"time": "Sun 5/17", "activity": "Five seatings", "note": "Final-night gratitude moment"},
        {"time": "Per seating", "activity": "Check in 15 min before showtime · cocktails → courses → show → dessert", "note": ""}
      ]
    },
    {
      "type": "set_times",
      "heading": "What to expect",
      "entries": [
        {"artist": "Cocktail welcome",   "stage": "Cocktail floor", "start": "T-15", "end": "T-0"},
        {"artist": "Opening + first course","stage": "Floor",       "start": "00:00", "end": "00:17"},
        {"artist": "Main course + show",  "stage": "Tables · Main", "start": "00:17", "end": "00:42"},
        {"artist": "Show climax",         "stage": "Main",          "start": "00:42", "end": "00:55"},
        {"artist": "Dessert + exit",      "stage": "Tables",        "start": "00:55", "end": "01:00"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Guest concierge",
      "entries": [
        {"role": "Concierge",      "email": "hello@salvagecitysupperclub.com",   "name": "Average response 2 hours"},
        {"role": "Help desk",      "email": "help@salvagecitysupperclub.com"},
        {"role": "Instagram",      "name": "@salvagecitysupperclub"},
        {"role": "Tickets",        "name": "Ticket Fairy",                       "email": "support@theticketfairy.com"}
      ]
    },
    {
      "type": "resources",
      "heading": "Plan your visit",
      "entries": [
        {"name": "Where",            "location": "Nomads Land · Las Vegas Motor Speedway",           "details": "Inside the EDC LV festival footprint"},
        {"name": "Wristband",        "location": "Required at entry",                                "details": "EDC Las Vegas wristband + Salvage reservation"},
        {"name": "Check-in",         "location": "Salvage City entry rope",                          "details": "15 minutes before your seating · ticket + ID"},
        {"name": "Seating",          "location": "Family-style 20-tops",                             "details": "No assigned seats · groups arrive early to coordinate"},
        {"name": "Capacity",         "location": "Each seating",                                     "details": "Max 80 guests"},
        {"name": "After-party (Sat)","location": "Rooftop bar + dance floor",                        "details": "Saturday extended hours only"},
        {"name": "Restrooms",        "location": "Nomads Land aisle",                                "details": "Festival public facilities"},
        {"name": "Shuttles (early seating)","location": "Exterior shuttle drop",                     "details": "Coordinate with concierge for first seating"}
      ]
    },
    {
      "type": "accessibility",
      "heading": "Accessibility",
      "entries": [
        {"item": "Wheelchair access",  "detail": "Via main festival ADA path · let host know on arrival"},
        {"item": "Allergies / dietary","detail": "Communicate to your server on arrival · kitchen accommodates with local ingredients"},
        {"item": "Under 21",           "detail": "Soft drinks + non-alcoholic beverages · wristband marker required"},
        {"item": "Group seating",      "detail": "Groups larger than 20 should arrive early to coordinate"}
      ]
    },
    {
      "type": "sustainability",
      "heading": "Sustainability",
      "entries": [
        {"item": "Reusable service ware", "detail": "Where possible · Insomniac sustainability program"},
        {"item": "Composting",            "detail": "BOH organic stream"}
      ]
    },
    {
      "type": "code_of_conduct",
      "heading": "Conduct",
      "entries": [
        {"item": "Ages 18+",        "detail": "Per Ticket Fairy listing — ID required"},
        {"item": "No outside food", "detail": "Salvage curates the full progressive menu"},
        {"item": "Photo / social",  "detail": "Personal photos welcome — please no flash during the show"},
        {"item": "Insomniac terms", "detail": "All EDC Las Vegas terms of attendance apply"}
      ]
    },
    {
      "type": "faq",
      "heading": "Guest FAQ",
      "entries": [
        {"q": "How much is a reservation?",        "a": "$189 per person plus 18% service charge, taxes and fees. An Insomniac staff ticket tier is also available at $69."},
        {"q": "Do I need an EDC ticket?",          "a": "Yes — Salvage City is only available to EDC Las Vegas pass holders. You must have your festival wristband to enter."},
        {"q": "What's the dress code?",            "a": "Festival-glam · embrace the post-civilization aesthetic. Closed-toe footwear recommended for the Speedway grounds."},
        {"q": "Is there an age limit?",            "a": "Yes · 18+. Bring valid ID."},
        {"q": "What's included?",                  "a": "5-course culinary journey, free-flowing cocktails / wines / soft drinks, private performances, and elevated views of high-flying acts. 18% service charge included."},
        {"q": "Can I make dietary requests in advance?", "a": "No — please share allergies and dietary needs with your server on arrival. Our kitchen accommodates with local ingredients."},
        {"q": "Can I sit with my friends?",        "a": "Tables seat 20 family-style. Groups should arrive early to coordinate seating with the host."},
        {"q": "What time should I arrive?",        "a": "Check in 15 minutes before your seating. Late guests may forfeit the opening course."},
        {"q": "Where is Salvage at the festival?", "a": "Inside Nomads Land at Las Vegas Motor Speedway."},
        {"q": "How do I cancel or transfer?",       "a": "Refund + transfer policy via Ticket Fairy — see your purchase confirmation."}
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

-- 2g. TEMPORARY ACCESS (custom) ---------------------------------------------
with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug='edclv26-salvage-city' and o.slug='demo' and u.email='julian.clarkson@ghxstship.pro'
)
insert into event_guides (org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by)
select org_id, project_id, 'custom'::guide_persona, 5, 'TEMPORARY ACCESS',
  'Salvage City — Temporary Access',
  'Day-pass · journalists · vendor walks · talent +1s',
  true,
  $JSON${
  "pageTitles": ["Your Visit", "Where You Can Go"],
  "sections": [
    {
      "type": "overview",
      "heading": "Welcome — temporary access",
      "body": "You're entering Salvage City on a one-shot or limited-window credential. Could be a vendor walk-through, a fire marshal site visit, a journalist preview, a photographer pool slot, a Pineapple container delivery, or a talent +1. This guide tells you exactly what you can do, where you can go, and who's responsible for you while you're on site.",
      "callouts": [
        {"kind": "gold", "title": "You have an on-site shepherd", "body": "Your shepherd's name is on your day-pass. If you can't find them, call the Salvage Ops line — do not wander."},
        {"kind": "red",  "title": "If unescorted", "body": "Wait at the Salvage City front gate. Do not enter unattended areas."}
      ]
    },
    {
      "type": "schedule",
      "heading": "Your access window",
      "entries": [
        {"time": "Per day-pass", "activity": "Access valid only within window printed on your pass", "note": "Hard-out at end time — no extensions on site"},
        {"time": "Build days (5/12-14)", "activity": "Vendor + delivery + inspection windows", "note": "PPE required"},
        {"time": "Show days (5/15-17)",  "activity": "Press / photo pool slots only", "note": "Coordinate via concierge"}
      ]
    },
    {
      "type": "contacts",
      "heading": "Your shepherd",
      "entries": [
        {"role": "On-site shepherd",        "name": "Per your day-pass"},
        {"role": "Salvage Ops (back-up)",   "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com"},
        {"role": "Concierge",               "email": "hello@salvagecitysupperclub.com"},
        {"role": "Project Producer",        "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro"}
      ]
    },
    {
      "type": "credentials",
      "heading": "Where you can go",
      "columns": ["Temporary"],
      "rows": [
        {"area": "Salvage City front gate", "access": {"Temporary": true}},
        {"area": "Public dining floor",     "access": {"Temporary": "Escorted"}},
        {"area": "Backstage / Greenroom",   "access": {"Temporary": "Escorted only"}},
        {"area": "BOH Kitchen",             "access": {"Temporary": false}},
        {"area": "Bar (Main + Roof)",       "access": {"Temporary": false}},
        {"area": "Container BOH (Storage)", "access": {"Temporary": "Delivery windows only"}},
        {"area": "Roof Deck",               "access": {"Temporary": false}},
        {"area": "Aerial / Rigging Zone",   "access": {"Temporary": false}}
      ]
    },
    {
      "type": "sops",
      "heading": "Rules of engagement",
      "entries": [
        {"code": "T-01", "title": "If escorted", "steps": ["Stay with your escort at all times", "If they step away briefly, wait — do not move", "Carry your day-pass visibly", "Do not photograph or record without permission"]},
        {"code": "T-02", "title": "If unescorted (waiting)", "steps": ["Wait at Salvage City front gate", "Call the Salvage Ops line on your day-pass", "Do not enter the public dining floor without an escort"]}
      ]
    },
    {
      "type": "evacuation",
      "heading": "Evacuation",
      "routes": [
        {"from": "Anywhere on site", "to": "Nomads Land main aisle, north end", "via": "Front gate"}
      ],
      "assemblyPoint": "Nomads Land main aisle, north end — find your shepherd"
    },
    {
      "type": "code_of_conduct",
      "heading": "Conduct",
      "entries": [
        {"item": "Photography",      "detail": "Production-approved only · no unsanctioned capture of talent or guests"},
        {"item": "Insomniac terms",  "detail": "All EDC Las Vegas terms of attendance apply"},
        {"item": "Hard-out",         "detail": "Your access ends at the time on your pass — no extensions on site"}
      ]
    },
    {
      "type": "faq",
      "heading": "Temporary access FAQ",
      "entries": [
        {"q": "Where do I check in?",        "a": "Salvage City front gate — show your day-pass and ID."},
        {"q": "Can I bring a +1?",            "a": "Only if your day-pass lists +1. Otherwise no."},
        {"q": "Can I extend my access?",     "a": "No — passes are time-limited and not extensible on site."},
        {"q": "What if my shepherd is late?","a": "Wait at the front gate · call the Salvage Ops number on your pass."},
        {"q": "Can I take photos?",          "a": "Production-approved only. No unsanctioned capture of talent or guests."}
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
