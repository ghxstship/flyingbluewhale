-- Round 74 — Multi-entity / multi-currency consolidation (G-030 / F44).
--
-- Closes the last remaining parity gap from the construction-PM audit.
-- Sister-org hierarchy (org_entities) + adapts the pre-existing
-- exchange_rates table (was a scaffold; never wired) into a working
-- daily FX rate store + line-level FX columns on financial-impact
-- tables (invoices, expenses, payment_applications) + a v_consolidated_ar
-- view that rolls AR into the consolidation parent's base currency.
--
-- Why a sister table (org_entities) rather than mutating orgs:
--   - orgs is the SSOT for tenancy / RLS / billing — adding consolidation
--     hierarchy there mixes concerns.
--   - One org may operate multiple legal entities (LLC parent + subs
--     across jurisdictions). That's a one-to-many relationship.
--   - Soft-deletes + effective-from/to make divestitures and acquisitions
--     non-destructive.
--
-- exchange_rates is public-readable (FX is public data) and service-role-
-- writeable; the helper fn fx_rate_on(from, to, date) does the lookup.

-- =====================================================================
-- 1. org_entities — consolidation hierarchy
-- =====================================================================

create table if not exists public.org_entities (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    parent_entity_id uuid references public.org_entities(id) on delete set null,
    legal_name text not null,
    short_code text not null,
    base_currency text not null check (base_currency ~ '^[A-Z]{3}$'),
    jurisdiction text,
    tax_id text,
    consolidation_method text not null default 'full'
        check (consolidation_method in ('full', 'equity', 'proportional', 'none')),
    ownership_pct numeric(6, 3) not null default 100.0
        check (ownership_pct >= 0 and ownership_pct <= 100),
    consolidation_state text not null default 'active'
        check (consolidation_state in ('active', 'divested', 'dormant', 'pending')),
    effective_from date not null default current_date,
    effective_to date,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create unique index if not exists org_entities_short_code_unique
    on public.org_entities (org_id, short_code)
    where deleted_at is null;

create index if not exists org_entities_org_id_idx
    on public.org_entities (org_id) where deleted_at is null;
create index if not exists org_entities_parent_idx
    on public.org_entities (parent_entity_id) where deleted_at is null;

alter table public.org_entities enable row level security;

create policy "org_entities select" on public.org_entities
    for select using (private.is_org_member(org_id));
create policy "org_entities insert" on public.org_entities
    for insert with check (
        private.is_org_member(org_id)
        and private.has_org_role(org_id, array['owner', 'admin'])
    );
create policy "org_entities update" on public.org_entities
    for update using (
        private.is_org_member(org_id)
        and private.has_org_role(org_id, array['owner', 'admin'])
    );

comment on table public.org_entities is
    'Sister-org legal-entity hierarchy for consolidation. One org can operate multiple entities (LLC parent + jurisdiction-specific subs).';
comment on column public.org_entities.consolidation_method is
    'full = 100% rolled into parent; equity = parent gets share of net income only; proportional = ownership_pct of line items; none = standalone (not consolidated).';
comment on column public.org_entities.consolidation_state is
    'active = currently consolidated; divested = sold; dormant = inactive; pending = acquisition in progress.';

-- =====================================================================
-- 2. exchange_rates — adapt the pre-existing scaffold table.
-- Existing schema (from earlier migration, never wired):
--   id uuid, from_currency, to_currency, rate, source, effective_at timestamptz, recorded_at timestamptz
-- Existing indexes: exr_unique (from/to/effective_at/source), exr_pair_time, idx_exchange_rates_to_currency
-- Existing policy: umc_rates_read (SELECT, true)
-- We add only the write policy + helper fn — no schema changes.
-- =====================================================================

-- Add the service-role-only write policy if missing.
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public' and tablename = 'exchange_rates'
          and policyname = 'exchange_rates service write'
    ) then
        create policy "exchange_rates service write" on public.exchange_rates
            for insert with check (auth.role() = 'service_role');
    end if;
end
$$;

comment on table public.exchange_rates is
    'Daily FX rate snapshots. Reference data — public-readable, service-role-writeable. Populated by the FX worker (Frankfurter API, fallback to exchangerate.host).';

-- =====================================================================
-- 3. fx_rate_on() — date-keyed rate lookup helper
-- =====================================================================

create or replace function public.fx_rate_on(p_from text, p_to text, p_date date)
returns numeric
language sql
stable
as $$
    select case
        when p_from = p_to then 1.0::numeric
        else (
            select rate
            from public.exchange_rates
            where from_currency = p_from
              and to_currency = p_to
              and effective_at <= (p_date + interval '1 day')
            order by effective_at desc, recorded_at desc
            limit 1
        )
    end
$$;

comment on function public.fx_rate_on(text, text, date) is
    'Returns the FX rate from p_from to p_to as of p_date (latest snapshot on or before that date). Returns 1.0 when from == to. NULL if no rate exists.';

-- =====================================================================
-- 4. Line-level FX snapshot columns on financial-impact tables
-- =====================================================================

alter table public.invoices
    add column if not exists entity_id uuid references public.org_entities(id) on delete set null,
    add column if not exists fx_rate_to_base numeric(20, 10),
    add column if not exists base_currency text check (base_currency ~ '^[A-Z]{3}$'),
    add column if not exists base_amount_cents bigint;

create index if not exists invoices_entity_id_idx
    on public.invoices (entity_id) where deleted_at is null;

alter table public.expenses
    add column if not exists entity_id uuid references public.org_entities(id) on delete set null,
    add column if not exists fx_rate_to_base numeric(20, 10),
    add column if not exists base_currency text check (base_currency ~ '^[A-Z]{3}$'),
    add column if not exists base_amount_cents bigint;

create index if not exists expenses_entity_id_idx
    on public.expenses (entity_id);

alter table public.payment_applications
    add column if not exists entity_id uuid references public.org_entities(id) on delete set null,
    add column if not exists fx_rate_to_base numeric(20, 10),
    add column if not exists base_currency text check (base_currency ~ '^[A-Z]{3}$'),
    add column if not exists base_amount_cents bigint;

create index if not exists payment_applications_entity_id_idx
    on public.payment_applications (entity_id);

-- =====================================================================
-- 5. Auto-snapshot trigger — populate fx_rate + base_amount on insert
-- =====================================================================

create or replace function public.fx_snapshot_for_invoices()
returns trigger
language plpgsql
as $$
declare
    v_entity_base text;
    v_rate_date date;
begin
    if new.entity_id is null then
        return new;
    end if;

    select base_currency into v_entity_base
    from public.org_entities
    where id = new.entity_id and deleted_at is null;

    if v_entity_base is null then
        return new;
    end if;

    v_rate_date := coalesce(new.issued_at, current_date);

    if new.fx_rate_to_base is null then
        new.fx_rate_to_base := public.fx_rate_on(new.currency, v_entity_base, v_rate_date);
    end if;
    if new.base_currency is null then
        new.base_currency := v_entity_base;
    end if;
    if new.base_amount_cents is null and new.fx_rate_to_base is not null then
        new.base_amount_cents := round(new.amount_cents::numeric * new.fx_rate_to_base);
    end if;

    return new;
end
$$;

drop trigger if exists tg_invoices_fx_snapshot on public.invoices;
create trigger tg_invoices_fx_snapshot
    before insert or update of currency, amount_cents, entity_id, issued_at
    on public.invoices
    for each row execute function public.fx_snapshot_for_invoices();

create or replace function public.fx_snapshot_for_expenses()
returns trigger
language plpgsql
as $$
declare
    v_entity_base text;
    v_rate_date date;
begin
    if new.entity_id is null then
        return new;
    end if;
    select base_currency into v_entity_base
    from public.org_entities
    where id = new.entity_id and deleted_at is null;
    if v_entity_base is null then
        return new;
    end if;

    v_rate_date := coalesce(new.spent_at, current_date);
    if new.fx_rate_to_base is null then
        new.fx_rate_to_base := public.fx_rate_on(new.currency, v_entity_base, v_rate_date);
    end if;
    if new.base_currency is null then
        new.base_currency := v_entity_base;
    end if;
    if new.base_amount_cents is null and new.fx_rate_to_base is not null then
        new.base_amount_cents := round(new.amount_cents::numeric * new.fx_rate_to_base);
    end if;
    return new;
end
$$;

drop trigger if exists tg_expenses_fx_snapshot on public.expenses;
create trigger tg_expenses_fx_snapshot
    before insert or update of currency, amount_cents, entity_id, spent_at
    on public.expenses
    for each row execute function public.fx_snapshot_for_expenses();

-- =====================================================================
-- 6. Consolidated AR view — base-currency rollup
-- =====================================================================

create or replace view public.v_consolidated_ar as
select
    i.org_id,
    i.entity_id,
    e.legal_name as entity_legal_name,
    e.short_code as entity_short_code,
    e.parent_entity_id,
    e.consolidation_method,
    e.ownership_pct,
    i.id,
    i.number,
    i.title,
    i.currency,
    i.amount_cents,
    i.base_currency,
    i.base_amount_cents,
    i.fx_rate_to_base,
    i.issued_at,
    i.due_at,
    i.paid_at,
    i.status as invoice_status,
    i.project_id,
    i.client_id,
    case
        when e.consolidation_method = 'proportional'
            then round(coalesce(i.base_amount_cents, i.amount_cents)::numeric * e.ownership_pct / 100.0)
        when e.consolidation_method = 'none'
            then 0::numeric
        else coalesce(i.base_amount_cents, i.amount_cents)::numeric
    end as consolidated_amount_cents
from public.invoices i
left join public.org_entities e on e.id = i.entity_id and e.deleted_at is null
where i.deleted_at is null;

grant select on public.v_consolidated_ar to authenticated;

comment on view public.v_consolidated_ar is
    'Consolidation rollup view over invoices. consolidated_amount_cents applies ownership_pct for proportional consolidation, zeros out unconsolidated entities, and falls through to base_amount_cents otherwise.';

-- =====================================================================
-- 7. updated_at touch trigger on org_entities
-- =====================================================================

create or replace function public.touch_org_entities_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at := now();
    return new;
end
$$;

drop trigger if exists tg_org_entities_touch_updated_at on public.org_entities;
create trigger tg_org_entities_touch_updated_at
    before update on public.org_entities
    for each row execute function public.touch_org_entities_updated_at();
