-- GVTEWAY public commerce — Shopify-style storefront.
--
-- Org-scoped catalog of sellable products (+ optional variants) exposed
-- publicly when published; carts + cart_items scoped to an anon session
-- token or an authenticated user. Checkout INITIATION reuses the existing
-- /api/v1/stripe/checkout flow — no payment processing lives here.
--
-- LDP NAMING: no bare `status` columns.
--   * products.product_state      — sequential macro arc (draft → published → archived)
--                                    → postgres enum type public.store_product_state.
--   * carts.cart_state            — cyclical operational lifecycle (open → checkout → converted → abandoned)
--                                    → postgres enum type public.store_cart_state.
--
-- RLS: org members read; manager+ writes (owner/admin/manager/controller/
-- collaborator). Published products + their variants are anon-readable
-- (gated on product_state='published'). Carts are readable/writable by
-- their owning user, or by anyone holding the session token (anon flow,
-- enforced app-side via the token never being listed).

-- ──────────────────────────────────────────────────────────────────────
-- Enum types (lifecycle homes)
-- ──────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'store_product_state') then
    create type public.store_product_state as enum ('draft', 'published', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'store_cart_state') then
    create type public.store_cart_state as enum ('open', 'checkout', 'converted', 'abandoned');
  end if;
end$$;

-- ──────────────────────────────────────────────────────────────────────
-- store_products
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  product_state public.store_product_state not null default 'draft',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  inventory_qty integer not null default 0 check (inventory_qty >= 0),
  image_url text,
  sku text,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, slug)
);

create index if not exists store_products_org_idx
  on public.store_products (org_id, created_at desc);
create index if not exists store_products_published_idx
  on public.store_products (product_state, published_at desc)
  where (product_state = 'published' and deleted_at is null);

alter table public.store_products enable row level security;

create policy store_products_org_select
  on public.store_products for select
  to authenticated
  using (private.is_org_member(org_id) and deleted_at is null);

create policy store_products_public_select
  on public.store_products for select
  to authenticated, anon
  using (product_state = 'published' and deleted_at is null);

create policy store_products_write
  on public.store_products
  to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger store_products_touch_updated_at
  before update on public.store_products
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- store_product_variants (optional)
-- ──────────────────────────────────────────────────────────────────────
create table if not exists public.store_product_variants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete cascade,
  title text not null,
  sku text,
  price_cents integer check (price_cents >= 0),
  inventory_qty integer not null default 0 check (inventory_qty >= 0),
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_product_variants_product_idx
  on public.store_product_variants (org_id, product_id, sort_order);

alter table public.store_product_variants enable row level security;

create policy store_product_variants_org_select
  on public.store_product_variants for select
  to authenticated
  using (private.is_org_member(org_id) and deleted_at is null);

-- Variants of a published, non-deleted product are anon-readable.
create policy store_product_variants_public_select
  on public.store_product_variants for select
  to authenticated, anon
  using (
    deleted_at is null
    and exists (
      select 1 from public.store_products p
      where p.id = store_product_variants.product_id
        and p.product_state = 'published'
        and p.deleted_at is null
    )
  );

create policy store_product_variants_write
  on public.store_product_variants
  to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger store_product_variants_touch_updated_at
  before update on public.store_product_variants
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- store_carts
-- ──────────────────────────────────────────────────────────────────────
-- session_token: opaque server-issued token stored in an httpOnly cookie
-- for the anon shopper flow. user_id binds a cart once the shopper is
-- authenticated. At least one is set.
create table if not exists public.store_carts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  session_token text,
  cart_state public.store_cart_state not null default 'open',
  currency text not null default 'USD' check (char_length(currency) = 3),
  checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_carts_owner_chk check (user_id is not null or session_token is not null)
);

create index if not exists store_carts_org_idx
  on public.store_carts (org_id, created_at desc);
create index if not exists store_carts_user_idx
  on public.store_carts (user_id) where user_id is not null;
create unique index if not exists store_carts_session_token_idx
  on public.store_carts (session_token) where session_token is not null;

alter table public.store_carts enable row level security;

-- The owning authed user can read/write their own cart; org members read
-- all org carts (operator visibility into abandoned carts). Anon carts are
-- created + mutated via SECURITY DEFINER server actions (service role),
-- so no anon RLS path is needed.
create policy store_carts_select
  on public.store_carts for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_org_member(org_id));

create policy store_carts_owner_write
  on public.store_carts
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy store_carts_manager_write
  on public.store_carts
  to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger store_carts_touch_updated_at
  before update on public.store_carts
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- store_cart_items
-- ──────────────────────────────────────────────────────────────────────
-- unit_price_cents snapshots the price at add-to-cart time so a later
-- product price change doesn't silently re-price an open cart.
create table if not exists public.store_cart_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  cart_id uuid not null references public.store_carts(id) on delete cascade,
  product_id uuid not null references public.store_products(id) on delete restrict,
  variant_id uuid references public.store_product_variants(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id, variant_id)
);

create index if not exists store_cart_items_cart_idx
  on public.store_cart_items (cart_id);

alter table public.store_cart_items enable row level security;

create policy store_cart_items_select
  on public.store_cart_items for select
  to authenticated
  using (
    private.is_org_member(org_id)
    or exists (
      select 1 from public.store_carts c
      where c.id = store_cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

create policy store_cart_items_owner_write
  on public.store_cart_items
  to authenticated
  using (
    exists (
      select 1 from public.store_carts c
      where c.id = store_cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.store_carts c
      where c.id = store_cart_items.cart_id
        and c.user_id = (select auth.uid())
    )
  );

create policy store_cart_items_manager_write
  on public.store_cart_items
  to authenticated
  using (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']))
  with check (private.has_org_role(org_id, array['owner', 'admin', 'manager', 'controller', 'collaborator']));

create trigger store_cart_items_touch_updated_at
  before update on public.store_cart_items
  for each row execute function public.touch_updated_at();

-- ──────────────────────────────────────────────────────────────────────
-- Grants — anon needs SELECT on the two publicly-readable tables; the
-- published-only RLS policies above gate which rows are visible.
-- ──────────────────────────────────────────────────────────────────────
grant select on table public.store_products to anon;
grant select on table public.store_product_variants to anon;
