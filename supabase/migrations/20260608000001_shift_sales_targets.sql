-- Shift-level projected sales targets for labor-cost-vs-revenue display
-- in the ATLVS scheduling view (Connecteam Mar 2026 parity: "Projected Sales
-- and Labor%" — shows staffing cost as a percentage of expected revenue).

create table if not exists public.shift_sales_targets (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.orgs(id) on delete cascade,
  shift_date    date not null,
  schedule_name text,                        -- optional label (e.g. "Main Stage", "Bar")
  projected_revenue_cents bigint not null check (projected_revenue_cents >= 0),
  currency      text not null default 'USD',
  notes         text,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (org_id, shift_date, schedule_name)
);

alter table public.shift_sales_targets enable row level security;

create policy "org members read shift_sales_targets"
  on public.shift_sales_targets for select
  using (private.is_org_member(org_id));

create policy "manager plus write shift_sales_targets"
  on public.shift_sales_targets for all
  using (private.has_org_role(org_id, array['owner','admin','manager']::text[]))
  with check (private.has_org_role(org_id, array['owner','admin','manager']::text[]));

create trigger shift_sales_targets_updated_at
  before update on public.shift_sales_targets
  for each row execute function public.touch_updated_at();

-- v_daily_labor_vs_sales — aggregate labor cost (duration_minutes * rate_cents / 60)
-- against projected revenue for each date. rate_cents on time_entries is the
-- per-hour rate in cents; cost = (duration_minutes / 60) * rate_cents.
create or replace view public.v_daily_labor_vs_sales as
select
  sst.org_id,
  sst.shift_date,
  sst.schedule_name,
  sst.projected_revenue_cents,
  sst.currency,
  coalesce(
    (
      select sum((coalesce(te.duration_minutes, 0)::numeric / 60) * coalesce(te.rate_cents, 0))
      from   public.time_entries te
      where  te.org_id = sst.org_id
        and  te.started_at::date = sst.shift_date
    ), 0
  )::bigint as labor_cost_cents,
  case
    when sst.projected_revenue_cents > 0 then
      round(
        coalesce(
          (
            select sum((coalesce(te.duration_minutes, 0)::numeric / 60) * coalesce(te.rate_cents, 0))
            from   public.time_entries te
            where  te.org_id = sst.org_id
              and  te.started_at::date = sst.shift_date
          ), 0
        ) / sst.projected_revenue_cents * 100,
        1
      )
    else null
  end as labor_pct
from public.shift_sales_targets sst;

comment on view public.v_daily_labor_vs_sales is
  'Daily labor cost as a percentage of projected revenue — drives the ATLVS schedule Labor% widget.';
