-- ============================================================================
-- Salvage City — Corazon ROS revision findings (seeded as annotations)
-- ============================================================================
-- Backfills the 19 findings surfaced by the 2026-05-03 Corazon ROS review onto
-- the EDCLV26 Salvage City project as polymorphic annotations. High-severity
-- items are flags assigned to Julian with due dates set to provide load-in
-- runway (5/8). Lower-severity items are flags or notes against the project
-- record itself for visibility in triage.
--
-- Idempotent — keys on metadata->>'finding_id' to prevent duplicates on
-- re-apply.
-- ============================================================================

do $$
declare
  v_org_id     uuid;
  v_project_id uuid;
  v_julian     uuid;
  v_load_in    date := '2026-05-08';
  v_first_show date := '2026-05-15';
begin
  select o.id, p.id, u.id
    into v_org_id, v_project_id, v_julian
    from orgs o
    join projects p on p.org_id = o.id
    join users u on lower(u.email) = 'julian.clarkson@ghxstship.pro'
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city'
   limit 1;

  if v_project_id is null then
    raise exception 'Salvage City project missing — apply 20260428_000032 first.';
  end if;

  -- Idempotency: skip if any of these findings already exist.
  if exists (
    select 1 from annotations
     where project_id = v_project_id
       and metadata ? 'finding_id'
       and (metadata->>'finding_id') like 'sc-ros-2026-05-03-%'
  ) then
    raise notice 'Salvage City ROS findings already seeded — skipping.';
    return;
  end if;

  -- Helper inline: build a row.
  -- Each call passes finding id, severity, kind, due_at offset, tags, title, body, confirmation_required.

  insert into annotations (
    org_id, project_id, target_table, target_id, kind, severity, status,
    title, body, tags, confirmation_required,
    due_at, assigned_to, created_by, metadata
  ) values

  -- ── ROS data-quality gaps (push back to Corazon) ────────────────────────
  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    '3-minute unprogrammed gap at 0:41–0:44 in ROS',
    'The 2026-05-03 Corazon ROS shows no row between the post-Passion food-down service window (ends 00:41) and the Power cue (starts 00:44). Either an intentional buffer or a missing transition. Confirm with Corazon and update the production-persona event_guide set_times if the gap is filled.',
    array['ros-revision','corazon','pending-confirmation','show-beats'],
    true, v_load_in - 3, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-01','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Phase 3 "After Feast" has no end time',
    'The Viewing Deck after-feast block in the new ROS is open-ended. Bar service, security perimeter, and crew wrap need a defined soft close. Coordinate with Insomniac and Five Senses on a hard end time per night.',
    array['ros-revision','corazon','pending-confirmation','closing-time','venue-coordination'],
    true, v_load_in, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-02','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'info', 'open',
    'Trust act (00:52–00:55) — F&B service column blank in source ROS',
    'Encoded as "do not interrupt the centre structure" in the F&B persona set_times. Need Corazon to confirm whether discreet service to outer 20-tops is allowed during the centre acrobat moment.',
    array['ros-revision','corazon','pending-confirmation','f-and-b'],
    true, v_load_in, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-03','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'info', 'open',
    'Power act (00:44–00:47) — Live Music column blank',
    'Source ROS lists "Yo Quiero Ya" only. Confirm whether Leo / Dayron / Oscar provide live underscore or remain silent during the male ensemble beat.',
    array['ros-revision','corazon','pending-confirmation','live-music'],
    true, v_load_in, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-04','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'critical', 'open',
    'Cast roster — first names only, no contact data',
    'The new ROS names Dani, Derek, Kendrick, Amadeus (lead dancers) and Leo, Dayron, Oscar (band) without last names, emails, or phone numbers. Production Playbook directory still has 10× nameless "Performer" rows and 4× nameless "Musician" rows under Corazon Entertainment. Talent credentials cannot issue without complete records — block before credentialing window.',
    array['ros-revision','corazon','pending-confirmation','cast-roster','credentialing','critical-path'],
    true, v_load_in - 4, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-05','source','Run of Show by Corazon (2026-05-03)','related_threads','19dec2a71fc565b1')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'critical', 'open',
    'Single-seating ROS vs five-seating cadence — clarify',
    'The new ROS shows ONE 60-minute timeline. Existing project description and prior seed assume five 60-minute seatings nightly. The 2026-05-04 ROS revision migration assumes Phases 1+2 repeat 5× per night and Phase 3 is a whole-evening lounge. Get explicit written confirmation from Corazon and Sarah Fry before publishing the talent and F&B cue sheets.',
    array['ros-revision','corazon','pending-confirmation','show-cadence','critical-path'],
    true, v_load_in - 5, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-06','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Host script — present in prior creative, absent in new ROS',
    'The 2025 EDSEA "Last Saloon" creative had a host (Doug) running Scene 2 dialogue. The 2026-05-03 ROS has no host. Confirm whether the host role is removed or simply unwritten.',
    array['ros-revision','corazon','pending-confirmation','show-beats'],
    true, v_load_in - 3, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-07','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'note', 'info', 'open',
    'Source ROS row 20 is empty',
    'Last row of the .numbers source ROS is wholly blank. Treat as orphan; flag for Corazon to remove from their next revision.',
    array['ros-revision','corazon','data-quality'],
    false, null, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-08','source','Run of Show by Corazon (2026-05-03)')),

  -- ── Cue-mapping work for technical teams ────────────────────────────────
  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Visual column is conceptual — needs translation to fixture cues',
    'The ROS uses concept words (Birth/Awakening, Tribe, Chaos, Passion, Strength, Identity, Trust, Ritual, Joy). Paradox lighting design and 4Wall need to translate these into a concrete cue list before tech rehearsals. Owner: Paradox primary, 4Wall secondary.',
    array['ros-revision','technical','lighting','paradox','4wall','cue-list'],
    false, v_load_in + 1, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-09','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Wind-25 fallback choreography for new aerial positions',
    'SOP-03 requires aerial cues fall back to floor-only choreography on sustained 25 mph wind. The new ROS has aerial work in TWO places — Survival on the containers (00:25–00:28) and Trust on the centre structure / pole (00:52–00:55). Need fallback choreo specified for both, by Corazon, before tech rehearsals.',
    array['ros-revision','corazon','safety','wind-contingency','aerial'],
    true, v_load_in + 4, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-10','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Music licensing / clearances for new ROS tracks',
    'Tracks listed in the new ROS: Sevdaliza "Human", "Welcome to Eclesia", "Run Boy Run", "La Rumba Del Perdón", "Yo Quiero Ya", "Mestiza Rintintin", "The Approach" by Beats Antique, "Berghain", "Joy", "Horny". Confirm ASCAP-BMI clearance or that final edits are provided by Corazon. R-Tech needs final tracks to build the playlist.',
    array['ros-revision','corazon','licensing','audio','r-tech'],
    true, v_load_in - 2, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-11','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Portable piano on container roof — net-new prop',
    'New ROS calls for a portable piano on top of a container during "The Approach" (00:47–00:52). Confirm rigging weight load on container + power drop with Pineapple Agency and 4Wall.',
    array['ros-revision','corazon','rigging','pineapple','4wall','net-new'],
    true, v_load_in - 2, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-12','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'critical', 'open',
    'Bow-and-arrow specialty in Passion — safety review needed',
    'Net-new prop / choreography in the Passion act (00:33–00:36). Indoor projectile choreography requires a Pineapple Agency safety review and Insomniac fire marshal sign-off before tech rehearsals.',
    array['ros-revision','corazon','safety','props','net-new','insomniac','critical-path'],
    true, v_load_in - 2, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-13','source','Run of Show by Corazon (2026-05-03)')),

  -- ── Open items from prior threads (unchanged from prior reports) ─────────
  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'info', 'open',
    'Fire-act permit conversation — close formally',
    'The 2026-04-21 fire-act permit thread with Corazon is moot under the new LED poi finale. Send a one-line note closing the thread so it stops blocking.',
    array['ros-revision','corazon','admin','close-out'],
    false, current_date + 1, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-14','source','Email thread 19db23ecc900a113 (2026-04-21)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'critical', 'open',
    'Container modifications — Pineapple Agency unresponsive',
    'Last action on the EDCLV26 Salvage City container modifications thread with Pineapple was 2026-04-23 (12 days silent as of 2026-05-04). Critical-path for the 2026-05-08 load-in. The new ROS adds a "container windows for women in Power scene" requirement that should be folded into the modification spec.',
    array['ros-revision','pineapple','container-build','critical-path','vendor'],
    true, v_load_in - 4, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-15','source','Email thread 19d888f860df1594 (last 2026-04-23)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Forward ROS to F&B / drink department',
    'Rodrigo asked to share the ROS with food and drink. The 2026-05-03 ROS to-line did not include Levy / Eyal Banayan, Crème by Me, or Dirty Olive. Forward the ROS plus the new F&B set_times cue table from migration 20260504000002.',
    array['ros-revision','corazon','f-and-b','distribution'],
    false, current_date + 2, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-16','source','Run of Show by Corazon (2026-05-03)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Cube structure ($5K) — no PO on file; check scope',
    'Cube structure was confirmed verbally by Corazon on 2026-04-07 at $5K with install included. No procurement record exists. The new ROS does not reference a cube — confirm whether the cube is still in scope before issuing a PO.',
    array['ros-revision','corazon','procurement','pending-confirmation'],
    true, v_load_in - 5, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-17','source','Email thread 19d69bdf6a8c6efb (2026-04-07)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'info', 'open',
    'Insomniac warehouse — 2 chairs status',
    '2026-04-15: Melanie Conn approved 2 pallets for borrow and was checking on 2 chairs. No recorded follow-through. Ping for status.',
    array['insomniac','warehouse','procurement','pending-confirmation'],
    false, current_date + 5, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-18','source','Email thread 19db8f78d038d4cb (2026-04-15)')),

  (v_org_id, v_project_id, 'projects', v_project_id, 'flag', 'warning', 'open',
    'Insomniac Safety + Social Media form — no attestation tracking',
    'Required for every team member before first call. No tracked attestation table exists. Either add a deliverable per crew or extend credentials.attestations to gate issuance on completion.',
    array['insomniac','safety','credentialing','process-gap'],
    true, v_load_in - 3, v_julian, v_julian,
    jsonb_build_object('finding_id','sc-ros-2026-05-03-19','source','Insomniac 2026 Safety & Social Media Policy'));

  raise notice 'Seeded 19 Salvage City ROS findings as annotations.';
end $$;
