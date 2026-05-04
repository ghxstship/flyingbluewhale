-- ============================================================================
-- Salvage City — Corazon ROS revision (2026-05-03)
-- ============================================================================
-- Source: Corazon Entertainment, "Run of Show by Corazon" (2026-05-03 04:48 UTC)
-- to julian.clarkson@ghxstship.pro, ramiro@rtechproductions.com,
-- frysarah8@gmail.com, paul@five-senses.co, vidasotakoun@gmail.com.
-- The ROS arrived as a .numbers spreadsheet — single sheet "Salvage City Run of
-- Show", single 11-column table with phase markers (Phase 1, Phase 2, Phase 3),
-- 60-minute show timeline plus an open-ended "After Feast" Viewing Deck block.
--
-- This is a CREATIVE PIVOT from the prior seed (20260428_000032). The
-- Western "Last Saloon" framing — sweatbox prelude, Sevdaliza/1975 opening,
-- Sean Paul hypnosis mash, Godspeed live vocal, host script, fire-act
-- transition — is wholly replaced by a three-phase ritual progression:
-- Speakeasy welcome (contortionist Existence) → Courtyard / Dining Table
-- (Belonging, Survival, Passion, Power, Trust, Celebration) → After Feast
-- (Viewing Deck deck drinks). LED poi replaces the fire act in the finale.
--
-- This migration replaces the affected JSONB sections in the production,
-- talent, and food-and-beverage event_guides for project edclv26-salvage-city.
-- All other sections (contacts, credentials, radio, evacuation, etc.) are left
-- intact. Idempotent — uses jsonb_set on the sections array, keyed by section
-- type, so re-applying refreshes the affected sections in place.
-- ============================================================================

do $$
declare
  v_org_id     uuid;
  v_project_id uuid;

  -- New production-persona set_times (Show beats per seating, 60-min runtime,
  -- plus open-ended Viewing Deck after-feast).
  v_production_set_times jsonb := $JSON${
    "type": "set_times",
    "heading": "Show beats per seating (60-minute runtime, plus open-ended after-feast)",
    "entries": [
      {"artist": "Phase 1 — Speakeasy welcome", "stage": "Speakeasy", "start": "00:00", "end": "00:15"},
      {"artist": "Guest Arrival — drink stations open, pass-around appetizers; ambience reference Beats Antique; band jam (Leo, Dayron, Oscar)", "stage": "Speakeasy", "start": "00:00", "end": "00:10"},
      {"artist": "Existence — contortionist awakens humanity (Sevdaliza, 'Human'); contortionist + 3 dancers + cello; food and drink service stops", "stage": "Speakeasy Center", "start": "00:10", "end": "00:13"},
      {"artist": "Transition to Dinner — full cast guides guests from speakeasy to courtyard; ambient track", "stage": "Speakeasy → Courtyard", "start": "00:13", "end": "00:15"},
      {"artist": "Phase 2 — Courtyard and Dining Table", "stage": "Courtyard / Dining Table", "start": "00:15", "end": "00:56"},
      {"artist": "Belonging — table choreo, guests invited to the table ('Welcome to Eclesia'); Dani, Derek, Kendrick, Amadeus + full cast", "stage": "Dining Table", "start": "00:15", "end": "00:18"},
      {"artist": "Food and Drink Service — wine service starts, take order; trumpet feature (Oscar) on table ('Horny' + one more)", "stage": "Dining Table", "start": "00:18", "end": "00:25"},
      {"artist": "Survival — 6 aerial dancers + 2 ground dancers on containers ('Run Boy Run'); Leo on drums; slow wine, finish take order", "stage": "Containers", "start": "00:25", "end": "00:28"},
      {"artist": "Food and Drink Service — sides down; ambient track", "stage": "Dining Table", "start": "00:28", "end": "00:33"},
      {"artist": "Passion — ballroom trio + bow and arrow specialty + buleria ('La Rumba Del Perdón'); Leo cajón, Dayron cello (wireless), Oscar palmas; transition into chip-eating bit; service stops", "stage": "Dining Table", "start": "00:33", "end": "00:36"},
      {"artist": "Food and Drink Service — food down ('Mestiza Rintintin' + one more)", "stage": "Dining Table", "start": "00:36", "end": "00:41"},
      {"artist": "Buffer / transition — 3 minutes unprogrammed in source ROS (gap flagged for Corazon)", "stage": "—", "start": "00:41", "end": "00:44"},
      {"artist": "Power — male ensemble on courtyard floor; women perform inside container windows ('Yo Quiero Ya'); service stops", "stage": "Courtyard floor + Container windows", "start": "00:44", "end": "00:47"},
      {"artist": "Food and Drink Service — band feature on top of containers, portable piano ('The Approach' by Beats Antique)", "stage": "Container roof", "start": "00:47", "end": "00:52"},
      {"artist": "Trust — featured acrobat on pole and center structure (cello solo intro into 'Berghain')", "stage": "Center Structure", "start": "00:52", "end": "00:55"},
      {"artist": "Finish Food and Drink Service — clear before finale; ambient track, 'Fire tones' lighting cue", "stage": "Dining Table", "start": "00:55", "end": "00:56"},
      {"artist": "Celebration — LED poi invitation, full-cast finale ('Joy'); dessert flame visual + dessert service", "stage": "Dining Table + Courtyard", "start": "00:56", "end": "01:00"},
      {"artist": "Phase 3 — After Feast — deck drinks, finish dessert; lounge music (open-ended end time per night)", "stage": "Viewing Deck", "start": "01:00", "end": "open"}
    ]
  }$JSON$::jsonb;

  -- Updated production-persona SOP-02 (show-call handoff) — preset list
  -- replaced. Old presets (sweatbox cube, sphere, LED fans, fire perimeter)
  -- belonged to the prior creative.
  v_production_sop_02_steps jsonb := $JSON$[
    "Show caller owns Channel 2 from speakeasy doors through the after-feast handoff.",
    "Pre-show preset confirmation: speakeasy fabric reveal (contortionist + 3 dancers + cello hidden centre); courtyard 20-tops set; container aerial rigs (×6) and ground positions; centre-structure pole for the Trust acrobat; LED poi rig staged for Celebration; band kit (Leo drums and cajón, Dayron cello wireless, Oscar trumpet, portable piano on container roof for 'The Approach').",
    "Hold all cues for the music timecode start.",
    "Lighting follows the ROS document — Paradox primary, 4Wall secondary.",
    "After bows, hand off to FOH for dessert and Viewing Deck deck-drinks service on Channel 3."
  ]$JSON$::jsonb;

  -- Updated production-persona radio code word "Match" — formerly fire-cue
  -- armed. Finale now uses LED poi (battery-operated). Renamed to "Glow"
  -- but kept under a Match alias so existing radio cards remain valid.
  v_production_code_match jsonb := $JSON${
    "code": "Match / Glow",
    "meaning": "LED poi rig armed for the Celebration finale (battery-operated, no live fire). Fire watch confirms perimeter clear of guests; previously this cue covered a live fire act, removed in the 2026-05-03 ROS revision."
  }$JSON$::jsonb;

  -- New talent-persona overview body. Replaces the prior body that referenced
  -- the Western show beats (Sweatbox / 1975 / Hypnosis mash / Godspeed / fire
  -- act). Preserves the safety callout (Insomniac form) but drops the
  -- fire-performer permit reference, which is moot under LED poi.
  v_talent_overview jsonb := $JSON${
    "type": "overview",
    "heading": "Welcome to Salvage City",
    "body": "You are the show. We run five 60-minute seatings each night across May 15, 16, and 17 inside Nomads Land at the Las Vegas Motor Speedway. Creative is led by No Ceilings Entertainment with Corazon Entertainment (Rodrigo Guzman, Celine Franco) as performance producer. The show runs in three phases. Phase 1 Speakeasy — guest arrival on a Beats Antique reference with the band jamming live (Leo, Dayron, Oscar); contortionist Existence on Sevdaliza's 'Human'; transition to dinner. Phase 2 Courtyard and Dining Table — Belonging on 'Welcome to Eclesia' (Dani, Derek, Kendrick, Amadeus + full cast); Survival with six aerial and two ground dancers on the containers ('Run Boy Run'); Passion as a ballroom trio with the bow-and-arrow specialty and a buleria ('La Rumba Del Perdón'); Power with the male ensemble on the courtyard floor and women in the container windows ('Yo Quiero Ya'); Trust with the featured acrobat on the centre structure / pole on cello solo into 'Berghain'; Celebration as a full-cast finale on 'Joy' with LED poi and dessert flame visual. Phase 3 After Feast — deck drinks and dessert on the Viewing Deck. Aerial work happens on the containers; the featured acrobat performs on the centre structure. Live band: Leo (drums and cajón), Dayron (cello — wireless during Passion), Oscar (trumpet and palmas, with portable piano on the container roof for 'The Approach' by Beats Antique).",
    "callouts": [
      {"kind": "red", "title": "Insomniac safety form is mandatory", "body": "Sign the INSOMNIAC 2026 Safety and Social Media Policy form before your first call. Use 'Salvage City — No Ceilings' in the Department / Vendor field. The link is in the 2026 production playbook."}
    ]
  }$JSON$::jsonb;

  -- New F&B-persona set_times — service-cue interleaving against the ROS
  -- show beats. Critical for BOH and FOH coordination because the new ROS
  -- has tighter and more specific stop/start cues than the prior creative.
  v_fb_set_times jsonb := $JSON${
    "type": "set_times",
    "heading": "Service cues against the show ROS (60-minute seating)",
    "entries": [
      {"artist": "Drink stations open, pass-around appetizers", "stage": "Speakeasy", "start": "00:00", "end": "00:10"},
      {"artist": "STOP pass-around and drink service for Existence cue", "stage": "Speakeasy", "start": "00:10", "end": "00:13"},
      {"artist": "Speakeasy service ends — finish food and drink before transition", "stage": "Speakeasy", "start": "00:13", "end": "00:15"},
      {"artist": "No service window — Belonging table choreo (do not interrupt)", "stage": "Dining Table", "start": "00:15", "end": "00:18"},
      {"artist": "Wine service starts, take order", "stage": "Dining Table", "start": "00:18", "end": "00:25"},
      {"artist": "Slow wine service, finish take order — Survival aerial cue", "stage": "Dining Table", "start": "00:25", "end": "00:28"},
      {"artist": "Sides down", "stage": "Dining Table", "start": "00:28", "end": "00:33"},
      {"artist": "STOP food and drink service — Passion ballroom trio + bow and arrow + buleria", "stage": "Dining Table", "start": "00:33", "end": "00:36"},
      {"artist": "Food down (mains)", "stage": "Dining Table", "start": "00:36", "end": "00:41"},
      {"artist": "Buffer / transition — service hold (gap flagged in source ROS)", "stage": "Dining Table", "start": "00:41", "end": "00:44"},
      {"artist": "STOP food and drink service — Power male ensemble + container windows", "stage": "Dining Table", "start": "00:44", "end": "00:47"},
      {"artist": "Service window — band on container roof feature ('The Approach')", "stage": "Dining Table", "start": "00:47", "end": "00:52"},
      {"artist": "Service window — Trust acrobat on centre structure (do not interrupt the centre)", "stage": "Dining Table", "start": "00:52", "end": "00:55"},
      {"artist": "FINISH food and drink service — clear plates before finale", "stage": "Dining Table", "start": "00:55", "end": "00:56"},
      {"artist": "Dessert flame visual + dessert service — Celebration finale on 'Joy'", "stage": "Dining Table + Courtyard", "start": "00:56", "end": "01:00"},
      {"artist": "After Feast — deck drinks and finish dessert on the Viewing Deck", "stage": "Viewing Deck", "start": "01:00", "end": "open"}
    ]
  }$JSON$::jsonb;
begin
  select o.id, p.id into v_org_id, v_project_id
    from orgs o
    join projects p on p.org_id = o.id
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city'
   limit 1;

  if v_project_id is null then
    raise exception 'Salvage City project not found — apply 20260428_000032 first.';
  end if;

  -- ── 1. PRODUCTION PERSONA — replace set_times, SOP-02 steps, "Match" code ─
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           (
             select jsonb_agg(
               case
                 when section->>'type' = 'set_times' then v_production_set_times
                 when section->>'type' = 'sops' then jsonb_set(
                   section,
                   '{entries}',
                   (
                     select jsonb_agg(
                       case
                         when entry->>'code' = 'SOP-02'
                           then jsonb_set(entry, '{steps}', v_production_sop_02_steps)
                         else entry
                       end
                     )
                     from jsonb_array_elements(section->'entries') as entry
                   )
                 )
                 when section->>'type' = 'radio' then jsonb_set(
                   section,
                   '{codeWords}',
                   (
                     select jsonb_agg(
                       case
                         when cw->>'code' = 'Match' then v_production_code_match
                         else cw
                       end
                     )
                     from jsonb_array_elements(section->'codeWords') as cw
                   )
                 )
                 else section
               end
             )
             from jsonb_array_elements(config->'sections') as section
           )
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'staff';

  -- ── 2. TALENT PERSONA — replace overview ──────────────────────────────────
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           (
             select jsonb_agg(
               case
                 when section->>'type' = 'overview' then v_talent_overview
                 else section
               end
             )
             from jsonb_array_elements(config->'sections') as section
           )
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'artist';

  -- ── 3. F&B PERSONA — append set_times if absent, replace if present ───────
  update event_guides
     set config = jsonb_set(
           config,
           '{sections}',
           case
             when exists (
               select 1
                 from jsonb_array_elements(config->'sections') as section
                where section->>'type' = 'set_times'
             ) then (
               select jsonb_agg(
                 case
                   when section->>'type' = 'set_times' then v_fb_set_times
                   else section
                 end
               )
               from jsonb_array_elements(config->'sections') as section
             )
             else (config->'sections') || jsonb_build_array(v_fb_set_times)
           end
         ),
         updated_at = now()
   where org_id = v_org_id and project_id = v_project_id and persona = 'vendor';
end $$;

-- ============================================================================
-- VERIFICATION (informational — not enforced)
-- ============================================================================
-- After apply, expect:
--   - production guide set_times "heading" = 'Show beats per seating
--     (60-minute runtime, plus open-ended after-feast)' and 18 entries.
--   - talent guide overview body to mention 'three phases', 'LED poi',
--     'Berghain', 'Welcome to Eclesia'.
--   - F&B guide to contain a set_times section with 16 service-cue entries
--     and the heading 'Service cues against the show ROS (60-minute seating)'.
-- ============================================================================
