-- Promote the dependency-free marketplace CHECK columns to native enums (values
-- unchanged) so they land in Constants and unblock the ×2-duplicated API offender.
-- + service_requests.category → lookup (additive). APPLIED 2026-07-18 (ledger 20260718151325).
--
-- DEFERRED enum promotions (dependency-entangled — need coordinated view/policy/trigger
-- rewrites, see docs/schema/enum-ui-enrichment-2026-07-18.md §9):
--   service_requests.request_state + severity (trigger service_request_set_sla),
--   service_sla_policies.severity, punch_items.item_state + priority (view v_action_items),
--   event_listings.listing_state (cross-table RLS policies).

create type public.marketplace_listing_state as enum ('draft','active','sold','withdrawn');
alter table public.marketplace_listings drop constraint if exists marketplace_listings_listing_state_check;
alter table public.marketplace_listings alter column listing_state drop default;
alter table public.marketplace_listings alter column listing_state type public.marketplace_listing_state using listing_state::public.marketplace_listing_state;
alter table public.marketplace_listings alter column listing_state set default 'active';

create type public.item_condition as enum ('new','like_new','used','for_parts');
alter table public.marketplace_listings drop constraint if exists marketplace_listings_item_condition_check;
alter table public.marketplace_listings alter column item_condition type public.item_condition using item_condition::public.item_condition;

create table if not exists public.ref_service_request_category (
  code text primary key, display_label text not null, description text,
  sort_order int not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.ref_service_request_category enable row level security;
create policy ref_service_request_category_read on public.ref_service_request_category
  for select to authenticated using (true);
insert into public.ref_service_request_category (code, display_label, sort_order) values
  ('av','AV',10),('cleaning','Cleaning',20),('repair','Repair',30),('it','IT',40),
  ('hospitality','Hospitality',50),('security','Security',60),('other','Other',99)
on conflict (code) do nothing;
alter table public.service_requests add column if not exists category_code text;
update public.service_requests set category_code = case category
  when 'AV' then 'av' when 'cleaning' then 'cleaning' when 'repair' then 'repair'
  when 'IT' then 'it' when 'hospitality' then 'hospitality' when 'security' then 'security'
  when 'other' then 'other' end
  where category is not null and category_code is null;
alter table public.service_requests
  add constraint service_requests_category_code_fkey
  foreign key (category_code) references public.ref_service_request_category(code) not valid;
alter table public.service_requests validate constraint service_requests_category_code_fkey;
create index if not exists idx_service_requests_category_code on public.service_requests(category_code);
