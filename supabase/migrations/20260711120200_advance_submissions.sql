-- Advancing & Onboarding Merge Engine (kit 27) — Phase 3: submissions & deadlines.
--
--   advance_submissions     — structured returns (crew list rows, production
--                             advance requests, travel rows, rider uploads),
--                             schema-driven via submission_schemas.ts. Accepts
--                             line-item adds/changes after initial submission.
--                             `received_via` flags the email-ingest fallback
--                             (attachments replied to the thread are mirrored
--                             here, never lost in an inbox).
--   advance_deadline_events — the materialized reminder schedule (T-5, T-2,
--                             lapse, allocation confirm T-2) consumed by the
--                             automations scheduler tick; each row emits one
--                             advance.deadline.* domain event when due.
--
-- LDP: named enums on *_state columns; append-only ledger. RLS: org members
-- read, manager+ writes (recipient writes happen via the service-role
-- token path in the portal actions).

do $$ begin
  create type public.advance_submission_state as enum ('draft','submitted','accepted','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_received_via as enum ('portal','email_ingest');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_deadline_kind as enum ('t5_reminder','t2_reminder','lapse','allocation_confirm');
exception when duplicate_object then null; end $$;

create table if not exists public.advance_submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  recipient_id uuid not null references public.advance_send_recipients(id) on delete cascade,
  section_id uuid not null references public.advance_packet_sections(id) on delete cascade,
  schema_key text not null,
  rows jsonb not null default '[]'::jsonb,
  submission_state public.advance_submission_state not null default 'draft',
  received_via public.advance_received_via not null default 'portal',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists advance_submissions_recipient_idx on public.advance_submissions (recipient_id) where deleted_at is null;
create index if not exists advance_submissions_section_idx on public.advance_submissions (section_id) where deleted_at is null;
create index if not exists advance_submissions_org_idx on public.advance_submissions (org_id) where deleted_at is null;

create table if not exists public.advance_submission_state_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  submission_id uuid not null references public.advance_submissions(id) on delete cascade,
  from_state public.advance_submission_state,
  to_state public.advance_submission_state not null,
  transitioned_at timestamptz not null default now(),
  transitioned_by uuid,
  reason text
);

create index if not exists advance_submission_transitions_submission_idx on public.advance_submission_state_transitions (submission_id, transitioned_at desc);
create index if not exists advance_submission_transitions_org_idx on public.advance_submission_state_transitions (org_id, transitioned_at desc);

create table if not exists public.advance_deadline_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  packet_id uuid not null references public.advance_packets(id) on delete cascade,
  audience_id uuid references public.advance_audiences(id) on delete cascade,
  section_assignment_id uuid references public.advance_section_assignments(id) on delete cascade,
  event_kind public.advance_deadline_kind not null,
  due_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists advance_deadline_events_due_idx on public.advance_deadline_events (due_at) where processed_at is null;
create index if not exists advance_deadline_events_org_idx on public.advance_deadline_events (org_id, due_at desc);
create index if not exists advance_deadline_events_packet_idx on public.advance_deadline_events (packet_id);

alter table public.advance_submissions enable row level security;
create policy advance_submissions_org_select on public.advance_submissions for select using (private.is_org_member(org_id));
create policy advance_submissions_org_write on public.advance_submissions using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_submissions_touch_updated_at before update on public.advance_submissions for each row execute function public.touch_updated_at();

alter table public.advance_submission_state_transitions enable row level security;
create policy advance_submission_transitions_select on public.advance_submission_state_transitions for select using (private.is_org_member(org_id));
create policy advance_submission_transitions_insert on public.advance_submission_state_transitions for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

alter table public.advance_deadline_events enable row level security;
create policy advance_deadline_events_org_select on public.advance_deadline_events for select using (private.is_org_member(org_id));
create policy advance_deadline_events_org_write on public.advance_deadline_events using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
