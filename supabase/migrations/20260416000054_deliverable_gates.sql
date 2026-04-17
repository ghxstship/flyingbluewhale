-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 054: Deliverable ↔ APS Task Bridge
-- Links deliverable submissions directly to APS gate tasks.
-- ═══════════════════════════════════════════════════════

alter table deliverables
  add column if not exists hierarchy_task_id uuid references hierarchy_tasks(id) on delete set null;

create index if not exists idx_deliverables_task on deliverables(hierarchy_task_id);

create or replace function complete_task_on_deliverable_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status != 'approved' and new.hierarchy_task_id is not null then
    update hierarchy_tasks
    set status = 'completed',
        completed_at = now(),
        completed_by = new.reviewed_by
    where id = new.hierarchy_task_id and status != 'completed';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_complete_task_on_deliverable_approval
  after update of status on deliverables
  for each row execute function complete_task_on_deliverable_approval();
