-- ============================================================================
-- Salvage City — offer-letter alignment to the EDCLV26 Playbook v3 (Labor tab)
-- ============================================================================
-- Per Julian (2026-05-08), reading the playbook Labor tab:
--   * Brett Mosher (HEQ), Adam Waddle + Josh Parra (Carpentry/AV) — only work
--     5/12, 5/13, 5/14, 5/18, 5/19. 5/11 has rows without time blocks (drop
--     hold day → engagement_start moves from 5/11 to 5/12). 5/15–17 are dark
--     inside the engagement window — logged in offer_letter_activity for
--     payroll reconciliation rather than splitting the engagement.
--   * Mariah Williams — PA-Runner on rehearsal/load-in/load-out days,
--     PA-MERCH on show days 5/15–17. Logged as role flip; offer letter
--     primary role stays production-assistant-runner. Show-day MERCH coverage
--     is operational (captured in the Brand Ambassador + Operations guides).
--   * Skylar Contini-Enneper — 5/14 is an 8-hr day (vs. 10-hr standard).
--     Logged for payroll pro-rate.
--   * Julia Valler Inc — new staffing vendor for Brand Ambassadors. Insert
--     into vendors. Add 4 placeholder crew_members + draft offer letters
--     for HOST I, HOST II, HOST VIP, FLEX. Names TBC; offer letters move
--     to 'sent' once Julia Valler supplies the assigned BAs.
--   * MERCH show days are absorbed by Mariah Williams (GHXSTSHIP), not
--     contracted via Julia Valler. FLEX is scoped 5/14 preview only
--     (0 hr show days per Labor tab).
--
-- Idempotent — re-applying refreshes the same rows.
-- ============================================================================

do $$
declare
  v_org_id      uuid;
  v_project_id  uuid;
  v_julian      uuid;
  v_venue_id    uuid;
  v_julia_vendor_id uuid;
  v_ba_host_i    uuid;
  v_ba_host_ii   uuid;
  v_ba_host_vip  uuid;
  v_ba_flex      uuid;
begin
  select o.id, p.id, u.id
    into v_org_id, v_project_id, v_julian
    from orgs o
    join projects p on p.org_id = o.id
    join users u on lower(u.email) = 'julian.clarkson@ghxstship.pro'
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city'
   limit 1;

  if v_project_id is null then
    raise exception 'Salvage City project missing — apply playbook v2 alignment first.';
  end if;

  select id into v_venue_id from venues
   where org_id = v_org_id and project_id = v_project_id
     and (name = 'Nomads Land — Salvage City' or name ilike '%salvage%')
   limit 1;

  -- ── 1. Brett / Adam / Josh: drop 5/11 hold, engagement_start = 5/12 ─────
  update offer_letters ol
     set engagement_start = date '2026-05-12',
         updated_at = now()
    from crew_members cm
   where cm.id = ol.crew_member_id
     and ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and lower(cm.email) in (
       'brett@ghxstship.pro',
       'adam@ghxstship.pro',
       'josh@ghxstship.pro'
     )
     and ol.engagement_start = date '2026-05-11';

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
  select
    ol.id, v_org_id, 'engagement_updated', 'GHXSTSHIP',
    'Engagement window aligned to playbook v3 Labor tab. 5/11 hold day removed (engagement_start → 5/12). Active days are 5/12, 5/13, 5/14, 5/18, 5/19 (~5 working days). 5/15–5/17 are dark inside the engagement window — show days are not staffed for HEQ / Skilled crew per Labor tab.',
    jsonb_build_object(
      'source', 'EDCLV26_SalvageCity_ProductionPlaybook · Labor tab',
      'aligned_at', '2026-05-08',
      'active_days', jsonb_build_array('2026-05-12','2026-05-13','2026-05-14','2026-05-18','2026-05-19'),
      'dark_days',   jsonb_build_array('2026-05-15','2026-05-16','2026-05-17')
    )
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and lower(cm.email) in (
       'brett@ghxstship.pro',
       'adam@ghxstship.pro',
       'josh@ghxstship.pro'
     )
     and not exists (
       select 1 from offer_letter_activity a
        where a.offer_letter_id = ol.id
          and a.kind = 'engagement_updated'
          and a.summary like '%playbook v3%5/12%'
     );

  -- ── 2. Mariah Williams role-flip note ───────────────────────────────────
  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
  select
    ol.id, v_org_id, 'role_flip', 'GHXSTSHIP',
    'Role flip per playbook v3: Production Assistant — Runner on rehearsal / load-in / load-out days (5/12, 5/13, 5/14, 5/18, 5/19); Production Assistant — MERCH on show days (5/15, 5/16, 5/17). Primary offer-letter role remains production-assistant-runner; MERCH coverage on show days is captured in the Brand Ambassador + Operations guides.',
    jsonb_build_object(
      'source', 'EDCLV26_SalvageCity_ProductionPlaybook · Labor tab',
      'aligned_at', '2026-05-08',
      'runner_days', jsonb_build_array('2026-05-12','2026-05-13','2026-05-14','2026-05-18','2026-05-19'),
      'merch_days',  jsonb_build_array('2026-05-15','2026-05-16','2026-05-17')
    )
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and lower(cm.email) = 'mariah@ghxstship.pro'
     and not exists (
       select 1 from offer_letter_activity a
        where a.offer_letter_id = ol.id and a.kind = 'role_flip'
     );

  -- ── 3. Skylar 5/14 short-day note ──────────────────────────────────────
  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
  select
    ol.id, v_org_id, 'engagement_note', 'GHXSTSHIP',
    'Note for payroll: 5/14 (Friends & Family preview) is an 8-hour day vs. the 10-hour standard. Pro-rate the day-rate accordingly when reconciling against the time-tracker.',
    jsonb_build_object(
      'source', 'EDCLV26_SalvageCity_ProductionPlaybook · Labor tab',
      'aligned_at', '2026-05-08',
      'short_day', '2026-05-14',
      'short_day_hours', 8,
      'standard_hours', 10
    )
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and ol.status not in ('withdrawn')
     and lower(cm.email) = 'skylarenneper@gmail.com'
     and not exists (
       select 1 from offer_letter_activity a
        where a.offer_letter_id = ol.id
          and a.kind = 'engagement_note'
          and a.summary like '%5/14%8-hour%'
     );

  -- ── 4. Julia Valler Inc — new staffing vendor for Brand Ambassadors ─────
  insert into vendors (org_id, name, contact_email, contact_phone, category, w9_on_file, notes)
  values (
    v_org_id,
    'Julia Valler Inc',
    null,
    null,
    'Brand Ambassador Staffing',
    false,
    'Brand Ambassador staffing partner for EDCLV26 Salvage City. Supplies HOST I, HOST II, HOST VIP, FLEX per the Labor tab. Booking contact, COI, and W-9 — TBC.'
  )
  on conflict do nothing;

  select id into v_julia_vendor_id from vendors
   where org_id = v_org_id and lower(name) = 'julia valler inc'
   limit 1;

  -- ── 5. Brand Ambassador placeholder crew_members + draft offer letters ──
  insert into crew_members (org_id, name, email, phone, role, day_rate_cents)
  values
    (v_org_id, 'Brand Ambassador (HOST I)   — TBC',  null, null, 'brand-ambassador-host', 0),
    (v_org_id, 'Brand Ambassador (HOST II)  — TBC',  null, null, 'brand-ambassador-host', 0),
    (v_org_id, 'Brand Ambassador (HOST VIP) — TBC',  null, null, 'brand-ambassador-vip',  0),
    (v_org_id, 'Brand Ambassador (FLEX)     — TBC',  null, null, 'brand-ambassador-flex', 0)
  on conflict do nothing;

  select id into v_ba_host_i   from crew_members where org_id = v_org_id and name = 'Brand Ambassador (HOST I)   — TBC'   order by created_at desc limit 1;
  select id into v_ba_host_ii  from crew_members where org_id = v_org_id and name = 'Brand Ambassador (HOST II)  — TBC'  order by created_at desc limit 1;
  select id into v_ba_host_vip from crew_members where org_id = v_org_id and name = 'Brand Ambassador (HOST VIP) — TBC' order by created_at desc limit 1;
  select id into v_ba_flex     from crew_members where org_id = v_org_id and name = 'Brand Ambassador (FLEX)     — TBC'    order by created_at desc limit 1;

  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id,
    employer, classification, venue_id,
    rate_card_item_id, compensation_basis,
    engagement_start, engagement_end,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id, v_ba_host_i,
    (select id from org_roles where org_id = v_org_id and slug = 'brand-ambassador-host'),
    'ghxstship'::offer_letter_employer,
    '1099'::offer_letter_classification,
    v_venue_id,
    (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-brand-ambassador-host'),
    'per_day'::compensation_basis,
    date '2026-05-14', date '2026-05-18',
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft'::offer_letter_status,
    v_julian
  where not exists (select 1 from offer_letters where project_id = v_project_id and crew_member_id = v_ba_host_i);

  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id,
    employer, classification, venue_id,
    rate_card_item_id, compensation_basis,
    engagement_start, engagement_end,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id, v_ba_host_ii,
    (select id from org_roles where org_id = v_org_id and slug = 'brand-ambassador-host'),
    'ghxstship'::offer_letter_employer,
    '1099'::offer_letter_classification,
    v_venue_id,
    (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-brand-ambassador-host'),
    'per_day'::compensation_basis,
    date '2026-05-14', date '2026-05-18',
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft'::offer_letter_status,
    v_julian
  where not exists (select 1 from offer_letters where project_id = v_project_id and crew_member_id = v_ba_host_ii);

  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id,
    employer, classification, venue_id,
    rate_card_item_id, compensation_basis,
    engagement_start, engagement_end,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id, v_ba_host_vip,
    (select id from org_roles where org_id = v_org_id and slug = 'brand-ambassador-vip'),
    'ghxstship'::offer_letter_employer,
    '1099'::offer_letter_classification,
    v_venue_id,
    (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-brand-ambassador-vip'),
    'per_day'::compensation_basis,
    date '2026-05-14', date '2026-05-18',
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft'::offer_letter_status,
    v_julian
  where not exists (select 1 from offer_letters where project_id = v_project_id and crew_member_id = v_ba_host_vip);

  -- FLEX scoped to 5/14 preview only per playbook (0 hr show days).
  insert into offer_letters (
    org_id, project_id, crew_member_id, role_id,
    employer, classification, venue_id,
    rate_card_item_id, compensation_basis,
    engagement_start, engagement_end,
    access_code, token_expires_at, status, created_by
  )
  select
    v_org_id, v_project_id, v_ba_flex,
    (select id from org_roles where org_id = v_org_id and slug = 'brand-ambassador-flex'),
    'ghxstship'::offer_letter_employer,
    '1099'::offer_letter_classification,
    v_venue_id,
    (select id from rate_card_items where org_id = v_org_id and sku = 'CDR-brand-ambassador-flex'),
    'per_day'::compensation_basis,
    date '2026-05-14', date '2026-05-14',
    generate_offer_access_code(),
    now() + interval '60 days',
    'draft'::offer_letter_status,
    v_julian
  where not exists (select 1 from offer_letters where project_id = v_project_id and crew_member_id = v_ba_flex);

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
  select ol.id, v_org_id, 'created', 'GHXSTSHIP',
    case
      when cm.role = 'brand-ambassador-flex' then 'Draft created — Brand Ambassador FLEX scoped to 5/14 preview only per playbook v3 (0 hr show days). Vendor Julia Valler Inc to supply the assigned BA; advance to ''sent'' once name is locked.'
      else 'Draft created — Brand Ambassador station letter pending vendor (Julia Valler Inc) supplying the assigned BA. Engagement covers 5/14 preview, 5/15–17 show days, 5/18 load-out. Advance to ''sent'' once name is locked.'
    end,
    jsonb_build_object(
      'source', 'EDCLV26_SalvageCity_ProductionPlaybook · Labor tab',
      'aligned_at', '2026-05-08',
      'staffing_vendor', 'Julia Valler Inc'
    )
    from offer_letters ol
    join crew_members cm on cm.id = ol.crew_member_id
   where ol.project_id = v_project_id
     and cm.org_id = v_org_id
     and cm.role like 'brand-ambassador-%'
     and not exists (
       select 1 from offer_letter_activity a
        where a.offer_letter_id = ol.id and a.kind = 'created'
     );

end$$;
