-- ============================================================================
-- Salvage City — Brand Ambassador event_guide seed (8th persona, slot #4)
-- ============================================================================
-- Floor-staffed brand presence per the Julia Valler Inc roster. Lean Black-
-- Coffee 4-section structure plus a Stations custom section with verbatim
-- scripts per station (HOST I / HOST II / HOST VIP / MERCH / FLEX) and the
-- show beat each station supports.
--
-- Idempotent — re-applying refreshes the same row in place.
-- ============================================================================

with ctx as (
  select p.id as project_id, p.org_id, u.id as user_id
  from projects p join orgs o on o.id = p.org_id
  cross join users u
  where p.slug = 'edclv26-salvage-city'
    and o.slug = 'demo'
    and u.email = 'julian.clarkson@ghxstship.pro'
)
insert into event_guides (
  org_id, project_id, persona, tier, classification, title, subtitle, published, config, created_by
)
select org_id, project_id, 'brand_ambassador'::guide_persona, 3, 'BRAND AMBASSADOR USE',
  'Salvage City — Brand Ambassador',
  'Floor-staffed brand presence per the Julia Valler Inc roster — HOST I, HOST II, HOST VIP, MERCH, FLEX.',
  true,
  $JSON${
  "pageTitles": ["Welcome", "Stations", "Schedule", "FAQ", "Contacts"],
  "sections": [
    {"type": "overview", "heading": "Welcome to Salvage City",
     "body": "You are the brand-aligned face of Salvage City on the floor. Salvage City is a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway across May 15, 16, and 17, 2026. Five seatings nightly, 80 guests per seating. The seating moves through three rooms in 60 minutes — a 15-minute Speakeasy on the 1st floor, a 30-minute Dining Room on the 2nd floor, and a Phase 3 Deck (rooftop bar + merch) where the experience ends. You staff one of five stations: HOST I (outer rope), HOST II (interior dining), HOST VIP (curtained corners), MERCH (rooftop merch wall, separate from bar staff), or FLEX (gap-fill across stations). You are NOT bar staff and NOT Operations crew — your reporting line is your Brand Ambassador supervisor at Julia Valler Inc, with on-site escalation to Vida Sotakoun (Project Director, Hospitality).",
     "callouts": [
       {"kind": "gold", "title": "Insomniac Safety & Social Media Form", "body": "Sign the INSOMNIAC 2026 Safety & Social Media form before your first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field."},
       {"kind": "pink", "title": "Stay in role — don't cross-train into bar or service", "body": "MERCH is staffed only by Brand Ambassadors. Bar is staffed only by Dirty Olive. Servers are staffed only by Dirty Olive. Even if you see a queue, do not jump roles — flag the floor lead on Channel 3 and they'll surge support from the right team."}
     ]},
    {"type": "custom", "heading": "Your station — script + the show beat you support",
     "body": "**HOST I (Outer rope)** — first contact. Greet, scan EDC wristband + Salvage reservation, hand to HOST II within 30 seconds. Phase 1 is your most active phase; quiet in Phase 2 + Phase 3.\n• Greeting: 'Welcome to Salvage City. May I see your EDC wristband and your Salvage reservation, please?'\n• Hand-off: 'Tonight you'll move through three rooms in 60 minutes. HOST II will walk you in.'\n\n**HOST II (Interior dining)** — escort and set the mood. Walk guests from the Speakeasy entry to their family-style 20-top during the Phase 2 transition. Active during the dancer-led transition at minute 13–15.\n• Hand-off: 'Your seat is at table __. The Speakeasy lasts 15 minutes; the dancers will lead us into the dining room next.'\n\n**HOST VIP (Curtained corners)** — premium guest experience. Manage the upstage VIP corner curtains, brief guests on Phase 3 dessert split + upstairs cue, coordinate any sponsor-rep VIPs through Spotlight on Channel 1.\n• Briefing: 'Tonight your dessert is served at two stations downstairs — crème brûlée stage right, dessert cocktail stage left — then upstairs to the Deck for a complimentary Western whiskey cocktail.'\n\n**MERCH (Rooftop merch wall)** — sole staffer on the merch operation upstairs. Behind the neon 'MERCH' sign on the hard wall, in the same area as the rooftop bar but operationally separate. Most active during Phase 3B (00:55 → end of seating) and the post-Seating-V wind-down.\n• Greeting: 'Welcome up. Merch is right here behind the sign — let me know what catches your eye.'\n\n**FLEX (Gap-fill)** — free agent. Floor lead sends you where the queue is. Most likely active at HOST I during the Phase 1 surge or at MERCH during Phase 3 wind-down.\n• Posture: hold the rope at HOST I default; check the floor lead on Channel 3 every 10 minutes for re-deploys.\n\nAcross all stations: stay in show character. The room is candlelit and warm; smile, walk slowly, speak low. Do not announce 'sold out,' 'last call,' or other transactional language unless cued."},
    {"type": "schedule", "heading": "Brand Ambassador shift (per playbook Labor tab)",
     "entries": [
       {"time": "Thu 5/14, 17:00–22:00", "activity": "Friends & Family preview — 5-hour shift across HOST I / HOST II / HOST VIP / FLEX. Soft-open feedback rolls into Day 1.", "location": "Front rope → Speakeasy → Dining Room"},
       {"time": "Fri/Sat/Sun 5/15–17, 17:00–00:00", "activity": "Show-day shift — 7-hour. Call 17:00 (uniform check + station-chart confirmation), pre-show briefing 17:15, doors 18:00. Five seatings 18:30 → 23:30. Wrap 23:30 → 00:00.", "location": "Speakeasy → Dining → Deck"},
       {"time": "Mon 5/18, TBC", "activity": "Load-out support — HOST/VIP/MERCH/FLEX rows on the 5/18 Labor tab without time blocks; confirm with your supervisor before arriving.", "location": "Site"},
       {"time": "Per show — break window ≈20:30", "activity": "Staggered 15-min break between Seatings II and III. Float to BOH greenroom; floor lead coordinates.", "location": "BOH greenroom"}
     ]},
    {"type": "credentials", "heading": "Where you can go",
     "columns": ["Brand Ambassador"],
     "rows": [
       {"area": "Speakeasy / 1st floor", "access": {"Brand Ambassador": "On station (HOST I / HOST II / FLEX)"}},
       {"area": "Dining Room / 2nd floor", "access": {"Brand Ambassador": "On station (HOST II / HOST VIP / FLEX)"}},
       {"area": "VIP corners (curtained)", "access": {"Brand Ambassador": "HOST VIP only"}},
       {"area": "Deck (rooftop bar + merch)", "access": {"Brand Ambassador": "MERCH on station; others escort guests up only"}},
       {"area": "BOH Kitchen / Refrigerator container", "access": {"Brand Ambassador": false}},
       {"area": "Backstage / Greenroom", "access": {"Brand Ambassador": "Break window only"}},
       {"area": "Aerial / rigging / show floor during cue", "access": {"Brand Ambassador": false}}
     ]},
    {"type": "ppe", "heading": "Uniform + kit",
     "entries": [
       {"item": "Branded uniform", "required": true, "note": "Pickup at greenroom 17:00 on 5/14 (preview night). Sizing confirmed by Julia Valler Inc supervisor."},
       {"item": "Closed-toe footwear", "required": true, "note": "Comfortable for 7-hour standing shifts."},
       {"item": "Personal flashlight", "required": false, "note": "Recommended — venue is candlelit and dark."},
       {"item": "Reusable water bottle", "required": true, "note": "168 cases of bottled water on the venue advance; greenroom hydration station between seatings."}
     ]},
    {"type": "radio", "heading": "Radio channels",
     "channels": [
       {"channel": "1 — SC OPS", "purpose": "Listen-only by default. Channel 1 carries 'Spotlight' (VIP escort), 'Wind 25' (weather hold), 'Match' (flame cue). Don't transmit unless escalating."},
       {"channel": "3 — FOH/BOH", "purpose": "Your floor lead lives here. Use for station hand-offs, re-deploys, and break coordination."},
       {"channel": "5 — SECURITY", "purpose": "Listen-only — escalate to Insomniac security only via your floor lead."}
     ],
     "codeWords": [
       {"code": "Spotlight", "meaning": "VIP / sponsor rep moving across the floor — clear path. HOST VIP escorts to the curtained corner."},
       {"code": "Lost+1", "meaning": "Lost guest at your station — walk them to HOST II at the dining room entrance."},
       {"code": "Backup", "meaning": "Surge needed at your station — your floor lead will deploy a FLEX or another BA."}
     ]},
    {"type": "code_of_conduct", "heading": "On-floor conduct",
     "entries": [
       {"item": "Insomniac form", "detail": "Sign 'INSOMNIAC 2026: Safety Procedures and Social Media Policy' before first call."},
       {"item": "Phones", "detail": "Phones in greenroom only, on silent. No in-room photos. No personal social posts during work hours."},
       {"item": "Substance use", "detail": "Zero tolerance during work hours per Julia Valler Inc + Five Senses deal memo."},
       {"item": "Sponsor product handling", "detail": "Sponsor brands pour through Dirty Olive only — Brand Ambassadors do not pour drinks. If a guest asks about a sponsor brand, point them to the bar."},
       {"item": "Tipping", "detail": "18% service charge included in guest reservation; managed via Julia Valler Inc payroll. No individual tip jars on floor."}
     ]},
    {"type": "faq", "heading": "Brand Ambassador FAQ",
     "entries": [
       {"q": "Where do I check in?", "a": "Greenroom at 17:00 on show days (5/15, 5/16, 5/17) for uniform check, station-chart confirmation, radio check. Friends & Family preview is 17:00 on 5/14."},
       {"q": "Where do I eat?", "a": "Boxed lunch / dinner in the BOH greenroom 16:00–17:00 (overlapping the start of your call). Eat before doors — no eating on the floor."},
       {"q": "When do I get a break?", "a": "Staggered 15-min rotations between Seatings II and III (≈20:30). Floor lead coordinates."},
       {"q": "Where do I pick up my uniform?", "a": "Greenroom on 5/14 at 17:00. Sizing TBC — confirm with your Julia Valler Inc supervisor before arrival."},
       {"q": "Can I take photos?", "a": "Production-approved capture only. No personal phone capture during work hours; phones in greenroom on silent."},
       {"q": "Can I switch into bar or merch on the fly?", "a": "No. MERCH is staffed only by Brand Ambassadors at MERCH station; bar is staffed only by Dirty Olive. If a queue forms, call 'Backup' on Channel 3 and your floor lead deploys a FLEX."},
       {"q": "What's FLEX?", "a": "Gap-fill across stations. Default position is the rope at HOST I; check Channel 3 every 10 min for re-deploys."},
       {"q": "What if a sponsor rep comes through?", "a": "HOST VIP greets and escorts to the curtained corner. Confirm 'Spotlight' clearance with floor lead via Channel 3."},
       {"q": "Are tips distributed evenly?", "a": "The 18% service charge is included in guest reservation and managed via Julia Valler Inc payroll. Individual tip jars are not permitted on floor."},
       {"q": "What if I'm running late or sick?", "a": "Call or text your Julia Valler Inc supervisor at least 30 minutes ahead. They'll deploy a FLEX or call in a sub before your shift starts."}
     ]},
    {"type": "contacts", "heading": "Reporting + escalation",
     "entries": [
       {"role": "Brand Ambassador supervisor (Julia Valler Inc)", "name": "TBC — your booking contact at Julia Valler"},
       {"role": "On-site Hospitality lead / Project Director", "name": "Vida Sotakoun", "email": "Vidasotakoun@gmail.com", "phone": "(815) 298-8244"},
       {"role": "Production Manager", "name": "Skylar Contini-Enneper", "email": "skylarenneper@gmail.com", "phone": "(702) 689-6907"},
       {"role": "Project Producer (escalation)", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro", "phone": "(407) 885-6011"},
       {"role": "Show Caller (Corazon, on Channel 2 — listen only)", "name": "Rodrigo Guzman", "phone": "(818) 642-6258"},
       {"role": "Sponsor commercial lead (for sponsor-product questions)", "name": "TBC"},
       {"role": "Concierge", "email": "hello@salvagecitysupperclub.com"}
     ]}
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();
