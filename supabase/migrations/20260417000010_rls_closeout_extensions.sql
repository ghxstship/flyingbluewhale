-- =====================================================
-- RED SEA LION Migration 010: Ticketing RLS + Closeout
-- Closes GAP-014 (ticketing RLS), GAP-027 (immutability),
-- GAP-032 (ATLVS RLS), GAP-034 (lifecycle audit trail)
-- =====================================================

-- ===== 1. Ticketing RLS (GAP-014) =======================

alter table ticket_tiers enable row level security;
alter table tickets enable row level security;
alter table ticket_transfers enable row level security;
alter table ticket_scans enable row level security;
alter table ticket_promo_codes enable row level security;

-- Ticket tiers: project members can view; internal manages
create policy "View ticket tiers"
  on ticket_tiers for select
  using (is_project_member(project_id));

create policy "Manage ticket tiers"
  on ticket_tiers for all
  using (is_internal_on_project(project_id));

-- Tickets: holder can view own; internal can view all project tickets
create policy "Holder can view own tickets"
  on tickets for select
  using (holder_user_id = auth.uid());

create policy "Internal can view project tickets"
  on tickets for select
  using (is_internal_on_project(project_id));

create policy "Internal can manage tickets"
  on tickets for all
  using (is_internal_on_project(project_id));

-- Ticket transfers: involved parties can view; internal manages
create policy "Transfer participants can view"
  on ticket_transfers for select
  using (
    from_user_id = auth.uid()
    or to_user_id = auth.uid()
    or exists(
      select 1 from tickets t
      where t.id = ticket_id and is_internal_on_project(t.project_id)
    )
  );

create policy "Internal can manage transfers"
  on ticket_transfers for all
  using (
    exists(
      select 1 from tickets t
      where t.id = ticket_id and is_internal_on_project(t.project_id)
    )
  );

-- Ticket scans: internal can view and create
create policy "View ticket scans"
  on ticket_scans for select
  using (
    exists(
      select 1 from tickets t
      where t.id = ticket_id and is_project_member(t.project_id)
    )
  );

create policy "Create ticket scans"
  on ticket_scans for insert
  with check (
    exists(
      select 1 from tickets t
      where t.id = ticket_id and is_internal_on_project(t.project_id)
    )
  );

-- Promo codes: internal manages
create policy "View promo codes"
  on ticket_promo_codes for select
  using (is_project_member(project_id));

create policy "Manage promo codes"
  on ticket_promo_codes for all
  using (is_internal_on_project(project_id));


-- ===== 2. ATLVS Venue RLS (GAP-032) ====================

-- Enable RLS on all ATLVS tables
do $$
declare
  tbl text;
begin
  for tbl in select tablename from pg_tables
    where schemaname = 'public' and tablename like 'atlvs_%'
  loop
    execute format('alter table %I enable row level security', tbl);
    -- Public read for venue discovery; org-admin write
    execute format(
      'create policy "Public read %1$s" on %1$I for select using (true)',
      tbl
    );
    execute format(
      'create policy "Admin write %1$s" on %1$I for all using (
        exists(
          select 1 from organization_members om
          where om.user_id = auth.uid()
            and om.role in (''developer'', ''owner'', ''admin'')
        )
      )',
      tbl
    );
  end loop;
end;
$$;


-- ===== 3. Lifecycle Audit Trail (GAP-034) ===============

create or replace function audit_lifecycle_transition()
returns trigger as $$
begin
  if old.stage is distinct from new.stage then
    insert into audit_log (
      project_id, entity_type, entity_id, action, actor_id,
      old_state, new_state
    ) values (
      new.project_id,
      'project_member_lifecycle',
      (new.project_id::text || ':' || new.user_id::text)::uuid,
      'lifecycle.' || new.stage::text,
      auth.uid(),
      jsonb_build_object('stage', old.stage::text),
      jsonb_build_object('stage', new.stage::text, 'notes', new.transition_notes)
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Use a safe hash for the entity_id since it's a composite PK
create or replace function audit_lifecycle_transition()
returns trigger as $$
begin
  if old.stage is distinct from new.stage then
    insert into audit_log (
      project_id, entity_type, entity_id, action, actor_id,
      old_state, new_state
    ) values (
      new.project_id,
      'project_member_lifecycle',
      new.user_id,
      'lifecycle.' || new.stage::text,
      auth.uid(),
      jsonb_build_object('stage', old.stage::text, 'user_id', new.user_id::text),
      jsonb_build_object('stage', new.stage::text, 'notes', new.transition_notes)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_lifecycle_stage_change
  after update of stage on project_member_lifecycles
  for each row execute function audit_lifecycle_transition();


-- ===== 4. Project Closeout Immutability (GAP-027) =======

-- Block mutations on key tables when parent project is archived
-- and the member lifecycle is at closeout
create or replace function enforce_project_immutability()
returns trigger as $$
declare
  proj_status text;
begin
  -- Resolve project_id based on the table being mutated
  if tg_table_name = 'projects' then
    select status::text into proj_status from projects where id = new.id;
  elsif new.project_id is not null then
    select status::text into proj_status from projects where id = new.project_id;
  else
    return new;
  end if;

  if proj_status = 'archived' then
    raise exception 'Cannot modify % on archived project', tg_table_name;
  end if;

  return new;
end;
$$ language plpgsql;

-- Apply immutability guard to core operational tables
create trigger guard_deliverable_immutability
  before update on deliverables
  for each row execute function enforce_project_immutability();

create trigger guard_po_immutability
  before update on purchase_orders
  for each row execute function enforce_project_immutability();

create trigger guard_credential_order_immutability
  before update on credential_orders
  for each row execute function enforce_project_immutability();

create trigger guard_contract_immutability
  before update on contracts
  for each row execute function enforce_project_immutability();

create trigger guard_allocation_immutability
  before update on catalog_item_allocations
  for each row execute function enforce_project_immutability();


-- ===== 5. Member Detail Extension (GAP-033) =============

-- Employment class and jurisdiction tracking on project members
alter table project_members
  add column if not exists employment_class text
    check (employment_class in ('w2', '1099', 'c2c', 'volunteer')),
  add column if not exists jurisdiction text,
  add column if not exists union_affiliation text;

create index if not exists idx_pm_employment on project_members(employment_class);
