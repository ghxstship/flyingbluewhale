-- Real backing for the 8 COMPVSS Operations/Logistics field ledgers that
-- previously rendered the ops-seed consts VERBATIM (kit 33/34 roadmap). Each is
-- org-scoped, RLS-guarded (org members read, managers write), LDP *_state named.
-- Seeded for the demo + test-fixture orgs so the existing surfaces/e2e show rows.

create table if not exists public.field_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, report_kind text not null, severity text,
  filed_by text, area text, report_state text not null default 'Open', icon text,
  created_at timestamptz not null default now()
);
create table if not exists public.field_inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, category text, area text, done int not null default 0,
  checks int not null default 0, inspector text, inspection_state text not null default 'In Progress',
  icon text, created_at timestamptz not null default now()
);
create table if not exists public.field_shipments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, carrier text, dock text, window_label text,
  direction text not null default 'in', shipment_state text not null default 'Scheduled',
  created_at timestamptz not null default now()
);
create table if not exists public.field_travel (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, detail text, when_label text,
  travel_state text not null default 'Pending', icon text,
  created_at timestamptz not null default now()
);
create table if not exists public.field_permits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null, authority text, validity_label text,
  permit_state text not null default 'Active', icon text,
  created_at timestamptz not null default now()
);
create table if not exists public.field_dock_slots (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  dock text not null, slot_time text, duration_label text, label text,
  direction text not null default 'in', dock_state text not null default 'Scheduled',
  created_at timestamptz not null default now()
);
create table if not exists public.field_gate_queue (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  vehicle text not null, carrier text, driver text, dock text,
  credential_label text, gate_state text not null default 'Waiting', eta_label text,
  created_at timestamptz not null default now()
);
create table if not exists public.field_deliveries (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  ref text, title text not null, from_loc text, to_loc text, pieces int not null default 1,
  runner text, need_label text, delivery_state text not null default 'Requested', eta_label text,
  created_at timestamptz not null default now()
);

do $$
declare tbl text;
begin
  foreach tbl in array array['field_reports','field_inspections','field_shipments','field_travel',
                             'field_permits','field_dock_slots','field_gate_queue','field_deliveries'] loop
    execute format('create index if not exists idx_%1$s_org on public.%1$s(org_id)', tbl);
    execute format('alter table public.%1$s enable row level security', tbl);
    execute format('revoke all on public.%1$s from anon', tbl);
    execute format('grant select, insert, update, delete on public.%1$s to authenticated', tbl);
    execute format($p$create policy %1$s_read on public.%1$s for select to authenticated using (private.is_org_member(org_id))$p$, tbl);
    execute format($p$create policy %1$s_write on public.%1$s for all to authenticated using (private.has_org_role(org_id, array['owner','admin','manager','controller'])) with check (private.has_org_role(org_id, array['owner','admin','manager','controller']))$p$, tbl);
  end loop;
end $$;

do $$
declare o uuid;
begin
  foreach o in array array['68672cc3-0667-4234-ad77-49325e173175'::uuid,'f4509a5f-6bcd-4a75-a6e8-01bfcc4ce5a7'::uuid,
                           '0443cdf4-384c-44ea-8de7-25e5de77d2c8'::uuid,'e901f2c4-0c3c-496d-8d30-16e98f2eb809'::uuid,
                           '39c5b82a-29fa-47ff-a43c-fe9c116cd27e'::uuid] loop
    insert into public.field_reports (org_id,title,report_kind,severity,filed_by,area,report_state,icon) values
      (o,'Barricade Gap · FOS Line','Incident','High','Joshamee Gibbs','Stage L','Open','TriangleAlert'),
      (o,'Gate 3 Daily Ops Summary','Daily Report',null,'Joshamee Gibbs','Gate 3','Filed','ClipboardList'),
      (o,'Minor Slip · Dock B · No Injury','Incident','Low','Cotton','Dock B','Under Review','TriangleAlert'),
      (o,'Weather Hold Log · 13:00-16:00','Ops Log',null,'Ops Desk','Site-wide','Closed','Cloud');
    insert into public.field_inspections (org_id,title,category,area,done,checks,inspector,inspection_state,icon) values
      (o,'Site Safety Walk · AM','security','Gate 3',18,18,'Joshamee Gibbs','Passed','ClipboardCheck'),
      (o,'Barricade Load Check','foh','Stage L',9,12,'Scrum','In Progress','Construction'),
      (o,'Egress & Exit Sweep','fire','Fort Charles',20,20,'James Norrington','Passed','DoorOpen'),
      (o,'Rigging Pre-Flight','rigging','Stage L',11,15,'Will Turner','Flagged','Anchor');
    insert into public.field_shipments (org_id,title,carrier,dock,window_label,direction,shipment_state) values
      (o,'Headliner Backline · Inbound','Rock-It Cargo','Dock B','Today · 14:00','in','Arrived'),
      (o,'LED Wall · Inbound','Clair Global','Dock A','Today · 19:30','in','En Route'),
      (o,'Empty Cases · Outbound','Rock-It Cargo','Dock B','Tomorrow · 07:00','out','Scheduled'),
      (o,'Catering Resupply','Tortuga F&B','BOH','Today · 20:00','in','Delayed');
    insert into public.field_travel (org_id,title,detail,when_label,travel_state,icon) values
      (o,'Flight · MIA to SJU','AA 1442 · Seat 14C','Jun 22 · 08:10','Confirmed','Plane'),
      (o,'Hotel · Port Royal Inn','2 nights · King · #PR8842','Jun 22-24','Confirmed','BedDouble'),
      (o,'Ground · Airport Pickup','Crew shuttle · Bay 3','Jun 22 · 11:30','Pending','Car'),
      (o,'Per Diem · $65/day','3 days · loaded to pass','Jun 22-24','Loaded','Wallet');
    insert into public.field_permits (org_id,title,authority,validity_label,permit_state,icon) values
      (o,'Pyrotechnics · Restricted Zone','Fire Marshal','Exp Jun 24','Active','Flame'),
      (o,'Temporary Structure · Stage L','City Building Dept','Exp Jun 30','Active','Building2'),
      (o,'COI · Black Pearl Co.','Insurer','On file · exp Dec 31','Active','ShieldCheck'),
      (o,'Noise Variance · After 23:00','City','Pending renewal','Expiring','Volume2'),
      (o,'Rigging Cert · Will Turner','IATSE','Exp Jul 2 · renew soon','Expiring','BadgeCheck');
    insert into public.field_dock_slots (org_id,dock,slot_time,duration_label,label,direction,dock_state) values
      (o,'Dock B','14:00','90m','Headliner Backline','in','Arrived'),
      (o,'Dock B','16:30','30m','SFX Consumables','in','En Route'),
      (o,'Dock B','23:45','60m','Load-Out · Count Pallets','out','Scheduled'),
      (o,'Dock A','19:30','90m','LED Wall','in','En Route'),
      (o,'BOH','20:00','45m','Catering Resupply','in','Delayed');
    insert into public.field_gate_queue (org_id,vehicle,carrier,driver,dock,credential_label,gate_state,eta_label) values
      (o,'53'' Reefer · FL-88 4471','Rock-It Cargo','Bootstrap Bill','Dock B','COI on file · verified','At Dock','Arrived 13:52'),
      (o,'48'' Dry Van · GA-20 8830','Clair Global','Marty Brace','Dock A','COI on file · verified','Waiting','ETA 19:20'),
      (o,'Sprinter · FL-90 1188','Dutchman Freight','Cotton','Dock B','Day pass · verified','Cleared','On site 16:05'),
      (o,'Box Truck · FL-14 2201','Tortuga F&B','Scarlett','BOH','COI expired · flag','Held','Delayed');
    insert into public.field_deliveries (org_id,ref,title,from_loc,to_loc,pieces,runner,need_label,delivery_state,eta_label) values
      (o,'MOV-318','Amp Racks to Stage L','Dock B','Stage L · SR Wing',4,'Cotton','Forklift','In Transit','~5 min'),
      (o,'MOV-317','Comms Kits to VIP','Comms Cage · Dock B','VIP · Crow''s Nest',6,'Anamaria','Cart','Delivered','Confirmed 15:20'),
      (o,'MOV-319','Catering Resupply to BOH Kitchen','BOH','Catering Tent',9,'Marty','Pallet jack','Staged','Awaiting dock'),
      (o,'MOV-316','LED Panels to Stage L Deck','Dock A','Stage L · Deck',24,'Ragetti','4 pax + carts','Requested','On truck arrival');
  end loop;
end $$;
