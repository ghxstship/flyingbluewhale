-- Single-valued identity/contact attributes → columns on user_profiles (3NF).
alter table public.user_profiles
  add column if not exists pronouns text,
  add column if not exists role_title text,
  add column if not exists dietary_restrictions text,
  add column if not exists phone text,
  add column if not exists location_city text,
  add column if not exists location_region text,
  add column if not exists country text;

-- ── emergency_contacts (multi-valued → table; private to the user) ─────────
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  phone text,
  email text,
  priority integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index emergency_contacts_user_idx on public.emergency_contacts (user_id, priority);
alter table public.emergency_contacts enable row level security;
create policy emergency_contacts_all on public.emergency_contacts for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_emergency_contacts_updated before update on public.emergency_contacts for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.emergency_contacts to authenticated;

-- ── user_social_links (platform,url set → table) ──────────────────────────
create table public.user_social_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  url text not null,
  created_at timestamptz not null default now(),
  constraint user_social_links_unique unique (user_id, platform)
);
create index user_social_links_user_idx on public.user_social_links (user_id);
alter table public.user_social_links enable row level security;
create policy user_social_links_select on public.user_social_links for select using (true);
create policy user_social_links_write on public.user_social_links for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_social_links to authenticated;

-- ── user_travel_profiles (1:1, sensitive → owner only) ────────────────────
create table public.user_travel_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  home_airport text,
  date_of_birth date,
  passport_number text,
  known_traveler_number text,
  visas text,
  loyalty_programs text,
  updated_at timestamptz not null default now()
);
alter table public.user_travel_profiles enable row level security;
create policy user_travel_profiles_all on public.user_travel_profiles for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_user_travel_profiles_updated before update on public.user_travel_profiles for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.user_travel_profiles to authenticated;

-- ── user_uniform_sizes (1:1) ──────────────────────────────────────────────
create table public.user_uniform_sizes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  shirt text,
  pants text,
  shoe text,
  glove text,
  hat text,
  updated_at timestamptz not null default now()
);
alter table public.user_uniform_sizes enable row level security;
create policy user_uniform_sizes_all on public.user_uniform_sizes for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger trg_user_uniform_sizes_updated before update on public.user_uniform_sizes for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.user_uniform_sizes to authenticated;

-- ── user_certifications (multi → table) ───────────────────────────────────
create table public.user_certifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text,
  issued_on date,
  expires_on date,
  created_at timestamptz not null default now()
);
create index user_certifications_user_idx on public.user_certifications (user_id);
alter table public.user_certifications enable row level security;
create policy user_certifications_select on public.user_certifications for select using (true);
create policy user_certifications_write on public.user_certifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_certifications to authenticated;

-- ── user_skills (tag set → table) ─────────────────────────────────────────
create table public.user_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill text not null,
  created_at timestamptz not null default now(),
  constraint user_skills_unique unique (user_id, skill)
);
create index user_skills_user_idx on public.user_skills (user_id);
alter table public.user_skills enable row level security;
create policy user_skills_select on public.user_skills for select using (true);
create policy user_skills_write on public.user_skills for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.user_skills to authenticated;
