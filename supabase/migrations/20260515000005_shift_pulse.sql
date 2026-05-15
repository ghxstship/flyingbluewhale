-- Shift-end pulse: per-shift sentiment capture for deskless workers.
-- Competitive signal: Deputy Shift Pulse+, Connecteam recognition.
-- Workers rate 1-5 after checkout; managers aggregate on /console/workforce/sentiment.

create table if not exists public.shift_pulses (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.orgs(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  shift_id        uuid references public.shifts(id) on delete set null,
  shift_date      date not null default current_date,
  rating          smallint not null check (rating between 1 and 5),
  comment         text,
  created_at      timestamptz not null default now()
);

alter table public.shift_pulses enable row level security;

-- Workers can insert their own pulse once per shift date.
create policy "pulse_insert_own" on public.shift_pulses
  for insert with check (auth.uid() = user_id);

-- Workers can view their own pulses.
create policy "pulse_select_own" on public.shift_pulses
  for select using (auth.uid() = user_id);

-- Org members can view all pulses for their org.
create policy "pulse_select_org" on public.shift_pulses
  for select using (private.is_org_member(org_id));

-- Unique: one pulse per user per shift_date (per org).
create unique index if not exists shift_pulses_user_date_ux
  on public.shift_pulses(org_id, user_id, shift_date);

-- Index for manager aggregate queries.
create index if not exists shift_pulses_org_date_idx
  on public.shift_pulses(org_id, shift_date desc);
