-- Advancing & Onboarding Merge Engine (kit 27) — Phase 2: merge & send.
--
--   advance_send_batches    — one merge run: packet × template × schedule.
--   advance_send_recipients — one personalized render per contact: the
--                             render snapshot (subject + merge fields at
--                             send time), the delivery funnel state
--                             (queued → delivered → opened → started →
--                             submitted → complete, or bounced), and the
--                             unique portal token that unlocks the
--                             recipient's scoped packet at
--                             /p/[slug]/advancing?t=<token>.
--
-- Email is the invite, the portal is the packet: the send carries the
-- checklist summary + deadline + one CTA; worksheets, forms, scheduling
-- and the guide live behind the portal token.
--
-- LDP: named enums on *_state columns; append-only *_state_transitions
-- ledgers. RLS: org members read, manager+ writes (recipients are
-- external and reach their row only via the service-role token lookup).

do $$ begin
  create type public.advance_batch_state as enum ('draft','scheduled','sending','sent','failed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.advance_delivery_state as enum ('queued','delivered','bounced','opened','started','submitted','complete');
exception when duplicate_object then null; end $$;

create table if not exists public.advance_send_batches (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  packet_id uuid not null references public.advance_packets(id) on delete cascade,
  template_id uuid references public.email_templates(id) on delete set null,
  subject text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  batch_state public.advance_batch_state not null default 'draft',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists advance_send_batches_org_idx on public.advance_send_batches (org_id, created_at desc) where deleted_at is null;
create index if not exists advance_send_batches_packet_idx on public.advance_send_batches (packet_id) where deleted_at is null;

create table if not exists public.advance_send_batch_state_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  batch_id uuid not null references public.advance_send_batches(id) on delete cascade,
  from_state public.advance_batch_state,
  to_state public.advance_batch_state not null,
  transitioned_at timestamptz not null default now(),
  transitioned_by uuid,
  reason text
);

create index if not exists advance_batch_transitions_batch_idx on public.advance_send_batch_state_transitions (batch_id, transitioned_at desc);
create index if not exists advance_batch_transitions_org_idx on public.advance_send_batch_state_transitions (org_id, transitioned_at desc);

create table if not exists public.advance_send_recipients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  batch_id uuid not null references public.advance_send_batches(id) on delete cascade,
  audience_id uuid references public.advance_audiences(id) on delete set null,
  -- { name, email, phone } — resolved from the audience contacts at send time.
  contact jsonb not null default '{}'::jsonb,
  -- Subject + merge-field values frozen at send time (auditability: what
  -- did this recipient actually receive).
  render_snapshot jsonb,
  delivery_state public.advance_delivery_state not null default 'queued',
  -- Unique portal token: the recipient's only credential. 64 hex chars.
  portal_token text not null default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  late_flagged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists advance_send_recipients_token_uq on public.advance_send_recipients (portal_token);
create index if not exists advance_send_recipients_batch_idx on public.advance_send_recipients (batch_id) where deleted_at is null;
create index if not exists advance_send_recipients_org_idx on public.advance_send_recipients (org_id) where deleted_at is null;
create index if not exists advance_send_recipients_audience_idx on public.advance_send_recipients (audience_id) where deleted_at is null;

create table if not exists public.advance_recipient_state_transitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  recipient_id uuid not null references public.advance_send_recipients(id) on delete cascade,
  from_state public.advance_delivery_state,
  to_state public.advance_delivery_state not null,
  transitioned_at timestamptz not null default now(),
  transitioned_by uuid,
  reason text
);

create index if not exists advance_recipient_transitions_recipient_idx on public.advance_recipient_state_transitions (recipient_id, transitioned_at desc);
create index if not exists advance_recipient_transitions_org_idx on public.advance_recipient_state_transitions (org_id, transitioned_at desc);

alter table public.advance_send_batches enable row level security;
create policy advance_send_batches_org_select on public.advance_send_batches for select using (private.is_org_member(org_id));
create policy advance_send_batches_org_write on public.advance_send_batches using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_send_batches_touch_updated_at before update on public.advance_send_batches for each row execute function public.touch_updated_at();

alter table public.advance_send_batch_state_transitions enable row level security;
create policy advance_batch_transitions_select on public.advance_send_batch_state_transitions for select using (private.is_org_member(org_id));
create policy advance_batch_transitions_insert on public.advance_send_batch_state_transitions for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));

alter table public.advance_send_recipients enable row level security;
create policy advance_send_recipients_org_select on public.advance_send_recipients for select using (private.is_org_member(org_id));
create policy advance_send_recipients_org_write on public.advance_send_recipients using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create trigger advance_send_recipients_touch_updated_at before update on public.advance_send_recipients for each row execute function public.touch_updated_at();

alter table public.advance_recipient_state_transitions enable row level security;
create policy advance_recipient_transitions_select on public.advance_recipient_state_transitions for select using (private.is_org_member(org_id));
create policy advance_recipient_transitions_insert on public.advance_recipient_state_transitions for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
