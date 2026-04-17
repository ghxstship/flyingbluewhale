-- =====================================================
-- RED SEA LION Migration 008: Contracts Engine
-- Closes GAP-007, GAP-008
-- Deal memos, vendor agreements, performance contracts.
-- =====================================================

create type contract_type as enum (
  'deal_memo',
  'vendor_agreement',
  'performance_contract',
  'employment_agreement',
  'nda',
  'sponsorship_agreement',
  'media_release',
  'venue_license',
  'custom'
);

create type contract_status as enum (
  'draft',
  'pending_review',
  'sent',
  'countersigned',
  'executed',
  'amendment',
  'terminated',
  'expired'
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  type contract_type not null,
  status contract_status not null default 'draft',
  title text not null,

  -- Counterparty (exactly one of user_id or vendor_id should be set)
  user_id uuid references auth.users(id) on delete set null,
  vendor_id uuid references vendors(id) on delete set null,

  -- Financial terms
  rate_amount numeric(12,2),
  rate_unit text check (rate_unit in ('flat', 'hourly', 'daily', 'weekly', 'per_show', 'per_diem')),
  currency text not null default 'USD',
  total_value numeric(12,2),
  payment_terms text,

  -- Document bindings
  document_id uuid references documents(id) on delete set null,
  template_id uuid references submission_templates(id) on delete set null,

  -- Lifecycle timestamps
  sent_at timestamptz,
  signed_at timestamptz,
  signed_by uuid references auth.users(id),
  countersigned_at timestamptz,
  countersigned_by uuid references auth.users(id),
  executed_at timestamptz,
  terminated_at timestamptz,
  terminated_by uuid references auth.users(id),
  termination_reason text,
  expires_at timestamptz,

  notes text,
  metadata jsonb not null default '{}',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_contracts_project on contracts(project_id);
create index idx_contracts_org on contracts(organization_id);
create index idx_contracts_user on contracts(user_id);
create index idx_contracts_vendor on contracts(vendor_id);
create index idx_contracts_status on contracts(status);
create index idx_contracts_type on contracts(type);

alter table contracts enable row level security;

create policy "Counterparty can view own contracts"
  on contracts for select
  using (user_id = auth.uid());

create policy "Project members can view contracts"
  on contracts for select
  using (is_project_member(project_id));

create policy "Internal can manage contracts"
  on contracts for all
  using (is_internal_on_project(project_id));

-- Contract status transition validation
create or replace function validate_contract_transition()
returns trigger as $$
declare valid boolean;
begin
  if old.status = new.status then return new; end if;

  valid := case old.status
    when 'draft' then new.status in ('pending_review', 'terminated')
    when 'pending_review' then new.status in ('sent', 'draft', 'terminated')
    when 'sent' then new.status in ('countersigned', 'terminated', 'pending_review')
    when 'countersigned' then new.status in ('executed', 'terminated')
    when 'executed' then new.status in ('amendment', 'terminated', 'expired')
    when 'amendment' then new.status in ('executed', 'terminated')
    when 'terminated' then false
    when 'expired' then new.status in ('draft')
    else false
  end;

  if not valid then
    raise exception 'Invalid contract transition: % -> %', old.status, new.status;
  end if;

  case new.status
    when 'sent' then new.sent_at = coalesce(new.sent_at, now());
    when 'countersigned' then new.countersigned_at = coalesce(new.countersigned_at, now());
    when 'executed' then new.executed_at = coalesce(new.executed_at, now());
    when 'terminated' then new.terminated_at = coalesce(new.terminated_at, now());
    else null;
  end case;

  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger check_contract_transition
  before update of status on contracts
  for each row execute function validate_contract_transition();

-- Audit trail
create or replace function audit_contract_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_log (project_id, organization_id, entity_type, entity_id, action, actor_id, old_state, new_state)
    values (
      new.project_id, new.organization_id, 'contract', new.id,
      'contract.' || new.status::text,
      coalesce(new.signed_by, new.countersigned_by, new.created_by),
      jsonb_build_object('status', old.status::text),
      jsonb_build_object('status', new.status::text, 'type', new.type::text, 'title', new.title)
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger audit_contract_status
  after update on contracts
  for each row execute function audit_contract_change();

create trigger contracts_updated_at
  before update on contracts
  for each row execute function update_updated_at();

-- Extend approval_actions to accept contracts
alter table approval_actions drop constraint if exists approval_actions_entity_type_check;
alter table approval_actions add constraint approval_actions_entity_type_check
  check (entity_type in (
    'deliverable', 'credential_order', 'allocation', 'fulfillment_order',
    'purchase_order', 'logistics_schedule', 'lost_found',
    'event', 'zone', 'activation', 'component', 'component_item', 'hierarchy_task',
    'ticket', 'ticket_refund',
    'contract', 'qualification_check'
  ));
