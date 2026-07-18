-- ============================================================================
-- M2  Reference tables + FK wiring for free-text `category` columns
-- APPLIED 2026-07-18 (ledger version 20260718124815). Additive: lookup tables +
-- nullable *_code FK columns + backfill + validated FKs + indexes. Legacy text
-- columns are RETAINED, so the application keeps working unchanged until it is cut
-- over and the staged M3 (drop legacy columns) runs. Backfill verified 100% mapped.
-- ============================================================================

-- ===== UP =====================================================================

-- ---------------------------------------------------------------------------
-- 2.1  Lookup tables (canonical shape: immutable code PK + label/desc/order/active)
-- ---------------------------------------------------------------------------
create table if not exists public.ref_certification_category (
  code          text primary key,
  display_label text not null,
  description   text,
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create table if not exists public.ref_onboarding_step_category (like public.ref_certification_category including all);
create table if not exists public.ref_expense_category         (like public.ref_certification_category including all);
create table if not exists public.ref_budget_category          (like public.ref_certification_category including all);
create table if not exists public.ref_vendor_category          (like public.ref_certification_category including all);

-- RLS: global reference vocabulary — readable by any authenticated user;
-- writes only via service role (no write policy = denied under RLS).
do $$
declare t text;
begin
  foreach t in array array[
    'ref_certification_category','ref_onboarding_step_category',
    'ref_expense_category','ref_budget_category','ref_vendor_category'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format($p$create policy %I on public.%I for select to authenticated using (true)$p$,
                   t||'_read', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2.2  Seed canonical rows (only values already present in live data)
-- ---------------------------------------------------------------------------
insert into public.ref_certification_category (code, display_label, sort_order) values
  ('driving','Driving',10),('equipment','Equipment',20),('food','Food',30),
  ('insurance','Insurance',40),('safety','Safety',50)
on conflict (code) do nothing;

insert into public.ref_onboarding_step_category (code, display_label, sort_order) values
  ('communication','Communication',10),('paperwork','Paperwork',20),('safety','Safety',30),
  ('travel','Travel',40),('venue','Venue',50)
on conflict (code) do nothing;

insert into public.ref_expense_category (code, display_label, sort_order) values
  ('av_rental','AV Rental',10),('supplies','Supplies',20),('travel','Travel',30)
on conflict (code) do nothing;

insert into public.ref_budget_category (code, display_label, sort_order) values
  ('change_order','Change Order',10),('fabrication','Fabrication',20),('graphics','Graphics',30),
  ('logistics','Logistics',40),('materials','Materials',50),('production','Production',60)
on conflict (code) do nothing;

-- 'staging_rigging' kept DISTINCT from 'staging' pending owner review (see report §6.1).
insert into public.ref_vendor_category (code, display_label, sort_order) values
  ('brand_ambassador_staffing','Brand Ambassador Staffing',10),('scenic','Scenic',20),
  ('staging','Staging',30),('staging_rigging','Staging & Rigging',40)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 2.3  Add nullable *_code FK columns (legacy text column retained)
-- ---------------------------------------------------------------------------
alter table public.certifications   add column if not exists category_code text;
alter table public.onboarding_steps add column if not exists category_code text;
alter table public.expenses         add column if not exists category_code text;
alter table public.budgets          add column if not exists category_code text;
alter table public.vendors          add column if not exists category_code text;

-- ---------------------------------------------------------------------------
-- 2.4  Backfill via explicit crosswalk (auditable; mirrors the variant map)
-- ---------------------------------------------------------------------------
update public.certifications set category_code = lower(category)
  where category is not null and category_code is null;

update public.onboarding_steps set category_code = lower(category)
  where category is not null and category_code is null;

update public.expenses set category_code = case category
  when 'AV rental' then 'av_rental' when 'Supplies' then 'supplies' when 'Travel' then 'travel' end
  where category is not null and category_code is null;

update public.budgets set category_code = case category
  when 'Change Order' then 'change_order' when 'Fabrication' then 'fabrication'
  when 'Graphics' then 'graphics' when 'Logistics' then 'logistics'
  when 'Materials' then 'materials' when 'Production' then 'production' end
  where category is not null and category_code is null;

update public.vendors set category_code = case category
  when 'Brand Ambassador Staffing' then 'brand_ambassador_staffing'
  when 'Scenic' then 'scenic' when 'Staging' then 'staging'
  when 'Staging & rigging' then 'staging_rigging' end
  where category is not null and category_code is null;

-- Guard: fail loudly if any non-null category didn't map (would signal new dirt).
do $$
declare bad int;
begin
  select
    (select count(*) from public.certifications   where category is not null and category_code is null)
  + (select count(*) from public.onboarding_steps where category is not null and category_code is null)
  + (select count(*) from public.expenses         where category is not null and category_code is null)
  + (select count(*) from public.budgets          where category is not null and category_code is null)
  + (select count(*) from public.vendors          where category is not null and category_code is null)
  into bad;
  if bad > 0 then
    raise exception 'enum-normalization M2: % category rows failed to map — investigate before adding FKs', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2.5  FK constraints (NOT VALID → VALIDATE) + indexes
-- ---------------------------------------------------------------------------
alter table public.certifications   add constraint certifications_category_code_fkey
  foreign key (category_code) references public.ref_certification_category(code) not valid;
alter table public.onboarding_steps add constraint onboarding_steps_category_code_fkey
  foreign key (category_code) references public.ref_onboarding_step_category(code) not valid;
alter table public.expenses         add constraint expenses_category_code_fkey
  foreign key (category_code) references public.ref_expense_category(code) not valid;
alter table public.budgets          add constraint budgets_category_code_fkey
  foreign key (category_code) references public.ref_budget_category(code) not valid;
alter table public.vendors          add constraint vendors_category_code_fkey
  foreign key (category_code) references public.ref_vendor_category(code) not valid;

alter table public.certifications   validate constraint certifications_category_code_fkey;
alter table public.onboarding_steps validate constraint onboarding_steps_category_code_fkey;
alter table public.expenses         validate constraint expenses_category_code_fkey;
alter table public.budgets          validate constraint budgets_category_code_fkey;
alter table public.vendors          validate constraint vendors_category_code_fkey;

create index if not exists idx_certifications_category_code   on public.certifications(category_code);
create index if not exists idx_onboarding_steps_category_code on public.onboarding_steps(category_code);
create index if not exists idx_expenses_category_code         on public.expenses(category_code);
create index if not exists idx_budgets_category_code          on public.budgets(category_code);
create index if not exists idx_vendors_category_code          on public.vendors(category_code);

-- ===== DOWN (rollback) ========================================================
-- Fully reverses M2 (legacy text columns were never dropped here, so no data loss).
--
-- drop index if exists public.idx_vendors_category_code, public.idx_budgets_category_code,
--   public.idx_expenses_category_code, public.idx_onboarding_steps_category_code,
--   public.idx_certifications_category_code;
-- alter table public.vendors          drop constraint if exists vendors_category_code_fkey;
-- alter table public.budgets          drop constraint if exists budgets_category_code_fkey;
-- alter table public.expenses         drop constraint if exists expenses_category_code_fkey;
-- alter table public.onboarding_steps drop constraint if exists onboarding_steps_category_code_fkey;
-- alter table public.certifications   drop constraint if exists certifications_category_code_fkey;
-- alter table public.vendors          drop column if exists category_code;
-- alter table public.budgets          drop column if exists category_code;
-- alter table public.expenses         drop column if exists category_code;
-- alter table public.onboarding_steps drop column if exists category_code;
-- alter table public.certifications   drop column if exists category_code;
-- drop table if exists public.ref_vendor_category, public.ref_budget_category,
--   public.ref_expense_category, public.ref_onboarding_step_category,
--   public.ref_certification_category;
