-- ============================================================================
-- 20260605150000 — XPMS Master Registry (URID DEPT.TEAM.SECTION)
-- ============================================================================
-- Event Kit Framework · Layer A (1 of 2).
--
-- Canonical, brand-agnostic XPMS Master Registry. Until now department/team/
-- class lived as free-text columns on public.budgets (migration 0070). This
-- table makes the URID (DEPT.TEAM.SECTION) a first-class, FK-mappable backbone
-- so every kit/budget line can reference a canonical registry node instead of
-- free text. Seeded verbatim from XPMS_Universal_Budget_Template.xlsx (Registry
-- sheet, 137 nodes across the 10-class 0000–9000 backbone).
--
-- Global canonical reference data (own-brand IP) — NOT org-scoped. Readable by
-- all authenticated users; written only by migrations / service role.
-- Naming discipline: reference table, no lifecycle column.
-- ============================================================================

create table if not exists public.xpms_registry (
  id                 uuid primary key default gen_random_uuid(),
  urid               text not null unique,            -- DEPT.TEAM.SECTION e.g. 5000.030.00
  level              text not null check (level in ('Department','Team','Section')),
  department         text not null,
  team               text,
  default_discipline text,
  notes              text,
  scope              text not null default 'canonical'
                       check (scope in ('canonical','external_example')),
  created_at         timestamptz not null default now()
);

comment on table public.xpms_registry is
  'XPMS Master Registry — canonical DEPT.TEAM.SECTION (URID) backbone seeded from the v08 Universal Budget Template Registry sheet. Own-brand IP, brand-agnostic, global reference (not org-scoped). Kit/budget lines map to a urid here.';
comment on column public.xpms_registry.urid is
  'Canonical URID DEPT.TEAM.SECTION (e.g. 5000.030.00 = Production · Audio Production). Append-only; codes never change once issued.';

create index if not exists xpms_registry_department_idx on public.xpms_registry (department);
create index if not exists xpms_registry_level_idx on public.xpms_registry (level);

alter table public.xpms_registry enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='xpms_registry'
      and policyname='xpms_registry_select_all_authenticated'
  ) then
    create policy "xpms_registry_select_all_authenticated" on public.xpms_registry
      for select to authenticated using (true);
  end if;
end$$;

-- Seed: 137 canonical nodes (idempotent on urid) ----------------------------
insert into public.xpms_registry (urid, level, department, team, default_discipline, notes) values
  ('0000.000.00','Department','Executive',NULL,'Multi',NULL),
  ('0000.010.00','Team','Executive','Executive Leadership',NULL,NULL),
  ('0000.020.00','Team','Executive','Finance & Accounting',NULL,NULL),
  ('0000.030.00','Team','Executive','Legal & Risk Management',NULL,NULL),
  ('0000.040.00','Team','Executive','Human Resources',NULL,NULL),
  ('0000.050.00','Team','Executive','Investor Relations',NULL,NULL),
  ('0000.060.00','Team','Executive','Strategic Partnerships',NULL,NULL),
  ('0000.070.00','Team','Executive','Government & Community Relations',NULL,NULL),
  ('0000.080.00','Team','Executive','Corporate Communications',NULL,NULL),
  ('0000.090.00','Team','Executive','Sustainability & ESG',NULL,NULL),
  ('0000.100.00','Team','Executive','Insurance & Permitting',NULL,NULL),
  ('1000.000.00','Department','Creative',NULL,'Interior Design',NULL),
  ('1000.010.00','Team','Creative','Creative Direction',NULL,NULL),
  ('1000.020.00','Team','Creative','Experience & Narrative Design',NULL,NULL),
  ('1000.030.00','Team','Creative','Interior Design',NULL,NULL),
  ('1000.040.00','Team','Creative','Environmental Design',NULL,NULL),
  ('1000.050.00','Team','Creative','Scenic Design',NULL,NULL),
  ('1000.060.00','Team','Creative','Art & Decor',NULL,NULL),
  ('1000.070.00','Team','Creative','Programming & Curation',NULL,NULL),
  ('1000.080.00','Team','Creative','Graphics & Print Design',NULL,NULL),
  ('1000.090.00','Team','Creative','Photography & Videography',NULL,NULL),
  ('1000.100.00','Team','Creative','Brand Identity & Toolkit',NULL,NULL),
  ('1000.110.00','Team','Creative','FF&E Specification',NULL,NULL),
  ('2000.000.00','Department','Talent',NULL,'Multi',NULL),
  ('2000.010.00','Team','Talent','Artists & Repertoire (A&R)',NULL,NULL),
  ('2000.020.00','Team','Talent','Talent Acquisition',NULL,NULL),
  ('2000.030.00','Team','Talent','Casting & Booking',NULL,NULL),
  ('2000.040.00','Team','Talent','Talent Management',NULL,NULL),
  ('2000.050.00','Team','Talent','Artist Production',NULL,NULL),
  ('2000.060.00','Team','Talent','Artist Hospitality',NULL,NULL),
  ('2000.070.00','Team','Talent','Artist Transportation',NULL,NULL),
  ('2000.080.00','Team','Talent','Riders & Clearances',NULL,NULL),
  ('3000.000.00','Department','Marketing',NULL,'Multi',NULL),
  ('3000.010.00','Team','Marketing','Marketing Strategy',NULL,NULL),
  ('3000.020.00','Team','Marketing','Brand Marketing',NULL,NULL),
  ('3000.030.00','Team','Marketing','Digital Marketing',NULL,NULL),
  ('3000.040.00','Team','Marketing','Social Media',NULL,NULL),
  ('3000.050.00','Team','Marketing','Public Relations',NULL,NULL),
  ('3000.060.00','Team','Marketing','Influencer & Ambassador Programs',NULL,NULL),
  ('3000.070.00','Team','Marketing','Broadcast & Media Production',NULL,NULL),
  ('3000.080.00','Team','Marketing','Content Production',NULL,NULL),
  ('3000.090.00','Team','Marketing','Sponsorship',NULL,NULL),
  ('3000.100.00','Team','Marketing','CRM & Guest Data',NULL,NULL),
  ('4000.000.00','Department','Build',NULL,'Construction / Fabrication',NULL),
  ('4000.010.00','Team','Build','Engineering & Drafting (CAD)',NULL,NULL),
  ('4000.020.00','Team','Build','Fabrication & Scenic Construction',NULL,NULL),
  ('4000.030.00','Team','Build','Millwork & Casework',NULL,NULL),
  ('4000.040.00','Team','Build','Metal Fabrication',NULL,NULL),
  ('4000.050.00','Team','Build','Specialty Fabrication',NULL,NULL),
  ('4000.060.00','Team','Build','General Construction',NULL,NULL),
  ('4000.070.00','Team','Build','Demolition & Site Prep',NULL,NULL),
  ('4000.080.00','Team','Build','Carpentry & Framing',NULL,NULL),
  ('4000.090.00','Team','Build','Surfaces & Finishes',NULL,NULL),
  ('4000.100.00','Team','Build','MEP (Mech/Elec/Plumb)',NULL,NULL),
  ('4000.110.00','Team','Build','Structural',NULL,NULL),
  ('4000.120.00','Team','Build','Soft Goods & Drape',NULL,NULL),
  ('4000.130.00','Team','Build','FF&E Fabrication & Install',NULL,NULL),
  ('4000.140.00','Team','Build','Signage Fabrication',NULL,NULL),
  ('4000.150.00','Team','Build','Install & Load-In',NULL,NULL),
  ('4000.160.00','Team','Build','Strike & De-Install',NULL,NULL),
  ('4000.170.00','Team','Build','Permits & Inspections (Build)',NULL,NULL),
  ('4000.180.00','Team','Build','Quality Control & Punch List',NULL,NULL),
  ('4000.190.00','Team','Build','Logistics & Crating (Build)',NULL,NULL),
  ('5000.000.00','Department','Production',NULL,'Live Entertainment',NULL),
  ('5000.010.00','Team','Production','Production Management',NULL,NULL),
  ('5000.020.00','Team','Production','Technical Direction',NULL,NULL),
  ('5000.030.00','Team','Production','Audio Production',NULL,NULL),
  ('5000.040.00','Team','Production','Lighting Production',NULL,NULL),
  ('5000.050.00','Team','Production','Video Production',NULL,NULL),
  ('5000.060.00','Team','Production','Projection & Visuals',NULL,NULL),
  ('5000.070.00','Team','Production','Lasers & Special FX',NULL,NULL),
  ('5000.080.00','Team','Production','Pyrotechnics',NULL,NULL),
  ('5000.090.00','Team','Production','Rigging',NULL,NULL),
  ('5000.100.00','Team','Production','Backline',NULL,NULL),
  ('5000.110.00','Team','Production','Staging & Decking',NULL,NULL),
  ('5000.120.00','Team','Production','Power & Electrical (Event)',NULL,NULL),
  ('5000.130.00','Team','Production','Site Systems',NULL,NULL),
  ('5000.140.00','Team','Production','Ground Protection & Site Lighting',NULL,NULL),
  ('5000.150.00','Team','Production','Production Rentals',NULL,NULL),
  ('5000.160.00','Team','Production','CAD & Technical Drafting (Show)',NULL,NULL),
  ('6000.000.00','Department','Operations',NULL,'Procurement',NULL),
  ('6000.010.00','Team','Operations','Operations Management',NULL,NULL),
  ('6000.020.00','Team','Operations','Site Operations',NULL,NULL),
  ('6000.030.00','Team','Operations','Venue Operations',NULL,NULL),
  ('6000.040.00','Team','Operations','Back of House Operations',NULL,NULL),
  ('6000.050.00','Team','Operations','Front of House Operations',NULL,NULL),
  ('6000.060.00','Team','Operations','Procurement & Supply Chain',NULL,NULL),
  ('6000.070.00','Team','Operations','Logistics & Distribution',NULL,NULL),
  ('6000.080.00','Team','Operations','Warehousing & Inventory',NULL,NULL),
  ('6000.090.00','Team','Operations','Quartermaster Services',NULL,NULL),
  ('6000.100.00','Team','Operations','Crew Services',NULL,NULL),
  ('6000.110.00','Team','Operations','Credentialing & Access Control',NULL,NULL),
  ('6000.120.00','Team','Operations','Security & Crowd Management',NULL,NULL),
  ('6000.130.00','Team','Operations','Medical & Emergency Services',NULL,NULL),
  ('6000.140.00','Team','Operations','Life Safety & Harm Reduction',NULL,NULL),
  ('6000.150.00','Team','Operations','Fire & Rescue',NULL,NULL),
  ('6000.160.00','Team','Operations','Police & Public Safety',NULL,NULL),
  ('6000.170.00','Team','Operations','Traffic & Transportation Mgmt',NULL,NULL),
  ('6000.180.00','Team','Operations','Shuttle & Parking Operations',NULL,NULL),
  ('6000.190.00','Team','Operations','Signage & Wayfinding',NULL,NULL),
  ('6000.200.00','Team','Operations','Ticketing & Box Office',NULL,NULL),
  ('6000.210.00','Team','Operations','Venue (Rent/Insurance/Licensing)',NULL,NULL),
  ('6000.220.00','Team','Operations','Database Management',NULL,NULL),
  ('7000.000.00','Department','Experience',NULL,'Experiential',NULL),
  ('7000.010.00','Team','Experience','Guest Experience',NULL,NULL),
  ('7000.020.00','Team','Experience','Guest Services',NULL,NULL),
  ('7000.030.00','Team','Experience','Accessibility Services',NULL,NULL),
  ('7000.040.00','Team','Experience','Recreation & Activities',NULL,NULL),
  ('7000.050.00','Team','Experience','Amusement & Attractions',NULL,NULL),
  ('7000.060.00','Team','Experience','Vendor Marketplace',NULL,NULL),
  ('7000.070.00','Team','Experience','Market & Vendor Services',NULL,NULL),
  ('7000.080.00','Team','Experience','Merchandising',NULL,NULL),
  ('7000.090.00','Team','Experience','Activations & Brand Experiences',NULL,NULL),
  ('7000.100.00','Team','Experience','Interactive & Immersive',NULL,NULL),
  ('7000.110.00','Team','Experience','VIP & Premium Experiences',NULL,NULL),
  ('8000.000.00','Department','Hospitality',NULL,'Multi',NULL),
  ('8000.010.00','Team','Hospitality','Hospitality Management',NULL,NULL),
  ('8000.020.00','Team','Hospitality','Concierge Services',NULL,NULL),
  ('8000.030.00','Team','Hospitality','Catering Services',NULL,NULL),
  ('8000.040.00','Team','Hospitality','Food & Beverage',NULL,NULL),
  ('8000.050.00','Team','Hospitality','Beverage Operations',NULL,NULL),
  ('8000.060.00','Team','Hospitality','Culinary Operations',NULL,NULL),
  ('8000.070.00','Team','Hospitality','VIP Operations',NULL,NULL),
  ('8000.080.00','Team','Hospitality','Guest & Industry Hospitality',NULL,NULL),
  ('8000.090.00','Team','Hospitality','Travel & Transportation',NULL,NULL),
  ('8000.100.00','Team','Hospitality','Accommodations & Lodging',NULL,NULL),
  ('9000.000.00','Department','Technology',NULL,'Multi',NULL),
  ('9000.010.00','Team','Technology','IT & Network Infrastructure',NULL,NULL),
  ('9000.020.00','Team','Technology','RF / Wireless / Comms',NULL,NULL),
  ('9000.030.00','Team','Technology','Access Control & Ticketing Tech',NULL,NULL),
  ('9000.040.00','Team','Technology','Studio & Podcast Technology',NULL,NULL),
  ('9000.050.00','Team','Technology','Data & Content Pipeline',NULL,NULL),
  ('9000.060.00','Team','Technology','AR / VR / XR & Innovation',NULL,NULL),
  ('9000.070.00','Team','Technology','Software & Platforms',NULL,NULL),
  ('9000.080.00','Team','Technology','Cybersecurity & Data Privacy',NULL,NULL),
  ('9000.090.00','Team','Technology','Power & UPS (IT)',NULL,NULL),
  ('9000.100.00','Team','Technology','Broadcast & Streaming Tech',NULL,NULL)
on conflict (urid) do nothing;
