-- Round 77 — Partner integration marketplace + certification program (G-032).
--
-- Third-party partners submit proposals for integrations they want to
-- build against the ATLVS API surface (REST at /api/v1/* + GraphQL at
-- /api/v1/graphql, both shipped by Round 76). Each submission goes
-- through a certification tier:
--
--   submitted   → just landed in the queue
--   reviewing   → AM is engaging with the partner
--   verified    → tech review passed, listed publicly under "Verified"
--   certified   → end-to-end QA passed, listed under "Certified" tier
--   rejected    → partner-program criteria not met (reason logged)
--
-- The first three tiers map to the standard Procore Connect / Autodesk
-- ACC partner programs. "Certified" is the top tier — same as Procore
-- Embedded.

create table if not exists public.partner_integrations (
    id uuid primary key default gen_random_uuid(),
    slug text not null,
    name text not null,
    partner_org_name text not null,
    partner_contact_email text not null check (partner_contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    partner_contact_name text,
    short_description text not null,
    long_description text,
    category text not null check (
        category in (
            'payments', 'ai', 'infra', 'comms', 'auth', 'observability',
            'geo', 'calendar', 'accounting', 'field', 'design', 'other'
        )
    ),
    capabilities text[] not null default '{}',
    homepage_url text,
    docs_url text,
    logo_url text,
    certification_tier text not null default 'submitted'
        check (certification_tier in ('submitted', 'reviewing', 'verified', 'certified', 'rejected')),
    rejection_reason text,
    submitted_by uuid,
    reviewed_by uuid,
    reviewed_at timestamptz,
    published_at timestamptz,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create unique index if not exists partner_integrations_slug_unique
    on public.partner_integrations (slug) where deleted_at is null;
create index if not exists partner_integrations_tier_idx
    on public.partner_integrations (certification_tier) where deleted_at is null;
create index if not exists partner_integrations_published_idx
    on public.partner_integrations (published_at desc) where published_at is not null and deleted_at is null;

alter table public.partner_integrations enable row level security;

-- Public read: only published verified/certified entries are visible to
-- anonymous + authenticated callers. Submitted/reviewing/rejected stay
-- internal.
create policy "partner_integrations public select" on public.partner_integrations
    for select using (
        certification_tier in ('verified', 'certified')
        and published_at is not null
        and deleted_at is null
    );

-- Authenticated insert: anyone with a session can submit a proposal.
-- (Real partner-program gating happens in the admin review queue, not at
-- the insert boundary — we want low-friction submission.)
create policy "partner_integrations insert" on public.partner_integrations
    for insert with check (auth.role() = 'authenticated');

-- Service-role-only update — keeps the certification flow behind the
-- admin queue. The /console/settings/integrations/submissions admin
-- surface uses createServiceClient() for tier transitions.
create policy "partner_integrations service update" on public.partner_integrations
    for update using (auth.role() = 'service_role');

comment on table public.partner_integrations is
    'Third-party integration submissions for the ATLVS marketplace. Public reads gated on certification_tier in (verified, certified) AND published_at IS NOT NULL.';
comment on column public.partner_integrations.certification_tier is
    'submitted → reviewing → verified → certified ; rejected is terminal.';

create or replace function public.touch_partner_integrations_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end
$$;

drop trigger if exists tg_partner_integrations_touch on public.partner_integrations;
create trigger tg_partner_integrations_touch before update on public.partner_integrations
    for each row execute function public.touch_partner_integrations_updated_at();
