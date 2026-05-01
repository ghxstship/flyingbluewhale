-- ============================================================================
-- OFFER LETTERS — 3NF / SSOT REWRITE
-- Clean cut, NOT backwards-compatible. The previous implementation (migration
-- 20260430_000034) is dropped entirely.
--
-- Design rules:
--   * No denormalized identity / role / location / rate fields on offer_letters
--   * Every recipient is a `crew_members` row (recipient_id FK)
--   * Every role is an `org_roles` row (role_id FK)
--   * Every venue is `venues.id` linked to a `locations.id`
--   * Every compensation amount comes from `rate_card_items.unit_price_cents`
--   * Org-wide defaults (terms, governing law, payment schedule, signing
--     authority, default inclusions, brand) live in `org_offer_letter_settings`
--   * Letters carry only the FK columns + per-letter overrides
--   * `offer_letters_resolved` view joins everything; the app reads from it
--   * Snapshot trigger freezes the resolved values when status leaves 'draft'
--     so the signed letter is a legally durable record of the moment.
-- ============================================================================

-- ── 1. DROP v1 ───────────────────────────────────────────────────────────────
drop function if exists seed_salvage_city_offer_letters(text);
drop function if exists accept_offer_letter(uuid, text, text, inet, text);
drop function if exists decline_offer_letter(uuid, text, text);
drop function if exists record_offer_letter_view(uuid, text);
drop function if exists get_offer_letter_by_token(uuid, text);
drop function if exists get_offer_letter_project_name(uuid, text);
drop function if exists generate_offer_access_code();
drop table if exists offer_letter_activity cascade;
drop table if exists offer_letters cascade;
drop type if exists offer_letter_status cascade;
drop type if exists offer_letter_employer cascade;
drop type if exists offer_letter_classification cascade;

-- ── 2. EXTEND CANONICAL TABLES ───────────────────────────────────────────────
alter table org_roles
  add column if not exists department text,
  add column if not exists responsibilities jsonb not null default '[]'::jsonb;

-- crew_members needs uniqueness on (org_id, lower(email)) for idempotent
-- backfill and FK lookups by email.
create unique index if not exists crew_members_org_email_idx
  on crew_members (org_id, lower(email))
  where email is not null;

-- venues needs (org_id, project_id, name) unique for idempotent seeding
create unique index if not exists venues_org_project_name_idx
  on venues (org_id, project_id, name);

-- rate_card_items uniqueness on (org_id, sku) for idempotent seeding
create unique index if not exists rate_card_items_org_sku_idx
  on rate_card_items (org_id, sku);

-- locations uniqueness on (org_id, name)
create unique index if not exists locations_org_name_idx
  on locations (org_id, name);

-- ── 3. ENUMS ─────────────────────────────────────────────────────────────────
create type offer_letter_status as enum (
  'draft','sent','viewed','accepted','declined','withdrawn','expired'
);
create type offer_letter_employer as enum ('ghxstship','five_senses','joint');
create type offer_letter_classification as enum ('w2','1099','agency','intern');
create type compensation_basis as enum ('per_day','per_show_day','flat_fee','hourly','tbd');

-- ── 4. ORG-LEVEL OFFER LETTER SETTINGS ───────────────────────────────────────
create table org_offer_letter_settings (
  org_id                            uuid primary key references orgs(id) on delete cascade,
  default_employer                  offer_letter_employer not null default 'ghxstship',
  default_classification            offer_letter_classification not null default '1099',
  default_payment_schedule          text not null,
  default_terms                     text not null,
  default_governing_law             text not null default 'State of Florida',
  default_confidentiality           boolean not null default true,
  default_travel_provided           boolean not null default true,
  default_lodging_provided          boolean not null default true,
  default_meals_provided            boolean not null default true,
  default_inclusions                jsonb not null default '[]'::jsonb,
  signing_authority_crew_member_id  uuid,                          -- FK added below
  brand_logo_url                    text,
  updated_at                        timestamptz not null default now()
);

-- ── 5. NEW OFFER_LETTERS — FK only ───────────────────────────────────────────
create table offer_letters (
  id                            uuid primary key default gen_random_uuid(),
  org_id                        uuid not null references orgs(id) on delete cascade,
  project_id                    uuid not null references projects(id) on delete cascade,

  -- Canonical identity, position, location
  crew_member_id                uuid not null references crew_members(id) on delete restrict,
  role_id                       uuid not null references org_roles(id) on delete restrict,
  reports_to_crew_member_id     uuid references crew_members(id) on delete set null,
  venue_id                      uuid references venues(id) on delete set null,
  employer                      offer_letter_employer not null,
  classification                offer_letter_classification not null,

  -- Canonical compensation
  rate_card_item_id             uuid references rate_card_items(id) on delete restrict,
  per_diem_rate_card_item_id    uuid references rate_card_items(id) on delete set null,
  compensation_basis            compensation_basis not null default 'per_day',
  override_amount_cents         bigint,        -- NULL = computed: rate × engagement_days
  override_per_diem_cents       bigint,        -- NULL = use per_diem_rate_card_item

  -- Engagement window — NULL = inherit from project
  engagement_start              date,
  engagement_end                date,

  -- Per-letter overrides (NULL = inherit from org_offer_letter_settings)
  travel_provided               boolean,
  lodging_provided              boolean,
  meals_provided                boolean,
  extra_inclusions              jsonb not null default '[]'::jsonb,
  expectations_override         text,          -- NULL = role.description + responsibilities
  terms_override                text,          -- NULL = settings.default_terms

  -- Public access
  public_token                  uuid not null default gen_random_uuid(),
  access_code                   text not null,
  token_expires_at              timestamptz,

  -- Lifecycle
  status                        offer_letter_status not null default 'draft',
  sent_at                       timestamptz,
  first_viewed_at               timestamptz,
  last_viewed_at                timestamptz,
  view_count                    int not null default 0,
  accepted_at                   timestamptz,
  accepted_signature            text,
  accepted_ip                   inet,
  accepted_user_agent           text,
  declined_at                   timestamptz,
  decline_reason                text,
  withdrawn_at                  timestamptz,

  -- Legal snapshot — frozen on draft → non-draft
  snapshot                      jsonb,
  snapshot_at                   timestamptz,

  -- Audit
  created_by                    uuid references users(id),
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),

  unique (public_token),
  unique (org_id, project_id, crew_member_id)
);

alter table org_offer_letter_settings
  add constraint org_offer_letter_settings_signing_authority_fkey
  foreign key (signing_authority_crew_member_id)
  references crew_members(id) on delete set null;

create index offer_letters_org_idx on offer_letters(org_id);
create index offer_letters_project_idx on offer_letters(project_id);
create index offer_letters_crew_idx on offer_letters(crew_member_id);
create index offer_letters_role_idx on offer_letters(role_id);
create index offer_letters_status_idx on offer_letters(status);
create index offer_letters_token_idx on offer_letters(public_token);

create trigger offer_letters_touch_updated_at
  before update on offer_letters
  for each row execute function touch_updated_at();

-- ── 6. ACTIVITY LOG ──────────────────────────────────────────────────────────
create table offer_letter_activity (
  id              uuid primary key default gen_random_uuid(),
  offer_letter_id uuid not null references offer_letters(id) on delete cascade,
  org_id          uuid not null references orgs(id) on delete cascade,
  kind            text not null,
  actor_user_id   uuid references users(id),
  actor_label     text,
  summary         text not null,
  meta            jsonb not null default '{}'::jsonb,
  occurred_at     timestamptz not null default now()
);
create index offer_letter_activity_letter_idx
  on offer_letter_activity(offer_letter_id, occurred_at desc);

-- ── 7. RLS ───────────────────────────────────────────────────────────────────
alter table org_offer_letter_settings enable row level security;
alter table offer_letters             enable row level security;
alter table offer_letter_activity     enable row level security;

create policy org_offer_letter_settings_member on org_offer_letter_settings
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy offer_letters_member on offer_letters
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy offer_letter_activity_member on offer_letter_activity
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ── 8. RESOLVED VIEW ────────────────────────────────────────────────────────
-- Single SSOT-resolving view. Letter columns stay; canonical fields come
-- from the JOINs; effective_* columns apply per-letter override → org default.
create or replace view offer_letters_resolved as
select
  ol.id, ol.org_id, ol.project_id, ol.crew_member_id, ol.role_id,
  ol.reports_to_crew_member_id, ol.venue_id, ol.employer, ol.classification,
  ol.rate_card_item_id, ol.per_diem_rate_card_item_id, ol.compensation_basis,
  ol.override_amount_cents, ol.override_per_diem_cents,
  ol.engagement_start, ol.engagement_end,
  ol.travel_provided, ol.lodging_provided, ol.meals_provided,
  ol.extra_inclusions, ol.expectations_override, ol.terms_override,
  ol.public_token, ol.access_code, ol.token_expires_at,
  ol.status, ol.sent_at, ol.first_viewed_at, ol.last_viewed_at, ol.view_count,
  ol.accepted_at, ol.accepted_signature, ol.accepted_ip, ol.accepted_user_agent,
  ol.declined_at, ol.decline_reason, ol.withdrawn_at,
  ol.snapshot, ol.snapshot_at, ol.created_by, ol.created_at, ol.updated_at,

  -- recipient (crew_members SSOT)
  cm.name              as recipient_name,
  cm.email             as recipient_email,
  cm.phone             as recipient_phone,
  cm.user_id           as recipient_user_id,

  -- role (org_roles SSOT)
  r.label              as role_title,
  r.slug               as role_slug,
  r.department         as role_department,
  r.description        as role_description,
  r.responsibilities   as role_responsibilities,

  -- reports to (crew_members SSOT)
  rt.name              as reports_to_name,
  rt.email             as reports_to_email,
  rt.phone             as reports_to_phone,

  -- venue + location (venues / locations SSOT)
  v.name               as venue_name,
  l.address            as venue_address,
  l.city               as venue_city,
  l.region             as venue_region,
  l.country            as venue_country,

  -- project (projects SSOT)
  p.name               as project_name,
  p.slug               as project_slug,
  p.start_date         as project_start_date,
  p.end_date           as project_end_date,

  -- compensation (rate_card_items SSOT)
  rc.unit_price_cents  as rate_unit_price_cents,
  rc.name              as rate_name,
  rc.sku               as rate_sku,
  pdrc.unit_price_cents as per_diem_unit_price_cents,
  pdrc.sku             as per_diem_sku,

  -- effective values (override → canonical)
  coalesce(ol.engagement_start, p.start_date) as effective_start,
  coalesce(ol.engagement_end,   p.end_date)   as effective_end,
  greatest(
    (coalesce(ol.engagement_end, p.end_date) - coalesce(ol.engagement_start, p.start_date) + 1),
    0
  ) as engagement_days,
  coalesce(ol.travel_provided,  s.default_travel_provided)  as effective_travel_provided,
  coalesce(ol.lodging_provided, s.default_lodging_provided) as effective_lodging_provided,
  coalesce(ol.meals_provided,   s.default_meals_provided)   as effective_meals_provided,
  coalesce(nullif(ol.terms_override, ''), s.default_terms)  as effective_terms,
  s.default_governing_law      as effective_governing_law,
  s.default_payment_schedule   as effective_payment_schedule,
  s.default_confidentiality    as effective_confidentiality,
  s.default_inclusions || coalesce(ol.extra_inclusions, '[]'::jsonb) as effective_inclusions,

  -- effective expectations (override → role description + responsibilities)
  coalesce(
    nullif(ol.expectations_override, ''),
    coalesce(r.description, '') ||
    case
      when jsonb_array_length(coalesce(r.responsibilities, '[]'::jsonb)) > 0
      then E'\n\nKey responsibilities:\n' || (
        select string_agg('• ' || rsp, E'\n')
          from jsonb_array_elements_text(r.responsibilities) rsp
      )
      else ''
    end
  ) as effective_expectations,

  -- effective compensation (override → basis-driven calc from rate card)
  case
    when ol.override_amount_cents is not null then ol.override_amount_cents
    when ol.compensation_basis = 'flat_fee' and rc.unit_price_cents is not null
      then rc.unit_price_cents
    when ol.compensation_basis = 'per_day' and rc.unit_price_cents is not null
      then rc.unit_price_cents * greatest(
        (coalesce(ol.engagement_end, p.end_date) - coalesce(ol.engagement_start, p.start_date) + 1),
        0
      )
    when ol.compensation_basis = 'tbd' then 0
    else 0
  end as effective_compensation_cents,
  coalesce(ol.override_per_diem_cents, pdrc.unit_price_cents, 0) as effective_per_diem_cents,

  -- signing authority (settings SSOT)
  sa.name              as signing_authority_name,
  sa.email             as signing_authority_email
from offer_letters ol
join crew_members cm on cm.id = ol.crew_member_id
join org_roles    r  on r.id  = ol.role_id
left join crew_members rt on rt.id = ol.reports_to_crew_member_id
left join venues v on v.id = ol.venue_id
left join locations l on l.id = v.location_id
join projects p on p.id = ol.project_id
left join rate_card_items rc   on rc.id   = ol.rate_card_item_id
left join rate_card_items pdrc on pdrc.id = ol.per_diem_rate_card_item_id
left join org_offer_letter_settings s on s.org_id = ol.org_id
left join crew_members sa on sa.id = s.signing_authority_crew_member_id;

-- ── 9. SNAPSHOT TRIGGER ──────────────────────────────────────────────────────
-- When a letter leaves draft, freeze the resolved jsonb so the signed
-- artifact is durable even if rate cards / roles / settings change later.
create or replace function snapshot_offer_letter()
returns trigger language plpgsql as $$
begin
  if (OLD.status = 'draft' and NEW.status <> 'draft') and NEW.snapshot is null then
    select to_jsonb(r.*) into NEW.snapshot
      from offer_letters_resolved r
      where r.id = NEW.id;
    NEW.snapshot_at := now();
  end if;
  return NEW;
end;
$$;
create trigger offer_letters_snapshot_trg
  before update on offer_letters
  for each row execute function snapshot_offer_letter();

-- ── 10. ACCESS CODE GENERATOR ────────────────────────────────────────────────
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

-- ── 11. PUBLIC ACCESS RPCs ──────────────────────────────────────────────────
-- Returns jsonb (snapshot if frozen, else live-resolved view row).
create or replace function get_offer_letter_by_token(p_token uuid, p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_letter offer_letters;
  v_resolved jsonb;
begin
  select * into v_letter from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_letter.id is null then return null; end if;
  if v_letter.token_expires_at is not null and v_letter.token_expires_at < now() then return null; end if;
  if v_letter.status = 'withdrawn' then return null; end if;

  if v_letter.snapshot is not null then
    return v_letter.snapshot;
  end if;
  select to_jsonb(r.*) into v_resolved
    from offer_letters_resolved r where r.id = v_letter.id;
  return v_resolved;
end;
$$;
revoke all on function get_offer_letter_by_token(uuid, text) from public;
grant execute on function get_offer_letter_by_token(uuid, text) to anon, authenticated;

create or replace function record_offer_letter_view(p_token uuid, p_code text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid; v_org_id uuid; v_first timestamptz;
begin
  select id, org_id, first_viewed_at into v_id, v_org_id, v_first
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then return; end if;

  update offer_letters
     set last_viewed_at = now(),
         first_viewed_at = coalesce(first_viewed_at, now()),
         view_count = view_count + 1,
         status = case when status = 'sent' then 'viewed'::offer_letter_status else status end
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
  p_token uuid, p_code text, p_signature text, p_ip inet, p_user_agent text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, status into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('declined','withdrawn','expired') then
    raise exception 'Letter is no longer accepting signatures (status=%)', v_status;
  end if;
  if length(coalesce(p_signature,'')) < 2 then
    raise exception 'Signature is required';
  end if;

  update offer_letters
     set status = 'accepted', accepted_at = now(),
         accepted_signature = p_signature, accepted_ip = p_ip,
         accepted_user_agent = p_user_agent
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'accepted', p_signature,
      'Letter accepted and counter-signed.',
      jsonb_build_object('ip', p_ip::text, 'user_agent', p_user_agent));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$$;
revoke all on function accept_offer_letter(uuid, text, text, inet, text) from public;
grant execute on function accept_offer_letter(uuid, text, text, inet, text) to anon, authenticated;

create or replace function decline_offer_letter(
  p_token uuid, p_code text, p_reason text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid; v_org_id uuid; v_status offer_letter_status; v_resolved jsonb;
begin
  select id, org_id, status into v_id, v_org_id, v_status
    from offer_letters
   where public_token = p_token and upper(access_code) = upper(p_code) limit 1;
  if v_id is null then raise exception 'Invalid token or access code'; end if;
  if v_status in ('accepted','withdrawn','expired') then
    raise exception 'Letter cannot be declined (status=%)', v_status;
  end if;

  update offer_letters
     set status = 'declined', declined_at = now(), decline_reason = p_reason
   where id = v_id;

  insert into offer_letter_activity (offer_letter_id, org_id, kind, actor_label, summary, meta)
    values (v_id, v_org_id, 'declined', 'Recipient',
      coalesce('Letter declined: ' || p_reason, 'Letter declined.'),
      jsonb_build_object('reason', p_reason));

  select snapshot into v_resolved from offer_letters where id = v_id;
  return v_resolved;
end;
$$;
revoke all on function decline_offer_letter(uuid, text, text) from public;
grant execute on function decline_offer_letter(uuid, text, text) to anon, authenticated;
