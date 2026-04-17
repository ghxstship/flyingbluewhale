-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 024: Documents (Universal Attachment Store)
-- BOLs, PODs, packing slips, photos, receipts, contracts
-- ═══════════════════════════════════════════════════════

create table documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  type text not null check (type in ('bol','pod','packing_slip','invoice','photo','receipt','contract','manifest','inspection','other')),
  file_url text not null,
  file_name text not null,
  file_size_bytes bigint,
  mime_type text,
  thumbnail_url text,
  uploaded_by uuid not null references auth.users(id),
  notes text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_documents_org on documents(organization_id);
create index idx_documents_project on documents(project_id);
create index idx_documents_entity on documents(entity_type, entity_id);
create index idx_documents_type on documents(type);

-- RLS
alter table documents enable row level security;

create policy "View org documents" on documents for select
  using (
    exists(select 1 from organization_members om where om.organization_id = documents.organization_id and om.user_id = auth.uid())
    or (project_id is not null and is_project_member(project_id))
  );

create policy "Upload documents" on documents for insert
  with check (
    exists(select 1 from organization_members om where om.organization_id = documents.organization_id and om.user_id = auth.uid())
    or (project_id is not null and is_project_member(project_id))
  );

create policy "Manage documents" on documents for delete
  using (
    uploaded_by = auth.uid()
    or exists(select 1 from organization_members om where om.organization_id = documents.organization_id and om.user_id = auth.uid() and om.role in ('developer','owner','admin'))
  );
