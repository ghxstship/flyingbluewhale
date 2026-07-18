-- Kit 31 · COMPVSS Field conformance, resolution #14 — construction-grade tasks.
-- Facet columns only (no lifecycle): trade, cost code, company/sub, location,
-- PPE list, permit flag, % complete, checklist. All nullable / defaulted so
-- existing console surfaces tolerate them untouched.

alter table public.tasks
  add column if not exists trade text,
  add column if not exists cost_center_id uuid references public.cost_centers(id) on delete set null,
  add column if not exists vendor_id uuid references public.vendors(id) on delete set null,
  add column if not exists location text,
  add column if not exists ppe text[] not null default '{}',
  add column if not exists permit_required boolean not null default false,
  add column if not exists percent_complete integer check (percent_complete between 0 and 100),
  add column if not exists checklist jsonb not null default '[]'::jsonb;

comment on column public.tasks.trade is 'Kit 31 #14 — trade / discipline facet (Gate & Access, Rigging, …).';
comment on column public.tasks.cost_center_id is 'Kit 31 #14 — budget cost code (cost_centers).';
comment on column public.tasks.vendor_id is 'Kit 31 #14 — company / subcontractor executing the task.';
comment on column public.tasks.ppe is 'Kit 31 #14 — required PPE items.';
comment on column public.tasks.checklist is 'Kit 31 #14 — [{"label": text, "done": bool}] sub-items.';

-- FK indexes (FK-gap audit discipline: every new FK ships its index).
create index if not exists tasks_cost_center_id_idx on public.tasks(cost_center_id);
create index if not exists tasks_vendor_id_idx on public.tasks(vendor_id);
