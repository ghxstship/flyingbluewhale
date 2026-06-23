-- LEG3ND certify→recert half of the learning arc. A certification catalog,
-- per-learner holdings (credential state via `accreditation_state` tones),
-- and an append-only recert journal. Closes the FK from courses →
-- certifications. 3NF, org-scoped, RLS. LDP naming: `*_state`.
--
-- CODE-READY migration — not applied to the live project here.

-- ── Certification catalog ──────────────────────────────────────────────
create table public.legend_certifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  -- months of validity before a recert is required; null = never expires.
  validity_months integer check (validity_months is null or validity_months > 0),
  -- how many days before expiry the holding flips to the "expiring" tone.
  recert_window_days integer not null default 30 check (recert_window_days >= 0),
  certification_state text not null default 'active' check (certification_state in ('active', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (org_id, code)
);
create index certifications_org_idx on public.legend_certifications (org_id, certification_state) where deleted_at is null;

alter table public.legend_certifications enable row level security;
create policy certifications_select on public.legend_certifications
  for select using (private.is_org_member(org_id));
create policy certifications_write on public.legend_certifications
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_certifications_updated before update on public.legend_certifications
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.legend_certifications to authenticated;

-- Close the deferred FK from courses (previous migration).
alter table public.legend_courses
  add constraint legend_courses_grants_certification_fk
  foreign key (grants_certification_id) references public.legend_certifications(id) on delete set null;

-- ── Certification holders (one per learner per certification) ──────────
-- `accreditation_state` is the credential lifecycle: valid / expiring soon /
-- expired / suspended / revoked / pending. The recert matrix tones key off it.
create table public.certification_holders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  certification_id uuid not null references public.legend_certifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source_course_id uuid references public.legend_courses(id) on delete set null,
  issued_at timestamptz not null default now(),
  expires_on date,
  last_recert_at timestamptz,
  next_recert_due date,
  accreditation_state text not null default 'valid'
    check (accreditation_state in ('pending', 'valid', 'expiring', 'expired', 'suspended', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, certification_id, user_id)
);
create index certification_holders_user_idx on public.certification_holders (org_id, user_id, accreditation_state);
create index certification_holders_due_idx on public.certification_holders (org_id, next_recert_due);

alter table public.certification_holders enable row level security;
create policy certification_holders_select on public.certification_holders
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy certification_holders_insert on public.certification_holders
  for insert with check (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy certification_holders_write on public.certification_holders
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
create trigger trg_certification_holders_updated before update on public.certification_holders
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.certification_holders to authenticated;

-- ── Recert journal (append-only) ───────────────────────────────────────
create table public.certification_recerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  holder_id uuid not null references public.certification_holders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  recert_state text not null default 'requested'
    check (recert_state in ('requested', 'in_review', 'approved', 'rejected', 'completed')),
  evidence_url text,
  note text,
  submitted_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);
create index certification_recerts_holder_idx on public.certification_recerts (org_id, holder_id, submitted_at desc);

alter table public.certification_recerts enable row level security;
create policy certification_recerts_select on public.certification_recerts
  for select using (private.is_org_member(org_id) and (user_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin', 'controller'])));
create policy certification_recerts_insert on public.certification_recerts
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy certification_recerts_write on public.certification_recerts
  for all using (private.has_org_role(org_id, array['owner', 'admin', 'controller']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'controller']));
grant select, insert, update, delete on public.certification_recerts to authenticated;
