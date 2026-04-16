-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 015: Credential Engine (Full)
-- Activates stubs from 005 with RLS, triggers, lifecycle
-- ═══════════════════════════════════════════════════════

alter table credential_badges
  add column if not exists badge_url text,
  add column if not exists issued_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists is_revoked boolean not null default false;

alter table credential_orders
  add column if not exists denied_at timestamptz,
  add column if not exists denied_by uuid references auth.users(id),
  add column if not exists issued_at timestamptz,
  add column if not exists issued_by uuid references auth.users(id),
  add column if not exists picked_up_at timestamptz,
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id),
  add column if not exists revocation_reason text;

-- Credential order status transitions
create or replace function validate_credential_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;
  valid := case old.status
    when 'requested' then new.status in ('approved', 'denied')
    when 'approved' then new.status in ('issued', 'denied', 'revoked')
    when 'denied' then new.status in ('requested')
    when 'issued' then new.status in ('picked_up', 'revoked')
    when 'picked_up' then new.status in ('revoked')
    when 'revoked' then false
    else false
  end;
  if not valid then raise exception 'Invalid credential order transition: % -> %', old.status, new.status; end if;
  case new.status
    when 'approved' then new.approved_at = coalesce(new.approved_at, now());
    when 'denied' then new.denied_at = coalesce(new.denied_at, now());
    when 'issued' then new.issued_at = coalesce(new.issued_at, now());
    when 'picked_up' then new.picked_up_at = coalesce(new.picked_up_at, now());
    when 'revoked' then new.revoked_at = coalesce(new.revoked_at, now());
    else null;
  end case;
  return new;
end;
$$ language plpgsql;

create trigger check_credential_transition
  before update of status on credential_orders
  for each row execute function validate_credential_transition();

-- Enforce quantity limits per credential type
create or replace function enforce_credential_quantity_limit()
returns trigger as $$
declare type_limit int; current_count int;
begin
  select quantity_limit into type_limit from credential_types where id = new.credential_type_id;
  if type_limit is not null then
    select coalesce(sum(quantity), 0) into current_count from credential_orders
    where credential_type_id = new.credential_type_id and project_id = new.project_id and status not in ('denied', 'revoked') and (new.id is null or id != new.id);
    if current_count + new.quantity > type_limit then
      raise exception 'Credential quantity limit exceeded: % + % > %', current_count, new.quantity, type_limit;
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_credential_quantity
  before insert or update on credential_orders
  for each row execute function enforce_credential_quantity_limit();

-- Audit trail
create or replace function audit_credential_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (new.project_id, 'credential_order', new.id, 'credential.' || new.status, coalesce(new.approved_by, new.issued_by, new.revoked_by, new.user_id), jsonb_build_object('status', old.status::text), jsonb_build_object('status', new.status::text, 'quantity', new.quantity));
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_credential_status
  after update on credential_orders
  for each row execute function audit_credential_change();

-- Cascade revoke badges
create or replace function revoke_badges_on_order_revoke()
returns trigger as $$
begin
  if new.status = 'revoked' and old.status != 'revoked' then
    update credential_badges set is_revoked = true where order_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger cascade_revoke_badges
  after update of status on credential_orders
  for each row execute function revoke_badges_on_order_revoke();

-- RLS for credential tables
alter table credential_types enable row level security;
alter table credential_zones enable row level security;
alter table credential_type_zones enable row level security;
alter table credential_orders enable row level security;
alter table credential_badge_templates enable row level security;
alter table credential_badges enable row level security;
alter table credential_check_ins enable row level security;

create policy "View credential types" on credential_types for select using (is_project_member(project_id));
create policy "Manage credential types" on credential_types for all using (is_internal_on_project(project_id));
create policy "View zones" on credential_zones for select using (is_project_member(project_id));
create policy "Manage zones" on credential_zones for all using (is_internal_on_project(project_id));
create policy "View zone matrix" on credential_type_zones for select using (exists(select 1 from credential_types ct where ct.id = credential_type_id and is_project_member(ct.project_id)));
create policy "Manage zone matrix" on credential_type_zones for all using (exists(select 1 from credential_types ct where ct.id = credential_type_id and is_internal_on_project(ct.project_id)));
create policy "View own credential orders" on credential_orders for select using (user_id = auth.uid() or is_internal_on_project(project_id));
create policy "Request credentials" on credential_orders for insert with check (is_project_member(project_id));
create policy "Manage credential orders" on credential_orders for update using (is_internal_on_project(project_id));
create policy "View badge templates" on credential_badge_templates for select using (is_project_member(project_id));
create policy "Manage badge templates" on credential_badge_templates for all using (is_internal_on_project(project_id));
create policy "View own badges" on credential_badges for select using (person_id = auth.uid() or exists(select 1 from credential_orders co where co.id = order_id and is_internal_on_project(co.project_id)));
create policy "Manage badges" on credential_badges for all using (exists(select 1 from credential_orders co where co.id = order_id and is_internal_on_project(co.project_id)));
create policy "View check-ins" on credential_check_ins for select using (exists(select 1 from credential_orders co where co.id = credential_order_id and is_project_member(co.project_id)));
create policy "Create check-ins" on credential_check_ins for insert with check (exists(select 1 from credential_orders co where co.id = credential_order_id and is_internal_on_project(co.project_id)));
