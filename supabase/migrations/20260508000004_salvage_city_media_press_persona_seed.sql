-- ============================================================================
-- Salvage City — Media & Press event_guide seed (8th persona, slot #7)
-- ============================================================================
-- Embargo-bound press / photographer pool / interview window credential.
-- Lean Black-Coffee 4-section structure plus a custom Embargo + Image Rights
-- + Waiver framework section.
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
select org_id, project_id, 'media_press'::guide_persona, 4, 'MEDIA & PRESS USE',
  'Salvage City — Media & Press',
  'Press preview, photo pool, interview windows, embargo policy.',
  true,
  $JSON${
  "pageTitles": ["Welcome", "Embargo + Rights", "Schedule", "FAQ", "Contacts"],
  "sections": [
    {"type": "overview", "heading": "Welcome — Media & Press credential",
     "body": "Salvage City Supper Club is a 60-minute progressive supper club paired with an immersive show, set inside Nomads Land at the Las Vegas Motor Speedway across May 15, 16, and 17, 2026 — five seatings nightly, 80 guests per seating, ~1,200 unique guests across the run. Your credential gets you a defined window of access: a press preview during build days (5/12–5/14), a photo-pool slot during show days, or a scheduled interview with a producer / chef / show caller. The credential is not a guest pass — you do not have a 60-minute seating reservation. Embargoes and image-rights terms are issued with your credential and are binding.",
     "callouts": [
       {"kind": "red", "title": "Embargo, image rights, and waivers are non-negotiable", "body": "Do not publish before your embargo lifts. Personal cell capture of talent is prohibited. Talent and guest faces require signed waivers before publication — talent waivers held by Corazon Entertainment, guest waivers via the Salvage release form (concierge to provide). Confirm clearance with your booking lead at Five Senses before any image goes live."},
       {"kind": "pink", "title": "Show timing — what's photographable when", "body": "The 'Celebration' Phase 3 finale (4 lasers + 4 haze + disco ball + live flaming dessert) is your hero moment. The Speakeasy phase (live trio, contortionist, 'Existence' on Sevdaliza's 'Human') is candlelit and intimate — flash is prohibited. Sanctioned shot list available through the photo pool credential."}
     ]},
    {"type": "custom", "heading": "Embargo, image rights, and waiver framework",
     "body": "Issued with your credential. Confirm specifics with your Five Senses booking lead before publication.\n\n**Embargo:**\n• Press preview attendees (build-day 5/12–5/14): embargo until first public seating Fri 5/15 18:30 PT.\n• Show-day attendees (5/15–5/17): no embargo on same-day same-night content; 24-hour delay on next-night content unless waived.\n• Long-form features / podcasts / TV segments: per individual booking agreement.\n\n**Image rights:**\n• Sanctioned shot list — Phase 1 Speakeasy ambient (no flash), 'Celebration' finale flame moment (Phase 3, 00:56–01:00), the rooftop merch wall, branded glassware on the 20-tops, the Western whiskey exit cocktail at the Deck bar.\n• Salvage / Five Senses / Insomniac retain co-license on all credentialed images for use in the 2026 marketing run + post-event recap.\n• Outlet retains primary editorial use within the credential terms.\n\n**Waiver requirement:**\n• Talent faces — require a signed talent waiver. Waivers held by Corazon Entertainment.\n• Guest faces in close-up — require Salvage guest release form (concierge to provide for any image where a single identifiable guest is featured).\n• Wide-shot / crowd photography — covered by the EDC LV terms-of-attendance signage at the festival entry; no individual release required.\n\n**Prohibited:**\n• Personal cell capture of talent.\n• Flash photography during the show (Phase 1 Existence, Phase 2 numbered acts, Phase 3 Celebration).\n• Capture of BOH / kitchen / bar prep zones.\n• Capture inside VIP curtained corners during a seating without explicit guest + sponsor consent."},
    {"type": "schedule", "heading": "Press, photo pool, and interview windows",
     "entries": [
       {"time": "Tue 5/12 → Wed 5/13", "activity": "Press preview windows during build days. Hard-hat tour of the container build (refrigerator 1st floor, car 2nd floor center). PPE required — closed-toe footwear, high-vis on the build floor.", "location": "Site", "note": "Coordinate via Five Senses press lead (TBC). Embargo until 5/15 18:30 PT."},
       {"time": "Thu 5/14, 16:00–17:00", "activity": "Dress Rehearsal 1 — limited press-pool slot for shot acquisition. No interview window during this slot.", "location": "Onsite", "note": "Capture sanctioned shot list only; talent waivers must be on file."},
       {"time": "Thu 5/14, 18:00–19:00", "activity": "Dress Rehearsal 2 — second press-pool slot.", "location": "Onsite", "note": "Embargo until 5/15."},
       {"time": "Thu 5/14, 20:00–21:30", "activity": "Friends & Family soft open — invitee-only with limited press observer slots. Cocktail hour 20:00–20:30, seated dinner 20:30–21:30.", "location": "Speakeasy + Public Dining", "note": "Capture is observation-only unless you have a photographer credential."},
       {"time": "Fri/Sat/Sun 5/15–17", "activity": "Photo pool slots during specific seatings — typically Seatings I and III. Coordinate slot assignment via your booking lead at Five Senses ahead of time.", "location": "Speakeasy / Dining / Deck", "note": "Sanctioned shot list applies. Phase 3 'Celebration' is the hero moment — no flash, but lasers + haze + dessert flame are fully photographable."},
       {"time": "By appointment", "activity": "Interview windows — Producer (Julian Clarkson), Show Caller (Rodrigo Guzman), Chef Eyal Banayan. 15–30 min slots booked via the press lead.", "location": "BOH greenroom or designated press corner", "note": "Brandy Leviner (Choreographer) available for choreography-focused interviews. Bring your own audio kit."},
       {"time": "Wrap window", "activity": "Post-show wrap content — short interview slots available 23:30–00:30 by appointment.", "location": "BOH greenroom", "note": "Subject to talent availability."}
     ]},
    {"type": "credentials", "heading": "Where you can go",
     "columns": ["Media & Press"],
     "rows": [
       {"area": "Speakeasy / 1st floor", "access": {"Media & Press": "During press-pool slot only"}},
       {"area": "Dining Room / 2nd floor", "access": {"Media & Press": "During press-pool slot only"}},
       {"area": "Deck (rooftop bar + merch)", "access": {"Media & Press": "After your assigned seating only"}},
       {"area": "BOH greenroom (interview corner)", "access": {"Media & Press": "By appointment for interviews"}},
       {"area": "Backstage / talent dressing", "access": {"Media & Press": false}},
       {"area": "BOH Kitchen / bar prep", "access": {"Media & Press": false}},
       {"area": "Aerial / rigging", "access": {"Media & Press": false}},
       {"area": "VIP curtained corners", "access": {"Media & Press": "Not without explicit guest + sponsor consent"}}
     ]},
    {"type": "code_of_conduct", "heading": "On-site conduct",
     "entries": [
       {"item": "Embargo", "detail": "Bound by your credential terms. Confirm date/time with your booking lead at Five Senses."},
       {"item": "Talent waivers", "detail": "All identifiable talent faces require a signed waiver before publication. Waivers held by Corazon. Default: do not publish a talent close-up without confirmation."},
       {"item": "Guest waivers", "detail": "Identifiable single-guest close-ups require the Salvage release form. Concierge will issue on request."},
       {"item": "Insomniac terms", "detail": "All EDC Las Vegas terms of attendance apply. Full venue rules at lasvegas.electricdaisycarnival.com."},
       {"item": "Sponsored content", "detail": "Disclose any brand partnership in your published content per outlet policy + FTC guidelines. Sanctioned brand mentions only via Five Senses sponsor commercial lead."},
       {"item": "Hard-out", "detail": "Your credential expires at the time printed on your day-pass — no extensions on site."}
     ]},
    {"type": "faq", "heading": "Press FAQ",
     "entries": [
       {"q": "Where do I check in?", "a": "Salvage City front gate. Bring your day-pass / press credential and a valid government-issued ID."},
       {"q": "Can I bring a +1?", "a": "Only if your credential explicitly lists a +1. Photographer + writer pairs typically credential separately."},
       {"q": "When is my embargo lifted?", "a": "Build-day previews: embargo until first public seating Fri 5/15 18:30 PT. Show-day attendees: no embargo on same-night content. Custom embargoes per booking."},
       {"q": "What can I photograph?", "a": "Sanctioned shot list — Speakeasy ambient (no flash), 'Celebration' finale flame moment (no flash), rooftop bar + merch wall, branded glassware, exit cocktail. No talent close-ups without waiver clearance. No BOH / kitchen / bar prep."},
       {"q": "Can I record audio?", "a": "Ambient room audio yes; isolated talent audio no without a signed waiver. For interview audio, bring your own kit; greenroom corner has a quiet recording space by appointment."},
       {"q": "Can I do a talent interview?", "a": "By appointment via Five Senses press lead. 15–30 min slots with Producer, Show Caller, Chef, or Choreographer. Subject to talent availability around show calls."},
       {"q": "What if my photographer is delayed?", "a": "Wait at the front gate. Call the Salvage press line on the back of your credential. Do not enter unattended."},
       {"q": "What's the dress / kit guidance?", "a": "Festival-appropriate, closed-toe footwear, light layers (Vegas in May). Pro camera kits: lens hood for haze, low-light prime preferred (no flash). PPE for build days: closed-toe + high-vis on build floor."},
       {"q": "Can I publish a guest's face?", "a": "Identifiable single-guest close-ups require the Salvage guest release form (concierge issues on request). Wide-shot / crowd photography is covered by the EDC LV terms-of-attendance and does not require individual release."},
       {"q": "Where can I get b-roll of the build?", "a": "Press preview windows on Tue 5/12 and Wed 5/13. Confirm slot via your booking lead at Five Senses; PPE required."}
     ]},
    {"type": "contacts", "heading": "Press leads + escalation",
     "entries": [
       {"role": "Press / commercial lead at Five Senses (booking + embargo)", "name": "TBC"},
       {"role": "Project Producer (interview windows)", "name": "Julian Clarkson", "email": "julian.clarkson@ghxstship.pro", "phone": "(407) 885-6011"},
       {"role": "Show Caller (Corazon — show + creative interviews)", "name": "Rodrigo Guzman", "email": "info@corazonentertainment.com", "phone": "(818) 642-6258"},
       {"role": "Choreographer (Corazon — choreography interviews)", "name": "Brandy Leviner", "email": "Brandy.Leviner@gmail.com", "phone": "(843) 862-2053"},
       {"role": "Executive Chef (culinary interviews)", "name": "Eyal Banayan", "email": "Chefbanayan@gmail.com", "phone": "(310) 666-5451"},
       {"role": "Concierge (guest waivers + general)", "email": "hello@salvagecitysupperclub.com"},
       {"role": "Instagram", "name": "@salvagecitysupperclub"}
     ]}
  ]
}$JSON$::jsonb,
  user_id
from ctx
on conflict (project_id, persona) do update set
  tier = excluded.tier, classification = excluded.classification, title = excluded.title,
  subtitle = excluded.subtitle, published = excluded.published, config = excluded.config,
  updated_at = now();
