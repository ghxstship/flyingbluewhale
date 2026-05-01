-- ============================================================================
-- PROPOSAL CLIENT PORTAL
-- Extends the existing `proposals` table with delivery-side state tracking:
-- phase progress, change orders, revision rounds, approvals, files, activity.
-- ============================================================================

-- ── PHASE STATES ─────────────────────────────────────────────────────────────
create type proposal_phase_status as enum ('locked','active','in_review','approved','complete');

create table proposal_phase_states (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  phase_num       smallint not null check (phase_num between 1 and 8),
  phase_key       text not null,
  phase_name      text not null,
  status          proposal_phase_status not null default 'locked',
  started_at      timestamptz,
  approved_at     timestamptz,
  approved_by     uuid references users(id),
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (proposal_id, phase_num)
);
create index proposal_phase_states_proposal_idx on proposal_phase_states(proposal_id);
create index proposal_phase_states_org_idx on proposal_phase_states(org_id);
create trigger proposal_phase_states_touch_updated_at
  before update on proposal_phase_states
  for each row execute function touch_updated_at();

-- Per-phase milestone gate items (checklist of what must be true to advance)
create table proposal_gate_items (
  id              uuid primary key default gen_random_uuid(),
  phase_state_id  uuid not null references proposal_phase_states(id) on delete cascade,
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  ordinal         smallint not null,
  label           text not null,
  is_done         boolean not null default false,
  done_at         timestamptz,
  done_by         uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index proposal_gate_items_phase_idx on proposal_gate_items(phase_state_id);
create index proposal_gate_items_proposal_idx on proposal_gate_items(proposal_id);
create trigger proposal_gate_items_touch_updated_at
  before update on proposal_gate_items
  for each row execute function touch_updated_at();

-- ── CHANGE ORDERS ────────────────────────────────────────────────────────────
create type change_order_state as enum ('draft','requested','priced','client_review','approved','rejected','withdrawn');

create table proposal_change_orders (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  number          int not null,
  title           text not null,
  body            text,
  delta_cents     bigint default 0,
  state           change_order_state not null default 'requested',
  requested_by    uuid references users(id),
  requested_label text,
  priced_at       timestamptz,
  decided_at      timestamptz,
  decided_by      uuid references users(id),
  decision_note   text,
  meta            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (proposal_id, number)
);
create index proposal_change_orders_proposal_idx on proposal_change_orders(proposal_id);
create index proposal_change_orders_state_idx on proposal_change_orders(state);
create trigger proposal_change_orders_touch_updated_at
  before update on proposal_change_orders
  for each row execute function touch_updated_at();

-- Auto-numbering trigger for change orders within a proposal
create or replace function proposal_change_orders_number()
returns trigger language plpgsql as $$
begin
  if new.number is null or new.number = 0 then
    select coalesce(max(number), 0) + 1
      into new.number
      from proposal_change_orders
      where proposal_id = new.proposal_id;
  end if;
  return new;
end;
$$;
create trigger proposal_change_orders_number_trg
  before insert on proposal_change_orders
  for each row execute function proposal_change_orders_number();

-- ── REVISION ROUNDS (proofing) ───────────────────────────────────────────────
create type revision_state as enum ('open','client_review','approved','changes_requested','rejected','withdrawn');

create table proposal_revision_rounds (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  target_kind     text not null check (target_kind in ('proposal','phase','change_order','asset')),
  target_id       uuid,
  round_num       int not null default 1,
  title           text not null,
  summary         text,
  state           revision_state not null default 'open',
  decided_at      timestamptz,
  decided_by      uuid references users(id),
  decision_note   text,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index proposal_revision_rounds_proposal_idx on proposal_revision_rounds(proposal_id);
create index proposal_revision_rounds_target_idx on proposal_revision_rounds(target_kind, target_id);
create trigger proposal_revision_rounds_touch_updated_at
  before update on proposal_revision_rounds
  for each row execute function touch_updated_at();

-- Per-round revisions (multiple proofs per round, e.g. 3 mockups in round 2)
create table proposal_revisions (
  id              uuid primary key default gen_random_uuid(),
  round_id        uuid not null references proposal_revision_rounds(id) on delete cascade,
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  ordinal         smallint not null default 1,
  label           text not null,
  note            text,
  file_path       text,                -- supabase storage path
  preview_url     text,
  created_by      uuid references users(id),
  created_at      timestamptz not null default now()
);
create index proposal_revisions_round_idx on proposal_revisions(round_id);

-- ── APPROVALS ────────────────────────────────────────────────────────────────
create type approval_state as enum ('pending','signed','declined','expired');

create table proposal_approvals (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  kind            text not null,        -- 'phase_gate','change_order','revision','sow','final_invoice'
  target_id       uuid,                  -- references the relevant child row
  title           text not null,
  body            text,
  state           approval_state not null default 'pending',
  due_at          timestamptz,
  signed_at       timestamptz,
  signed_by       uuid references users(id),
  signed_label    text,                  -- typed name on signature
  signed_ip       inet,
  decline_reason  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index proposal_approvals_proposal_idx on proposal_approvals(proposal_id);
create index proposal_approvals_state_idx on proposal_approvals(state);
create trigger proposal_approvals_touch_updated_at
  before update on proposal_approvals
  for each row execute function touch_updated_at();

-- ── FILES ────────────────────────────────────────────────────────────────────
create table proposal_files (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  category        text not null check (category in ('proposal','sow','invoice','proof','condition_report','contract','other')),
  name            text not null,
  storage_path    text not null,         -- supabase storage path in 'proposals' bucket
  size_bytes      bigint,
  mime_type       text,
  uploaded_by     uuid references users(id),
  created_at      timestamptz not null default now()
);
create index proposal_files_proposal_idx on proposal_files(proposal_id);
create index proposal_files_category_idx on proposal_files(category);

-- ── ACTIVITY LOG ─────────────────────────────────────────────────────────────
create table proposal_activity (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid not null references proposals(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  kind            text not null,         -- 'phase.started','gate.checked','co.requested','rev.created','approval.signed', etc.
  actor_id        uuid references users(id),
  actor_label     text,
  target_kind     text,
  target_id       uuid,
  summary         text not null,
  meta            jsonb not null default '{}'::jsonb,
  occurred_at     timestamptz not null default now()
);
create index proposal_activity_proposal_idx on proposal_activity(proposal_id, occurred_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table proposal_phase_states     enable row level security;
alter table proposal_gate_items        enable row level security;
alter table proposal_change_orders     enable row level security;
alter table proposal_revision_rounds   enable row level security;
alter table proposal_revisions         enable row level security;
alter table proposal_approvals         enable row level security;
alter table proposal_files             enable row level security;
alter table proposal_activity          enable row level security;

-- All read/write gated by org membership (clients see via org membership too)
create policy proposal_phase_states_member on proposal_phase_states
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_gate_items_member on proposal_gate_items
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_change_orders_member on proposal_change_orders
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_revision_rounds_member on proposal_revision_rounds
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_revisions_member on proposal_revisions
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_approvals_member on proposal_approvals
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_files_member on proposal_files
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy proposal_activity_member on proposal_activity
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ── ACTIVITY HELPER ──────────────────────────────────────────────────────────
create or replace function log_proposal_activity(
  p_proposal_id uuid,
  p_org_id uuid,
  p_kind text,
  p_actor_id uuid,
  p_actor_label text,
  p_target_kind text,
  p_target_id uuid,
  p_summary text,
  p_meta jsonb default '{}'::jsonb
) returns uuid language plpgsql as $$
declare
  new_id uuid;
begin
  insert into proposal_activity
    (proposal_id, org_id, kind, actor_id, actor_label, target_kind, target_id, summary, meta)
    values (p_proposal_id, p_org_id, p_kind, p_actor_id, p_actor_label, p_target_kind, p_target_id, p_summary, p_meta)
    returning id into new_id;
  return new_id;
end;
$$;

-- ── SEED FUNCTION: CORNBREAD ABBEY ROAD ──────────────────────────────────────
-- Idempotent — drops and recreates the demo proposal + all child rows.
create or replace function seed_cornbread_abbey_road(p_org_slug text default 'demo')
returns uuid language plpgsql as $$
declare
  v_org_id uuid;
  v_owner_id uuid;
  v_project_id uuid;
  v_client_id uuid;
  v_proposal_id uuid;
  v_phase_id uuid;
  v_co_id uuid;
  v_round_id uuid;
  v_approval_id uuid;
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  if v_org_id is null then
    raise exception 'Org with slug % not found', p_org_slug;
  end if;

  select user_id into v_owner_id from memberships where org_id = v_org_id and role = 'owner' limit 1;

  -- Client (insert if missing)
  insert into clients (org_id, name, contact_name, contact_email, created_by)
    values (v_org_id, 'Cornbread Hemp', 'Julian Clarkson', 'julian.clarkson@ghxstship.pro', v_owner_id)
    on conflict do nothing;
  select id into v_client_id from clients where org_id = v_org_id and name = 'Cornbread Hemp' limit 1;

  -- Project — slug maps to portal route
  insert into projects (org_id, slug, name, description, status, start_date, end_date, client_id, created_by)
    values (
      v_org_id,
      'cornbread-abbey-road',
      'Cornbread × Abbey Road on the River 2026',
      'Activation transport, install, and storage for Abbey Road on the River, Jeffersonville IN, May 21–25 2026.',
      'active',
      '2026-05-12',
      '2026-06-30',
      v_client_id,
      v_owner_id
    )
    on conflict (org_id, slug) do update set name = excluded.name, description = excluded.description
    returning id into v_project_id;

  -- Wipe any existing proposal for this project (re-runnable)
  delete from proposals where project_id = v_project_id;

  insert into proposals (org_id, project_id, client_id, title, amount_cents, status, sent_at, notes, created_by)
    values (
      v_org_id, v_project_id, v_client_id,
      'Cornbread × Abbey Road on the River 2026 — Activation Asset Management',
      1300500,
      'sent',
      now() - interval '2 days',
      'CBH-ABR-2026-V1.0 — see lifecycle for delivery state.',
      v_owner_id
    )
    returning id into v_proposal_id;

  -- ── PHASE STATES (8) ──
  -- 01 Discovery — complete
  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at, approved_at, approved_by)
    values (v_proposal_id, v_org_id, 1, 'discovery', 'Discovery & Creative Brief', 'complete', now() - interval '6 days', now() - interval '5 days', v_owner_id)
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done, done_at, done_by) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed creative brief with engagement parameters', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Confirmed venue access windows — May 19 and May 26', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Designated Cornbread representative assigned as PM counterpart', true, now() - interval '5 days', v_owner_id),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Final planter count locked against vendor inventory', true, now() - interval '5 days', v_owner_id);

  -- 02 Concept — in_review
  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at)
    values (v_proposal_id, v_org_id, 2, 'concept', 'Concept Adaptation & Visualization', 'in_review', now() - interval '4 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Written approval of greenery palette', true),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Sign-off on lighting positions and timer schedule', true),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Confirmation of outdoor adaptation notes', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'Approval to advance to engineering (2 business-day review window)', false);

  -- 03 Engineering — active
  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status, started_at)
    values (v_proposal_id, v_org_id, 3, 'engineering', 'Engineering & Technical Development', 'active', now() - interval '2 days')
    returning id into v_phase_id;
  insert into proposal_gate_items (phase_state_id, proposal_id, org_id, ordinal, label, is_done) values
    (v_phase_id, v_proposal_id, v_org_id, 1, 'Signed load & power plan against venue drop', false),
    (v_phase_id, v_proposal_id, v_org_id, 2, 'Approved anchor specification for planter ring', false),
    (v_phase_id, v_proposal_id, v_org_id, 3, 'Weather contingency plan distributed to all parties', false),
    (v_phase_id, v_proposal_id, v_org_id, 4, 'PE stamp obtained if required (flagged at May 12 walkthrough)', false);

  -- 04–08 — locked
  insert into proposal_phase_states (proposal_id, org_id, phase_num, phase_key, phase_name, status) values
    (v_proposal_id, v_org_id, 4, 'fabrication',  'Fabrication & Procurement',         'locked'),
    (v_proposal_id, v_org_id, 5, 'logistics',    'Logistics & Pre-Deployment',        'locked'),
    (v_proposal_id, v_org_id, 6, 'installation', 'Installation & Environment Build',  'locked'),
    (v_proposal_id, v_org_id, 7, 'activation',   'Activation & Live Operations',      'locked'),
    (v_proposal_id, v_org_id, 8, 'legacy',       'Strike, Storage & Legacy',          'locked');

  -- ── CHANGE ORDERS ──
  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Add 2 planter boxes to ring',
      'Venue confirmed two additional planter positions adjacent to the activation face. Sourcing matched greenery and adding anchors.',
      51000, 'priced', v_owner_id, 'Julian Clarkson')
    returning id into v_co_id;

  insert into proposal_change_orders (proposal_id, org_id, title, body, delta_cents, state, requested_by, requested_label)
    values (v_proposal_id, v_org_id, 'Time-lapse documentation deliverable',
      'Add the optional install-day time-lapse from Phase 06.',
      48500, 'requested', v_owner_id, 'Julian Clarkson');

  -- ── REVISION ROUND (proof) ──
  insert into proposal_revision_rounds (proposal_id, org_id, target_kind, round_num, title, summary, state, created_by)
    values (v_proposal_id, v_org_id, 'phase', 2, 'Greenery palette mockups', '3 mockups for the planter ring — pick one or request changes.', 'client_review', v_owner_id)
    returning id into v_round_id;
  insert into proposal_revisions (round_id, proposal_id, org_id, ordinal, label, note) values
    (v_round_id, v_proposal_id, v_org_id, 1, 'Option A — Cornbread Orange forward', 'Hero botanical reads warm; trailing vine in cedar.'),
    (v_round_id, v_proposal_id, v_org_id, 2, 'Option B — Cannabis green forward', 'Higher contrast against orange wall; reads more "growth."'),
    (v_round_id, v_proposal_id, v_org_id, 3, 'Option C — Mixed palette', 'Even split — most similar to existing brand mood boards.');

  -- ── APPROVALS ──
  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, due_at)
    values (v_proposal_id, v_org_id, 'phase_gate', 'Phase 02 — Concept Adaptation Sign-Off',
      'Approve the greenery palette and lighting design to advance to engineering.', 'pending', now() + interval '2 days')
    returning id into v_approval_id;

  insert into proposal_approvals (proposal_id, org_id, kind, title, body, state, signed_at, signed_by, signed_label)
    values (v_proposal_id, v_org_id, 'sow', 'Master Statement of Work',
      'Counter-signed SOW for Cornbread × Abbey Road on the River 2026.', 'signed', now() - interval '4 days', v_owner_id, 'Julian Clarkson');

  -- ── FILES ──
  insert into proposal_files (proposal_id, org_id, category, name, storage_path, size_bytes, mime_type, uploaded_by) values
    (v_proposal_id, v_org_id, 'sow', 'CBH-ABR-2026-SOW-V1.pdf', 'demo/cbh-abr-2026/sow-v1.pdf', 248320, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'proposal', 'CBH-ABR-2026-Proposal-V1.0.pdf', 'demo/cbh-abr-2026/proposal-v1.pdf', 412800, 'application/pdf', v_owner_id),
    (v_proposal_id, v_org_id, 'contract', 'GHXSTSHIP-MSA-V3.pdf', 'demo/cbh-abr-2026/msa-v3.pdf', 184320, 'application/pdf', v_owner_id);

  -- ── ACTIVITY ──
  perform log_proposal_activity(v_proposal_id, v_org_id, 'proposal.sent', v_owner_id, 'GHXSTSHIP', 'proposal', v_proposal_id, 'Proposal V1.0 sent to client.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'sow.signed', v_owner_id, 'Cornbread Hemp', 'approval', v_proposal_id, 'Master SOW counter-signed.', '{}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.completed', v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 01 — Discovery & Creative Brief completed.', '{"phase_num":1}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 02 — Concept Adaptation entered review.', '{"phase_num":2}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'phase.started',   v_owner_id, 'GHXSTSHIP', 'phase', v_proposal_id, 'Phase 03 — Engineering & Technical Development started.', '{"phase_num":3}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'co.priced',       v_owner_id, 'GHXSTSHIP', 'change_order', v_co_id, 'Change order #1 priced — awaiting client decision.', '{"delta_cents":51000}');
  perform log_proposal_activity(v_proposal_id, v_org_id, 'rev.created',     v_owner_id, 'GHXSTSHIP', 'revision_round', v_round_id, 'Revision round opened — greenery palette mockups.', '{"round_num":2}');

  return v_proposal_id;
end;
$$;
