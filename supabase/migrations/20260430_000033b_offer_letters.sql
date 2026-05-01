-- ============================================================================
-- OFFER LETTERS
-- Team-facing engagement letters for project crews. Each letter has a
-- public token + 6-char access code so recipients can open it without
-- authenticating into the platform. Acceptance is recorded with a typed
-- signature, IP, and timestamp.
-- ============================================================================

create type offer_letter_status as enum (
  'draft','sent','viewed','accepted','declined','withdrawn','expired'
);

create type offer_letter_employer as enum (
  'ghxstship','five_senses','joint'
);

create type offer_letter_classification as enum (
  'w2','1099','agency','intern'
);

create table offer_letters (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references orgs(id) on delete cascade,
  project_id           uuid references projects(id) on delete set null,

  -- Recipient
  recipient_name       text not null,
  recipient_email      text not null,
  recipient_phone      text,

  -- Engagement
  role_title           text not null,
  department           text,
  employer             offer_letter_employer not null default 'ghxstship',
  classification       offer_letter_classification not null default '1099',
  reports_to_name      text,
  reports_to_email     text,
  work_location        text,
  engagement_start     date,
  engagement_end       date,

  -- Compensation
  compensation_cents   bigint not null default 0,
  compensation_basis   text not null default 'flat_fee', -- 'flat_fee' | 'per_day' | 'hourly' | 'tbd'
  compensation_label   text,                              -- e.g. 'USD 1,500 per show day'
  payment_schedule     text,                              -- e.g. '60 % deposit on signature, 40 % balance on load-in'
  per_diem_cents       bigint not null default 0,
  travel_provided      boolean not null default false,
  lodging_provided     boolean not null default false,
  meals_provided       boolean not null default false,

  -- Body
  inclusions           jsonb not null default '[]'::jsonb,    -- ["Lodging at host hotel", ...]
  expectations         text,                                  -- free-form summary of duties
  terms                text,                                  -- free-form additional terms
  governing_law        text not null default 'State of Florida',
  confidentiality      boolean not null default true,

  -- Public access
  public_token         uuid not null default gen_random_uuid(),
  access_code          text not null,                         -- 6-char alphanumeric (uppercase)
  token_expires_at     timestamptz,

  -- Lifecycle
  status               offer_letter_status not null default 'draft',
  sent_at              timestamptz,
  first_viewed_at      timestamptz,
  last_viewed_at       timestamptz,
  view_count           int not null default 0,
  accepted_at          timestamptz,
  accepted_signature   text,                                  -- typed full name
  accepted_ip          inet,
  accepted_user_agent  text,
  declined_at          timestamptz,
  decline_reason       text,
  withdrawn_at         timestamptz,

  -- Doc artifacts
  pdf_storage_path     text,
  brand_logo_url       text,

  -- Audit
  created_by           uuid references users(id),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  unique (public_token)
);

create unique index offer_letters_org_project_recipient_idx
  on offer_letters (org_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(recipient_email));
create index offer_letters_org_idx on offer_letters(org_id);
create index offer_letters_project_idx on offer_letters(project_id);
create index offer_letters_status_idx on offer_letters(status);
create index offer_letters_token_idx on offer_letters(public_token);

create trigger offer_letters_touch_updated_at
  before update on offer_letters
  for each row execute function touch_updated_at();

-- ── ACTIVITY LOG ─────────────────────────────────────────────────────────────
create table offer_letter_activity (
  id              uuid primary key default gen_random_uuid(),
  offer_letter_id uuid not null references offer_letters(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  kind            text not null,            -- 'created','sent','viewed','accepted','declined','withdrawn','edited'
  actor_id        uuid references users(id),
  actor_label     text,
  summary         text not null,
  meta            jsonb not null default '{}'::jsonb,
  occurred_at     timestamptz not null default now()
);
create index offer_letter_activity_letter_idx on offer_letter_activity(offer_letter_id, occurred_at desc);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table offer_letters         enable row level security;
alter table offer_letter_activity enable row level security;

-- Authenticated org members read & write their org's letters
create policy offer_letters_member on offer_letters
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

create policy offer_letter_activity_member on offer_letter_activity
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ── PUBLIC ACCESS RPCs ───────────────────────────────────────────────────────
-- These RPCs run as SECURITY DEFINER so the public route (anon role) can read
-- a single letter when both the token AND the access code match. The function
-- never exposes other org rows.

create or replace function get_offer_letter_by_token(p_token uuid, p_code text)
returns offer_letters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row offer_letters;
begin
  select * into v_row
    from offer_letters
   where public_token = p_token
     and upper(access_code) = upper(p_code)
   limit 1;

  if v_row.id is null then
    return null;
  end if;

  if v_row.token_expires_at is not null and v_row.token_expires_at < now() then
    return null;
  end if;

  if v_row.status = 'withdrawn' then
    return null;
  end if;

  return v_row;
end;
$$;
revoke all on function get_offer_letter_by_token(uuid, text) from public;
grant execute on function get_offer_letter_by_token(uuid, text) to anon, authenticated;

create or replace function record_offer_letter_view(p_token uuid, p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_org_id uuid;
  v_first  timestamptz;
begin
  select id, org_id, first_viewed_at into v_id, v_org_id, v_first
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code)
   limit 1;
  if v_id is null then return; end if;

  update offer_letters
     set last_viewed_at  = now(),
         first_viewed_at = coalesce(first_viewed_at, now()),
         view_count      = view_count + 1,
         status          = case
                             when status in ('sent') then 'viewed'::offer_letter_status
                             else status
                           end
   where id = v_id;

  if v_first is null then
    insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary)
      values (v_id, v_org_id, 'viewed', 'Recipient', 'Letter opened for the first time.');
  end if;
end;
$$;
revoke all on function record_offer_letter_view(uuid, text) from public;
grant execute on function record_offer_letter_view(uuid, text) to anon, authenticated;

create or replace function accept_offer_letter(
  p_token uuid,
  p_code text,
  p_signature text,
  p_ip inet,
  p_user_agent text
) returns offer_letters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row offer_letters;
begin
  select * into v_row
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code)
   limit 1;
  if v_row.id is null then
    raise exception 'Invalid token or access code';
  end if;
  if v_row.status in ('declined','withdrawn','expired') then
    raise exception 'Letter is no longer accepting signatures (status=%)', v_row.status;
  end if;
  if length(coalesce(p_signature,'')) < 2 then
    raise exception 'Signature is required';
  end if;

  update offer_letters
     set status            = 'accepted',
         accepted_at       = now(),
         accepted_signature= p_signature,
         accepted_ip       = p_ip,
         accepted_user_agent = p_user_agent
   where id = v_row.id
   returning * into v_row;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_row.id, v_row.org_id, 'accepted', p_signature,
      'Letter accepted and counter-signed.',
      jsonb_build_object('ip', p_ip::text, 'user_agent', p_user_agent));

  return v_row;
end;
$$;
revoke all on function accept_offer_letter(uuid, text, text, inet, text) from public;
grant execute on function accept_offer_letter(uuid, text, text, inet, text) to anon, authenticated;

create or replace function decline_offer_letter(
  p_token uuid,
  p_code text,
  p_reason text
) returns offer_letters
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row offer_letters;
begin
  select * into v_row
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code)
   limit 1;
  if v_row.id is null then
    raise exception 'Invalid token or access code';
  end if;
  if v_row.status in ('accepted','withdrawn','expired') then
    raise exception 'Letter cannot be declined (status=%)', v_row.status;
  end if;

  update offer_letters
     set status         = 'declined',
         declined_at    = now(),
         decline_reason = p_reason
   where id = v_row.id
   returning * into v_row;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_row.id, v_row.org_id, 'declined', 'Recipient',
      coalesce('Letter declined: ' || p_reason, 'Letter declined.'),
      jsonb_build_object('reason', p_reason));

  return v_row;
end;
$$;
revoke all on function decline_offer_letter(uuid, text, text) from public;
grant execute on function decline_offer_letter(uuid, text, text) to anon, authenticated;

-- ── HELPER: short access code generator ──────────────────────────────────────
-- 6 character upper-case alphanumeric, ambiguous chars removed (no 0/O/1/I).
create or replace function generate_offer_access_code()
returns text language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return result;
end;
$$;

-- ── SEED FUNCTION: Salvage City team ─────────────────────────────────────────
-- Idempotent — upserts one draft offer letter per known team member for the
-- EDCLV26 Salvage City project. Compensation defaults to TBD ($0) so the
-- Operations Director can fill in real numbers in the admin UI before sending.
create or replace function seed_salvage_city_offer_letters(p_org_slug text default 'demo')
returns int language plpgsql as $$
declare
  v_org_id     uuid;
  v_project_id uuid;
  v_owner_id   uuid;
  v_inserted   int := 0;
  v_member     record;
  v_inclusions jsonb := jsonb_build_array(
    'Production credentials and radio for the engagement window',
    'Boxed crew meals on call days',
    'On-site parking at Las Vegas Motor Speedway',
    'Coverage by the GHXSTSHIP general liability and workers comp policies'
  );
  v_expectations text := 'Deliver against the Salvage City Supper Club EDCLV26 production playbook — load-in May 8 to 14, three show nights May 15 to 17, and strike May 18 to 19. Maintain professional conduct, follow the Insomniac safety and social media policy, and keep production leadership informed of schedule slips, safety concerns, or incidents through the assigned radio channel.';
  v_terms text := 'Compensation paid on a 60 % deposit / 40 % balance on load-in basis unless otherwise noted. Travel and lodging arranged by the Five Senses logistics lead. Recipient agrees to comply with the Insomniac 2026 Safety & Social Media Policy and the GHXSTSHIP standard production rider. Confidential — not to be shared outside of the recipient and their direct counsel.';
begin
  select id into v_org_id from orgs where slug = p_org_slug limit 1;
  if v_org_id is null then
    raise exception 'Org with slug % not found', p_org_slug;
  end if;

  select id into v_project_id from projects
   where org_id = v_org_id and slug = 'edclv26-salvage-city' limit 1;
  if v_project_id is null then
    raise exception 'Project edclv26-salvage-city not found in org %', p_org_slug;
  end if;

  select user_id into v_owner_id from memberships
   where org_id = v_org_id and role = 'owner' limit 1;

  for v_member in
    select * from (values
      -- Five Senses production leadership
      ('Sarah Fry',              'frysarah8@gmail.com',           '(615) 708-3676', 'Production Director',                'Production',  'five_senses', 'Julian Clarkson', 'julian@five-senses.co'),
      ('Vida Sotakoun',          'vidasotakoun@gmail.com',        '(815) 298-8244', 'Hospitality Manager',                'Hospitality', 'five_senses', 'Sarah Fry',       'frysarah8@gmail.com'),
      ('Kade Barrett',           'kadebarrett808@icloud.com',     '(443) 735-8870', 'Production Manager — F&B',           'Production',  'five_senses', 'Sarah Fry',       'frysarah8@gmail.com'),
      ('Skylar Contini-Enneper', 'skylarenneper@gmail.com',       '(702) 689-6907', 'Production Manager',                 'Production',  'five_senses', 'Sarah Fry',       'frysarah8@gmail.com'),
      ('Corrine Lepere',         'corrinelepere@gmail.com',       '(845) 406-0261', 'Production Manager',                 'Production',  'five_senses', 'Sarah Fry',       'frysarah8@gmail.com'),
      ('Margo Williams',         'margo@five-senses.co',          null,             'Credentials, Travel & Logistics',    'Logistics',   'five_senses', 'Julian Clarkson', 'julian@five-senses.co'),
      ('Alvaro Hernandez',       'alvaro@five-senses.co',         null,             'Finance Controller',                 'Finance',     'five_senses', 'Julian Clarkson', 'julian@five-senses.co'),
      ('Paul Seigenthaler',      'paul.seigenthaler@insomniac.com', '(856) 373-6541', 'Executive Producer',               'Executive',   'joint',       'Julian Clarkson', 'julian@five-senses.co'),
      -- GHXSTSHIP production crew
      ('Brett Mosher',           'brett@ghxstship.pro',           null,             'Production Crew — Heavy Equipment',  'Production',  'ghxstship',   'Julian Clarkson', 'julian.clarkson@ghxstship.pro'),
      ('Adam Waddle',            'adam@ghxstship.pro',            null,             'Production Crew — Skilled Carpentry / AV', 'Production', 'ghxstship', 'Julian Clarkson', 'julian.clarkson@ghxstship.pro'),
      ('Josh Parra',             'josh@ghxstship.pro',            null,             'Production Crew — Skilled Carpentry / AV', 'Production', 'ghxstship', 'Julian Clarkson', 'julian.clarkson@ghxstship.pro'),
      ('Mariah Williams',        'mariah@ghxstship.pro',          null,             'Production Assistant / Driver',      'Production',  'ghxstship',   'Julian Clarkson', 'julian.clarkson@ghxstship.pro'),
      ('Amy Reed',               'amy@ghxstship.pro',             null,             'Project Coordinator (Remote)',       'Production',  'ghxstship',   'Julian Clarkson', 'julian.clarkson@ghxstship.pro')
    ) as t(name, email, phone, role, department, employer, reports_to, reports_to_email)
  loop
    insert into offer_letters (
      org_id, project_id,
      recipient_name, recipient_email, recipient_phone,
      role_title, department, employer, classification,
      reports_to_name, reports_to_email, work_location,
      engagement_start, engagement_end,
      compensation_cents, compensation_basis, compensation_label,
      payment_schedule,
      travel_provided, lodging_provided, meals_provided,
      inclusions, expectations, terms,
      governing_law, confidentiality,
      access_code, token_expires_at,
      status, created_by
    ) values (
      v_org_id, v_project_id,
      v_member.name, v_member.email, v_member.phone,
      v_member.role, v_member.department, v_member.employer::offer_letter_employer, '1099'::offer_letter_classification,
      v_member.reports_to, v_member.reports_to_email,
      'Las Vegas Motor Speedway — Nomads Land',
      date '2026-05-08', date '2026-05-19',
      0, 'tbd', 'TBD — confirm in admin before sending',
      '60 % deposit on signature, 40 % balance on load-in',
      true, true, true,
      v_inclusions, v_expectations, v_terms,
      'State of Florida', true,
      generate_offer_access_code(), now() + interval '60 days',
      'draft', v_owner_id
    )
    on conflict (org_id, coalesce(project_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(recipient_email))
    do update set
      role_title       = excluded.role_title,
      department       = excluded.department,
      employer         = excluded.employer,
      reports_to_name  = excluded.reports_to_name,
      reports_to_email = excluded.reports_to_email,
      work_location    = excluded.work_location,
      engagement_start = excluded.engagement_start,
      engagement_end   = excluded.engagement_end,
      payment_schedule = excluded.payment_schedule,
      inclusions       = excluded.inclusions,
      expectations     = excluded.expectations,
      terms            = excluded.terms,
      updated_at       = now();
    v_inserted := v_inserted + 1;
  end loop;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
  select id, v_org_id, 'created', 'GHXSTSHIP', 'Seeded as draft for the Salvage City team.', '{}'::jsonb
    from offer_letters
   where project_id = v_project_id
     and not exists (
       select 1 from offer_letter_activity a
       where a.offer_letter_id = offer_letters.id and a.kind = 'created'
     );

  return v_inserted;
end;
$$;
