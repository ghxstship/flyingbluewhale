-- Marketplace inquiries — the contact/booking flow behind the public profile
-- detail pages (/marketplace/{vendors,crew,agencies,talent}/[handle] and
-- /marketplace/rfqs/[slug]). Before this, those pages linked to /inquire
-- routes that never existed.
--
-- Shape follows job_applications (0002): the subject org reads + triages,
-- the inquirer reads their own rows via /me/inquiries. Inserts go through
-- the submit_marketplace_inquiry SECURITY DEFINER RPC because the public
-- directory views (definer mode) deliberately omit org_id and the base
-- tables have no public-read policy — the RPC is the only path that can
-- resolve a public handle to its org while still enforcing the is-public
-- contract server-side.

create type public.marketplace_inquiry_subject as enum (
  'vendor',
  'crew',
  'agency',
  'talent',
  'rfq'
);

-- LDP naming discipline: triage lifecycle lives in inquiry_state, not status.
create type public.marketplace_inquiry_state as enum (
  'new',
  'responded',
  'closed',
  'withdrawn'
);

create table public.marketplace_inquiries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  subject_kind public.marketplace_inquiry_subject not null,
  subject_id uuid not null,
  -- Denormalized at insert so /me/inquiries renders without a definer-view
  -- join back to a profile the inquirer may no longer be allowed to read.
  subject_name text not null,
  subject_handle text not null,
  inquirer_user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  event_date date,
  contact_email text,
  contact_phone text,
  inquiry_state public.marketplace_inquiry_state default 'new' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  constraint marketplace_inquiries_message_len check (char_length(message) between 10 and 4000),
  constraint marketplace_inquiries_email_len check (contact_email is null or char_length(contact_email) <= 200),
  constraint marketplace_inquiries_phone_len check (contact_phone is null or char_length(contact_phone) <= 40)
);

comment on table public.marketplace_inquiries is
  'Inbound inquiries from marketplace visitors to public vendor/crew/agency/talent profiles and public RFQs. Org triages via inquiry_state; inquirer tracks via /me/inquiries.';

create index marketplace_inquiries_org_idx on public.marketplace_inquiries (org_id, inquiry_state);
create index marketplace_inquiries_inquirer_idx on public.marketplace_inquiries (inquirer_user_id);
-- One open inquiry per inquirer per subject — the 23505 backstop behind the
-- app-side duplicate guard (same pattern as job_applications).
create unique index marketplace_inquiries_open_dedupe
  on public.marketplace_inquiries (subject_kind, subject_id, inquirer_user_id)
  where inquiry_state = 'new';

create trigger marketplace_inquiries_touch_updated_at
  before update on public.marketplace_inquiries
  for each row execute function public.touch_updated_at();

alter table public.marketplace_inquiries enable row level security;

create policy marketplace_inquiries_select on public.marketplace_inquiries
  for select using (private.is_org_member(org_id) or inquirer_user_id = (select auth.uid()));

-- Direct inserts are org-side only (e.g. logging an inquiry that arrived by
-- phone). Visitor submissions go through the RPC below, which validates the
-- subject is actually public before writing.
create policy marketplace_inquiries_insert on public.marketplace_inquiries
  for insert with check (private.is_org_member(org_id));

create policy marketplace_inquiries_update on public.marketplace_inquiries
  for update using (private.is_org_member(org_id) or inquirer_user_id = (select auth.uid()))
  with check (private.is_org_member(org_id) or inquirer_user_id = (select auth.uid()));

create policy marketplace_inquiries_delete on public.marketplace_inquiries
  for delete using (private.has_org_role(org_id, array['owner', 'admin']));

create or replace function public.submit_marketplace_inquiry(
  p_subject_kind text,
  p_handle text,
  p_message text,
  p_event_date date default null,
  p_contact_email text default null,
  p_contact_phone text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid;
  v_subject uuid;
  v_name text;
  v_inquiry uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- Resolve the subject under definer rights, re-checking the same is-public
  -- predicates the public_* directory views use. A handle that resolves to a
  -- private or deleted profile must look identical to one that never existed.
  if p_subject_kind = 'vendor' then
    select v.org_id, v.id, v.name into v_org, v_subject, v_name
    from public.vendors v
    where v.public_handle = p_handle and v.is_public_profile = true and v.deleted_at is null;
  elsif p_subject_kind = 'crew' then
    select cm.org_id, cm.id, cm.name into v_org, v_subject, v_name
    from public.crew_members cm
    where cm.public_handle = p_handle and cm.is_public_profile = true;
  elsif p_subject_kind = 'agency' then
    select a.org_id, a.id, a.display_name into v_org, v_subject, v_name
    from public.agencies a
    where a.public_handle = p_handle and a.is_public = true and a.deleted_at is null;
  elsif p_subject_kind = 'talent' then
    select tp.org_id, tp.id, tp.act_name into v_org, v_subject, v_name
    from public.talent_profiles tp
    where tp.public_handle = p_handle and tp.is_public = true and tp.deleted_at is null;
  elsif p_subject_kind = 'rfq' then
    select r.org_id, r.id, r.title into v_org, v_subject, v_name
    from public.rfqs r
    where r.public_slug = p_handle and r.visibility = 'public' and r.status = 'sent';
  else
    raise exception 'Unknown inquiry subject kind: %', p_subject_kind using errcode = '22023';
  end if;

  if v_subject is null then
    raise exception 'Subject not found or not public' using errcode = 'P0002';
  end if;

  insert into public.marketplace_inquiries (
    org_id, subject_kind, subject_id, subject_name, subject_handle,
    inquirer_user_id, message, event_date, contact_email, contact_phone
  ) values (
    v_org, p_subject_kind::public.marketplace_inquiry_subject, v_subject, v_name, p_handle,
    v_uid, p_message, p_event_date, nullif(p_contact_email, ''), nullif(p_contact_phone, '')
  )
  returning id into v_inquiry;

  return v_inquiry;
end;
$$;

comment on function public.submit_marketplace_inquiry(text, text, text, date, text, text) is
  'Visitor-facing insert path for marketplace_inquiries. Definer mode: resolves a public handle to its org (views omit org_id) and re-validates the is-public contract. Raises P0002 for unknown/private subjects; unique_violation (23505) for a duplicate open inquiry.';

revoke all on function public.submit_marketplace_inquiry(text, text, text, date, text, text) from public, anon;
grant execute on function public.submit_marketplace_inquiry(text, text, text, date, text, text) to authenticated, service_role;
