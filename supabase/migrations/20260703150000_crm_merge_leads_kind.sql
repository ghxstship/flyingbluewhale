-- kit v7.8/v20 §09 C-11 · one pursuit pipeline (ADR-0014 Phase A amendment):
-- `leads` folds into `opportunities` behind a `kind` facet (deal · lead · rfp).
-- /studio/leads and /studio/pipeline become filtered lenses over the one store.
--
-- LDP: `kind` is a facet (not a lifecycle); the lead qualification arc keeps
-- its sequential machine as `lead_phase` (reusing the existing `lead_stage`
-- enum type). No bare `status` columns are introduced.

create type public.crm_record_kind as enum ('deal', 'lead', 'rfp');

alter table public.opportunities
  add column kind public.crm_record_kind not null default 'deal',
  add column lead_phase public.lead_stage,
  add column contact_email text,
  add column contact_phone text,
  add column notes text,
  add column assigned_to uuid references public.users(id) on delete set null,
  add column created_by uuid references public.users(id) on delete set null;

comment on column public.opportunities.kind is
  'CRM pursuit facet: deal (pipeline-staged) · lead (lead_phase arc) · rfp (inbound pursuit)';
comment on column public.opportunities.lead_phase is
  'Lead qualification arc (new -> contacted/qualified -> proposal -> won/lost). Required for kind=lead; retained as provenance after conversion.';

-- Leads and RFPs do not ride a named pipeline until converted to a deal.
alter table public.opportunities alter column pipeline_id drop not null;
alter table public.opportunities alter column current_stage_id drop not null;

alter table public.opportunities
  add constraint opportunities_deal_pipeline_check
    check (kind <> 'deal' or (pipeline_id is not null and current_stage_id is not null)),
  add constraint opportunities_lead_phase_check
    check (kind <> 'lead' or lead_phase is not null);

-- Row migration — id-preserving so /studio/leads/[leadId] deep links survive.
insert into public.opportunities
  (id, org_id, kind, title, lead_phase, estimated_value_minor, estimated_value_currency,
   source, contact_email, contact_phone, notes, assigned_to, created_by, created_at, updated_at)
select id, org_id, 'lead', name, stage, estimated_value_cents, estimated_value_currency,
       source, email, phone, notes, assigned_to, created_by, created_at, updated_at
from public.leads;

drop table public.leads;

create index idx_opportunities_org_kind on public.opportunities (org_id, kind);
create index idx_opportunities_assigned_to on public.opportunities (assigned_to);
create index idx_opportunities_created_by on public.opportunities (created_by);

-- RLS parity: the merged store carries the role-banded policy set `leads` had
-- (the prior single ALL policy let any org member write deals).
drop policy if exists urm_opp_org on public.opportunities;
create policy opportunities_select on public.opportunities
  for select using (private.is_org_member(org_id));
create policy opportunities_insert on public.opportunities
  for insert with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy opportunities_update on public.opportunities
  for update using (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']))
  with check (private.has_org_role(org_id, array['owner','admin','manager','controller','collaborator']));
create policy opportunities_delete on public.opportunities
  for delete using (private.has_org_role(org_id, array['owner','admin']));
