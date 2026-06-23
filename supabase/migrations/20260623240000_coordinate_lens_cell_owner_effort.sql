-- §9 Coordinate Lens (IMPLEMENTATION.md §9.2) — additive cell-owner + effort.
-- A deliverable's RACI-Accountable cell owner for its (class × phase) cell, and
-- a task's effort estimate (hours or points) feeding the cell capacity rollup.
-- Both nullable/additive; no lifecycle column, so LDP *_state naming N/A.

alter table public.tasks
  add column if not exists effort integer check (effort is null or effort >= 0);

alter table public.deliverables
  add column if not exists cell_owner_id uuid references auth.users(id) on delete set null;

create index if not exists idx_deliverables_cell_owner
  on public.deliverables (cell_owner_id) where cell_owner_id is not null;
