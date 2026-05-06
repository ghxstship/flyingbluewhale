-- ============================================================================
-- Onboarding v2 — industry-leading engagement-letter system
-- ============================================================================
-- Promotes the offer letter from a static contract to a live, opinionated
-- workflow that closes the gap between "I signed" and "I'm operational on
-- day one." Adds:
--
--   * org_roles enrichment — qualifications, decision rights, success
--     criteria, failure modes (the JD-as-first-class concept).
--   * certifications + role_certifications + crew_certifications — per-role
--     required-cert ledger with upload + expiration tracking.
--   * onboarding_steps — per-offer-letter live tracker; replaces the static
--     PDF checkbox list with rows that operations + recipient both see.
--   * compliance_addenda — region × classification clauses, selected at
--     render time from the venue's location region.
--   * crew_ratings — mutual rating loop on engagement close.
--   * projects.welcome_video_url + welcome_message — leadership intro.
--   * offer_letters.signature_audit jsonb — IP/UA/geolocation/checksum on
--     accept, layered on top of the existing accepted_signature.
--
-- Idempotent. Safe to re-run.
-- ============================================================================

-- ── 1. org_roles enrichment (JD-as-first-class) ────────────────────────────
alter table org_roles
  add column if not exists qualifications        text[]           not null default '{}',
  add column if not exists decision_rights_owns  text[]           not null default '{}',
  add column if not exists decision_rights_escalates text[]       not null default '{}',
  add column if not exists success_criteria      text[]           not null default '{}',
  add column if not exists failure_modes         text[]           not null default '{}',
  add column if not exists hours_per_day_target  int,
  add column if not exists day_one_brief         text;

-- ── 2. certifications ──────────────────────────────────────────────────────
create table if not exists certifications (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  slug            text not null,
  name            text not null,
  description     text,
  issuing_body    text,
  validity_months int,
  category        text,
  created_at      timestamptz not null default now(),
  unique (org_id, slug)
);

create table if not exists role_certifications (
  org_id           uuid not null,
  role_id          uuid not null references org_roles(id) on delete cascade,
  certification_id uuid not null references certifications(id) on delete cascade,
  required         boolean not null default true,
  primary key (role_id, certification_id)
);

create table if not exists crew_certifications (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references orgs(id) on delete cascade,
  crew_member_id     uuid not null references crew_members(id) on delete cascade,
  certification_id   uuid not null references certifications(id) on delete cascade,
  issued_at          date,
  expires_at         date,
  certificate_number text,
  document_path      text,
  verified_at        timestamptz,
  verified_by        uuid references users(id) on delete set null,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (crew_member_id, certification_id)
);
create index if not exists crew_certifications_crew_idx on crew_certifications(crew_member_id);
create index if not exists crew_certifications_expires_idx on crew_certifications(expires_at);

drop trigger if exists crew_certifications_touch_updated_at on crew_certifications;
create trigger crew_certifications_touch_updated_at
  before update on crew_certifications
  for each row execute function touch_updated_at();

-- ── 3. onboarding_steps — live tracker per offer letter ────────────────────
create table if not exists onboarding_steps (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references orgs(id) on delete cascade,
  offer_letter_id uuid not null references offer_letters(id) on delete cascade,
  step_key        text not null,
  title           text not null,
  description     text,
  category        text,                       -- 'paperwork' | 'safety' | 'travel' | 'venue' | 'communication'
  critical_path   boolean not null default false,
  sort_order      int not null default 100,
  due_at          date,
  status          text not null default 'pending'
                  check (status in ('pending','in_progress','done','waived','blocked')),
  completed_at    timestamptz,
  completed_by    uuid references users(id) on delete set null,
  notes           text,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (offer_letter_id, step_key)
);
create index if not exists onboarding_steps_letter_status_idx
  on onboarding_steps(offer_letter_id, status);
create index if not exists onboarding_steps_due_idx on onboarding_steps(due_at)
  where status not in ('done','waived');

drop trigger if exists onboarding_steps_touch_updated_at on onboarding_steps;
create trigger onboarding_steps_touch_updated_at
  before update on onboarding_steps
  for each row execute function touch_updated_at();

-- ── 4. compliance_addenda ──────────────────────────────────────────────────
create table if not exists compliance_addenda (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references orgs(id) on delete cascade,
  region         text not null,           -- ISO subdivision: 'NV','FL','CA' …
  classification text not null,           -- '1099','w2','agency','intern'
  title          text not null,
  body           text not null,
  effective_from date,
  effective_to   date,
  created_at     timestamptz not null default now(),
  unique (org_id, region, classification, title)
);
create index if not exists compliance_addenda_lookup_idx
  on compliance_addenda(org_id, region, classification);

-- ── 5. crew_ratings — mutual rating ────────────────────────────────────────
create table if not exists crew_ratings (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references orgs(id) on delete cascade,
  project_id        uuid references projects(id) on delete cascade,
  crew_member_id    uuid not null references crew_members(id) on delete cascade,
  rated_by_user_id  uuid references users(id) on delete set null,
  direction         text not null check (direction in ('crew_to_org','org_to_crew')),
  score             int not null check (score between 1 and 5),
  would_rehire      boolean,
  note              text,
  category_scores   jsonb not null default '{}'::jsonb,  -- {reliability:5, communication:4, …}
  created_at        timestamptz not null default now()
);
create index if not exists crew_ratings_crew_idx on crew_ratings(crew_member_id);
create index if not exists crew_ratings_project_idx on crew_ratings(project_id);

-- ── 6. project welcome assets ──────────────────────────────────────────────
alter table projects
  add column if not exists welcome_video_url text,
  add column if not exists welcome_message   text;

-- ── 7. offer_letters signature audit trail ─────────────────────────────────
alter table offer_letters
  add column if not exists signature_audit jsonb not null default '{}'::jsonb;

-- ── 8. RLS ─────────────────────────────────────────────────────────────────
alter table certifications enable row level security;
alter table role_certifications enable row level security;
alter table crew_certifications enable row level security;
alter table onboarding_steps enable row level security;
alter table compliance_addenda enable row level security;
alter table crew_ratings enable row level security;

drop policy if exists certifications_org on certifications;
create policy certifications_org on certifications
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

drop policy if exists role_certifications_org on role_certifications;
create policy role_certifications_org on role_certifications
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

drop policy if exists crew_certifications_org on crew_certifications;
create policy crew_certifications_org on crew_certifications
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

drop policy if exists onboarding_steps_org on onboarding_steps;
create policy onboarding_steps_org on onboarding_steps
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

drop policy if exists compliance_addenda_org on compliance_addenda;
create policy compliance_addenda_org on compliance_addenda
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

drop policy if exists crew_ratings_org on crew_ratings;
create policy crew_ratings_org on crew_ratings
  for all to authenticated using (private.is_org_member(org_id)) with check (private.is_org_member(org_id));

-- ── 9. Seed: certifications catalogue (industry standard) ──────────────────
do $$
declare
  v_org uuid;
begin
  select id into v_org from orgs where slug = 'demo' limit 1;
  if v_org is null then return; end if;

  insert into certifications (org_id, slug, name, description, issuing_body, validity_months, category) values
    (v_org, 'osha-10',         'OSHA 10-Hour General Industry',  'OSHA 10-hour outreach training for general workers. Required for any crew working at the venue.',
                                                                  'Occupational Safety and Health Administration', null, 'safety'),
    (v_org, 'osha-30',         'OSHA 30-Hour General Industry',  'OSHA 30-hour outreach training. Required for crew supervising others or working at heights / aerial.',
                                                                  'Occupational Safety and Health Administration', null, 'safety'),
    (v_org, 'first-aid-cpr',   'First Aid + CPR / AED',           'Current first-aid and CPR certification including AED operation.',
                                                                  'American Red Cross or American Heart Association', 24, 'safety'),
    (v_org, 'forklift',        'Forklift Operator Certification', 'OSHA-compliant forklift / lift-truck operator certification.',
                                                                  'OSHA-authorized training provider', 36, 'equipment'),
    (v_org, 'mewp-aerial-lift','MEWP / Aerial Lift Operator',     'ANSI A92 certified Mobile Elevating Work Platform / aerial lift operator.',
                                                                  'IPAF or OSHA-authorized provider', 36, 'equipment'),
    (v_org, 'food-handler-nv', 'Nevada Food Handler Card',        'Southern Nevada Health District (SNHD) food handler card. Required for any BOH / FOH crew handling food in Clark County, NV.',
                                                                  'Southern Nevada Health District', 36, 'food'),
    (v_org, 'tips-alcohol',    'TIPS / TAM Alcohol Service',      'Nevada TAM (Techniques of Alcohol Management) card. Required for bartenders + servers within 30 days of hire under NRS 369.630.',
                                                                  'TIPS or TAM-certified provider', 48, 'food'),
    (v_org, 'driver-license',  'Valid Driver''s License',         'Current driver''s license (any U.S. state). Required for Production Assistant - Runner / Driver.',
                                                                  'State DMV', null, 'driving'),
    (v_org, 'general-liability','General Liability Insurance',    'Certificate of insurance (COI) — $1M general liability minimum, naming GHXSTSHIP and Five Senses as additional insureds. Required for agency / loan-out classifications.',
                                                                  'Insurance carrier', 12, 'insurance')
  on conflict (org_id, slug) do update set
    name = excluded.name, description = excluded.description, issuing_body = excluded.issuing_body,
    validity_months = excluded.validity_months, category = excluded.category;
end $$;

-- ── 10. Seed: per-role required certifications ────────────────────────────
do $$
declare
  v_org uuid;
  v_role record;
  v_cert record;
begin
  select id into v_org from orgs where slug = 'demo' limit 1;
  if v_org is null then return; end if;

  -- helper: link role × cert
  for v_role in select id, slug from org_roles where org_id = v_org loop
    for v_cert in select id, slug from certifications where org_id = v_org loop
      -- Map role × cert per industry standard
      if (
        (v_role.slug in ('project-director','project-producer','production-manager','production-manager-fb') and v_cert.slug in ('osha-30','first-aid-cpr')) or
        (v_role.slug in ('production-crew-heavy') and v_cert.slug in ('osha-10','first-aid-cpr','forklift','mewp-aerial-lift')) or
        (v_role.slug in ('production-crew-carpentry-av') and v_cert.slug in ('osha-10','first-aid-cpr','mewp-aerial-lift')) or
        (v_role.slug in ('production-assistant-runner','production-assistant-driver') and v_cert.slug in ('osha-10','driver-license')) or
        (v_role.slug in ('production-assistant-foh','brand-ambassador-host','brand-ambassador-vip','brand-ambassador-merch','brand-ambassador-flex') and v_cert.slug in ('osha-10')) or
        (v_role.slug = 'executive-producer' and v_cert.slug in ('osha-30','first-aid-cpr'))
      ) then
        insert into role_certifications (org_id, role_id, certification_id, required)
        values (v_org, v_role.id, v_cert.id, true)
        on conflict do nothing;
      end if;
    end loop;
  end loop;
end $$;

-- ── 11. Seed: enrich org_roles with JD content ────────────────────────────
do $$
declare
  v_org uuid;
begin
  select id into v_org from orgs where slug = 'demo' limit 1;
  if v_org is null then return; end if;

  -- Project Director (Sarah, Vida)
  update org_roles set
    qualifications = array[
      '5+ years senior production / hospitality leadership for festivals, immersive shows, or large-format events.',
      'Experience running 80+ guest seatings on tight cue timing.',
      'Demonstrated ability to coordinate F&B, technical, and creative tracks simultaneously.',
      'Strong written communication; comfortable owning the master schedule and run-of-show.'
    ],
    decision_rights_owns = array[
      'Daily call sheet, run-of-show, and crew assignments.',
      'Approving departmental requisitions and POs against the project budget up to $10,000.',
      'Real-time creative + operational decisions during show nights.',
      'Hospitality flow, table management, and guest-experience escalations.'
    ],
    decision_rights_escalates = array[
      'Budget changes >$10,000 or scope changes affecting the producer/client (Five Senses).',
      'Talent injuries, guest safety incidents, or fire-marshal escalations (immediate, to Project Producer + Insomniac Production).',
      'Vendor disputes that risk the load-in timeline.',
      'Any decision requiring legal sign-off or contract amendment.'
    ],
    success_criteria = array[
      'All five seatings start within ±2 minutes of cue every show night.',
      'Zero unresolved guest-experience escalations carried into the next service window.',
      'Crew daysheet + incident log filed within 30 minutes of wrap each night.',
      'Final reconciliation closed within 15 days of strike.'
    ],
    failure_modes = array[
      'Run-of-show changes communicated only verbally — must always be reflected in the playbook before the next call.',
      'Allowing the F&B and creative tracks to drift on different timelines.',
      'Letting the credentials window close before all crew have submitted required certs.',
      'Skipping the post-show debrief — undermines the next-night reset.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Walk the venue with the Production Manager and the F&B lead before any other call. Verify the master schedule against the playbook, pull the credentials list, confirm the radio plan, and review the wind-25 contingency with Insomniac safety.'
  where org_id = v_org and slug = 'project-director';

  -- Project Producer (Julian)
  update org_roles set
    qualifications = array[
      '7+ years end-to-end production for festivals, immersive shows, or large-format hospitality.',
      'Multi-stakeholder coordination across producer, creative, F&B, technical, and venue partners.',
      'Comfortable as the singular escalation point for safety, budget, and contract matters.'
    ],
    decision_rights_owns = array[
      'Final sign-off on engagement letters, vendor contracts, and rate cards.',
      'Stakeholder communication with the producer and venue partner.',
      'Budget approvals above the Project Director threshold.',
      'Crisis escalation routing (safety, talent, venue partner concerns).'
    ],
    decision_rights_escalates = array[
      'Material scope or budget changes affecting the underlying client agreement.',
      'Legal / regulatory questions outside the standard rider.'
    ],
    success_criteria = array[
      'All offer letters signed and onboarding paperwork complete before load-in.',
      'No surprise spend categories at strike — every line traced to a signed PO or change order.',
      'Producer + venue partner debrief in calendar within 14 days of strike.'
    ],
    failure_modes = array[
      'Letting onboarding paperwork lag into load-in week.',
      'Approving verbal scope changes without follow-up paper trail.',
      'Becoming a single point of failure during show nights — delegate the call to the Project Director on cue.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Confirm that all onboarding steps for every crew member are at "in_progress" or "done" before approving first-call. Walk the venue with the Project Director. Sign the show-day briefing and confirm the call cadence with the producer.'
  where org_id = v_org and slug = 'project-producer';

  -- Production Manager (Skylar)
  update org_roles set
    qualifications = array[
      '3+ years production management for live events; comfortable on a radio in show mode.',
      'Working knowledge of stage rigging, audio, lighting, and decking from a coordination perspective (does not need to operate).',
      'Demonstrated incident-response calm and clear comms.'
    ],
    decision_rights_owns = array[
      'Crew position assignments and pre-show briefings.',
      'Channel 1 (SC OPS) radio traffic during show.',
      'SOP execution; minor incident response (escalate per SOP-05).',
      'Day-of vendor coordination at the venue.'
    ],
    decision_rights_escalates = array[
      'Aerial / rigging concerns (immediate, to Project Director + R-Tech).',
      'Wind-25 conditions; LED-poi armed cue; medical incidents.',
      'Crew availability or no-show issues.'
    ],
    success_criteria = array[
      'All crew at first call by published call time; ≤5% radio traffic violations of channel discipline.',
      'Pre-show briefings completed at 17:15 each show night with all departments present.',
      'Daysheet + incident log filed by wrap +30 min.'
    ],
    failure_modes = array[
      'Letting personal Slack / DMs replace channel 1 during show — every cue belongs on the radio.',
      'Skipping the Wind-25 fallback walkthrough at the start of the engagement.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Walk the venue with the Project Director. Test radio channels 1, 2, and 6. Review SOPs 01–05 with the F&B lead and the show caller before first rehearsal.'
  where org_id = v_org and slug = 'production-manager';

  -- Production Crew - HEQ (Brett)
  update org_roles set
    qualifications = array[
      'Current OSHA 10 (or higher) and forklift / aerial-lift certifications.',
      '2+ years operating heavy equipment (lifts, telehandlers, forklifts) on event load-ins.',
      'Comfortable working independently on the load-in / strike floor.'
    ],
    decision_rights_owns = array[
      'Day-to-day equipment operation per OSHA certification.',
      'Daily equipment safety check and incident reporting per SOP-04.'
    ],
    decision_rights_escalates = array[
      'Any equipment fault, incident, or near-miss (immediate, to Production Manager).',
      'Rigging or lift-load concerns; trussing tolerances exceeded.',
      'Crew not following spotter protocols.'
    ],
    success_criteria = array[
      'Zero recordable equipment incidents over the engagement.',
      'Daily equipment checks logged before first lift each day.',
      'Trussing and large-format scenic install completed within the published window.'
    ],
    failure_modes = array[
      'Operating a lift without a spotter on the floor.',
      'Skipping the daily safety check — even if the equipment "seemed fine yesterday."'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Inventory all lifts, forklifts, and telehandlers on arrival. Run safety checks before any operation. Confirm spotter assignments with the Production Manager.'
  where org_id = v_org and slug = 'production-crew-heavy';

  -- Production Crew - Skilled (Adam, Josh)
  update org_roles set
    qualifications = array[
      'Current OSHA 10 and aerial-lift certifications.',
      '2+ years skilled carpentry / AV install on touring or event productions.',
      'Comfortable reading scenic and AV plots; can pull cable runs cleanly.'
    ],
    decision_rights_owns = array[
      'Scenic carpentry, fixture install, and AV cabling work assigned by Production Manager.',
      'Daily safety checks of installed elements.',
      'Crew tool inventory.'
    ],
    decision_rights_escalates = array[
      'Any structural concern with installed scenic.',
      'Cable runs that cannot be safely concealed or matted.',
      'Damage to venue property.'
    ],
    success_criteria = array[
      'Zero defective installs requiring rework after the tech rehearsal.',
      'Tool inventory accounts for every issued tool at strike.'
    ],
    failure_modes = array[
      'Improvising structural changes without consulting Project Director.',
      'Leaving cable runs un-matted in guest paths.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Pick up tools and credentials at the production trailer. Walk the scenic plot with Production Manager. Confirm install order for the day before starting.'
  where org_id = v_org and slug = 'production-crew-carpentry-av';

  -- Production Assistant - FOH (Michael)
  update org_roles set
    qualifications = array[
      'Current OSHA 10.',
      'Hospitality / FOH experience preferred — reading the room, cuing service, ushering guests with intent.',
      'Comfortable on a radio.'
    ],
    decision_rights_owns = array[
      'Front-of-house guest flow during service windows.',
      'Channel 3 (FOH/BOH) handoffs.'
    ],
    decision_rights_escalates = array[
      'Any guest medical concern (immediate, "Ace" on Channel 1).',
      'Guests separated from their party (Lost+1 on Channel 1).',
      'Allergen confusion with the kitchen.'
    ],
    success_criteria = array[
      'No seating misses; every guest at their table within 60 seconds of arrival at the rope.'
    ],
    failure_modes = array[
      'Talking over Channel 2 during a cue.',
      'Walking away from a rope without a relief.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Shadow Hospitality Manager for the first show night. Memorize seating chart and allergen flag protocol.'
  where org_id = v_org and slug = 'production-assistant-foh';

  -- Production Assistant - Runner (Mariah)
  update org_roles set
    qualifications = array[
      'Current driver''s license; clean driving record.',
      'Comfortable navigating Las Vegas traffic and Las Vegas Motor Speedway access points.',
      'OSHA 10 preferred.'
    ],
    decision_rights_owns = array[
      'Day-of runs assigned by Production Manager or Project Director.',
      'Vehicle inventory + fuel.'
    ],
    decision_rights_escalates = array[
      'Any vehicle incident or moving violation.',
      'Run that exceeds 90 minutes round-trip — confirm necessity first.'
    ],
    success_criteria = array[
      'All runs completed on the agreed window. No back-to-back overlapping runs.'
    ],
    failure_modes = array[
      'Speeding to make up time on a run — never. Re-baseline the schedule instead.'
    ],
    hours_per_day_target = 10,
    day_one_brief = 'Pick up vehicle assignment from Production Manager. Confirm credentials parking spot. Pre-program the venue, hotel, and Insomniac warehouse into the GPS.'
  where org_id = v_org and slug = 'production-assistant-runner';

  -- Executive Producer (Paul)
  update org_roles set
    qualifications = array[
      'C-level event production experience.',
      'Direct relationship with the venue partner / client (Insomniac).'
    ],
    decision_rights_owns = array[
      'Strategic relationship with venue + client.',
      'Final approval on creative, F&B, and budget decisions above the Project Producer threshold.'
    ],
    decision_rights_escalates = array[],
    success_criteria = array[
      'Engagement closes within budget, on-schedule, with all stakeholders willing to engage on the next show.'
    ],
    failure_modes = array[],
    hours_per_day_target = null,
    day_one_brief = 'Available on call. Daily check-in with Project Producer. Walk the venue once before show nights begin.'
  where org_id = v_org and slug = 'executive-producer';

  -- Project Coordinator (Amy)
  update org_roles set
    qualifications = array[
      'Strong written communication, project documentation rigor.',
      'Comfortable working remote across timezones.'
    ],
    decision_rights_owns = array[
      'Documentation, vendor follow-up, and project file paths.',
      'Tracking open advancing items in the production playbook.'
    ],
    decision_rights_escalates = array[
      'Anything where a vendor or stakeholder has gone silent for >48 hours.'
    ],
    success_criteria = array[
      'No open advancing items go unaddressed >72 hours.',
      'Project file system organized + searchable at strike.'
    ],
    failure_modes = array[
      'Letting threads die. Drive to closure or escalate.'
    ],
    hours_per_day_target = null,
    day_one_brief = 'Inventory open items in playbook. Set the weekly sync cadence. Confirm document access with Project Producer.'
  where org_id = v_org and slug = 'project-coordinator-remote';

  -- Finance Controller (Alvaro)
  update org_roles set
    qualifications = array[
      'CPA or equivalent + event/production finance experience.',
      'Comfortable with multi-currency invoicing and Convera-style payment platforms.'
    ],
    decision_rights_owns = array[
      'Invoicing, payroll processing, expense reconciliation.',
      'Project budget tracking.'
    ],
    decision_rights_escalates = array[
      'Material variance >5% on any line item.',
      'Vendor disputes affecting accounts payable.'
    ],
    success_criteria = array[
      'Books closed within 30 days of strike.',
      'No 1099 mis-classifications at year-end.'
    ],
    failure_modes = array[
      'Letting expense receipts pile up beyond weekly reconciliation.'
    ],
    hours_per_day_target = null,
    day_one_brief = 'Confirm bank + Convera setup for new vendors. Walk through the weekly invoice cycle with Project Producer.'
  where org_id = v_org and slug = 'finance-controller';

end $$;

-- ── 12. Seed: Florida + Nevada compliance addenda ─────────────────────────
do $$
declare
  v_org uuid;
begin
  select id into v_org from orgs where slug = 'demo' limit 1;
  if v_org is null then return; end if;

  insert into compliance_addenda (org_id, region, classification, title, body) values
  (v_org, 'NV', '1099', 'Nevada State Business License',
   'Per Nevada Revised Statutes Chapter 76, persons conducting business in Nevada must hold a Nevada State Business License. The current annual fee is $200. Recipient is responsible for obtaining and maintaining this license if their engagement constitutes "doing business" in Nevada under NRS 76.020. A Nevada-resident sole proprietor working ≤4 days per quarter is generally exempt; consult a Nevada-licensed CPA if uncertain.'),
  (v_org, 'NV', '1099', 'Nevada Workers'' Compensation Notice',
   'Recipient acknowledges that as a 1099 independent contractor performing services in Nevada, Recipient is not covered by GHXSTSHIP''s workers'' compensation policy under Nevada Revised Statutes Chapter 616A. Recipient may elect coverage at their own cost via a NRS 616B.659 Independent Contractor Election or secure their own private coverage. Recipient assumes all risk associated with performance of the engaged services.'),
  (v_org, 'NV', '1099', 'TAM / Food Handler Cards (Clark County)',
   'Crew handling food in Clark County, Nevada must hold a current Southern Nevada Health District food handler card under Clark County Health District regulations. Crew serving alcohol must hold a current Nevada TAM (Techniques of Alcohol Management) certification under NRS 369.630, obtainable within 30 days of first service. Cards must be presented at credential pickup.'),
  (v_org, 'FL', '1099', 'Florida Governing Law',
   'This engagement is governed by the laws of the State of Florida. Disputes shall be resolved in the state or federal courts located in Hillsborough County, Florida, except where Nevada law mandates local venue for venue-specific work-injury or licensing matters.'),
  (v_org, 'FL', '1099', 'Florida Tax Disclosure',
   'Florida has no state personal income tax. Recipient is responsible for federal income tax, self-employment tax (Social Security + Medicare), and any tax obligations arising in their state of residence.'),
  (v_org, 'NV', '1099', 'Right to Work',
   'Both Florida (Article I, § 6 of the Florida Constitution) and Nevada (Nevada Revised Statutes Chapter 613) are right-to-work jurisdictions. Recipient is not required to join any union or pay union dues as a condition of this engagement.'),
  (v_org, 'NV', '1099', 'No Overtime Obligation',
   'The agreed daily rate compensates Recipient for up to ten (10) hours per work day. As a 1099 independent contractor, Recipient is not subject to overtime regulations under the federal Fair Labor Standards Act (FLSA, 29 U.S.C. § 207) or Nevada Revised Statutes Chapter 608. Hours worked beyond ten in a single day, if any, do not entitle Recipient to additional compensation absent prior written approval from a Production Director.'),
  (v_org, 'NV', '1099', 'Equal Opportunity & Non-Discrimination',
   'GHXSTSHIP and Five Senses Group engage contractors without regard to race, color, religion, sex, national origin, age, disability, sexual orientation, gender identity, or veteran status, in compliance with Title VII of the Civil Rights Act of 1964 (42 U.S.C. § 2000e), the Florida Civil Rights Act of 1992 (Florida Statutes Chapter 760), and the Nevada Equal Rights of Citizens Act (Nevada Revised Statutes Chapter 613).')
  on conflict (org_id, region, classification, title) do update set body = excluded.body;
end $$;

-- ── 13. Seed: project welcome message ─────────────────────────────────────
update projects set
  welcome_message = 'You''re joining a small, opinionated production team running an immersive supper club inside the world''s biggest electronic-dance festival. The bar is high, the schedule is precise, and the work is genuinely fun. Read the playbook end-to-end, complete every onboarding step before first call, and bring questions to the daily briefing. Sea ya in Las Vegas.'
where slug = 'edclv26-salvage-city';

-- ── 14. Seed: per-letter onboarding steps for retained Salvage City crew ──
do $$
declare
  v_org uuid;
  v_project uuid;
  v_letter record;
  v_is_traveler boolean;
begin
  select o.id, p.id into v_org, v_project
    from orgs o join projects p on p.org_id = o.id
   where o.slug = 'demo' and p.slug = 'edclv26-salvage-city' limit 1;
  if v_project is null then return; end if;

  for v_letter in
    select ol.id as letter_id, cm.name, cm.email, ol.engagement_start
      from offer_letters ol join crew_members cm on cm.id = ol.crew_member_id
     where ol.project_id = v_project and ol.status not in ('withdrawn')
  loop
    v_is_traveler := v_letter.name in ('Sarah Fry', 'Vida Sotakoun');

    insert into onboarding_steps (org_id, offer_letter_id, step_key, title, description, category, critical_path, sort_order, due_at)
    values
    (v_org, v_letter.letter_id, 'sign_letter', 'Counter-sign engagement letter',
      'Open your letter at the link in your invitation email and counter-sign with your full legal name. The system records IP, timestamp, and a hash of the document for the audit trail.',
      'paperwork', true, 10, v_letter.engagement_start - 5),
    (v_org, v_letter.letter_id, 'submit_w9', 'Submit IRS Form W-9',
      'Email a completed W-9 to alvaro@five-senses.co. Required for 1099-NEC reporting at year-end.',
      'paperwork', true, 20, v_letter.engagement_start - 5),
    (v_org, v_letter.letter_id, 'insomniac_safety', 'INSOMNIAC 2026 Safety + Social Media Policy',
      'Complete the Insomniac safety + social media form (link in the production playbook). Use "Salvage City — No Ceilings" in the Department / Vendor field.',
      'safety', true, 30, v_letter.engagement_start - 3),
    (v_org, v_letter.letter_id, 'upload_certs', 'Upload required certifications',
      'Upload current copies of every certification listed in your offer letter. Include cert number and expiration date. Credentials cannot issue without these on file.',
      'safety', true, 40, v_letter.engagement_start - 5),
    (v_org, v_letter.letter_id, 'submit_headshot', 'Submit credentials headshot',
      'Send a recent headshot (1024×1024 minimum, plain background) to sos@ghxstship.pro for credential printing.',
      'venue', true, 50, v_letter.engagement_start - 4),
    (v_org, v_letter.letter_id, case when v_is_traveler then 'confirm_travel' else 'confirm_transport' end,
      case when v_is_traveler then 'Confirm travel itinerary' else 'Confirm transport plan' end,
      case when v_is_traveler
        then 'Five Senses logistics will email your flight + lodging confirmation at least 7 days before your first call. Confirm receipt and flag any conflicts immediately.'
        else 'Confirm your transport plan to the Las Vegas Motor Speedway. A parking pass arrives with your credentials packet 48 hours before load-in.'
      end,
      case when v_is_traveler then 'travel' else 'venue' end,
      true, 60, v_letter.engagement_start - 3),
    (v_org, v_letter.letter_id, 'read_playbook', 'Read the Salvage City Production Playbook',
      'Read end-to-end. Bookmark the schedule, contacts, and radio plan. Save show schedule (May 15–17) to your calendar with a reminder set 4 hours pre-call.',
      'communication', false, 70, v_letter.engagement_start - 2),
    (v_org, v_letter.letter_id, 'calendar_block', 'Add schedule to your calendar',
      'Import the .ics calendar invite attached to your engagement letter. Verify all dates, times, and the venue address.',
      'communication', false, 80, v_letter.engagement_start - 2),
    (v_org, v_letter.letter_id, 'venue_checkin', 'Arrive + check in at the venue',
      'Bring photo ID for credential pickup, closed-toe shoes for load-in days, and a reusable water bottle (venue is hot in May). Scan the QR code in your engagement letter at the production trailer to mark yourself "arrived."',
      'venue', true, 90, v_letter.engagement_start),
    (v_org, v_letter.letter_id, 'first_invoice', 'Submit first weekly invoice',
      'Submit your first invoice on the Friday following your first work week to alvaro@five-senses.co for Net 15 processing.',
      'paperwork', false, 100, v_letter.engagement_start + 4)
    on conflict (offer_letter_id, step_key) do update set
      title = excluded.title, description = excluded.description, category = excluded.category,
      critical_path = excluded.critical_path, sort_order = excluded.sort_order, due_at = excluded.due_at;
  end loop;
end $$;
