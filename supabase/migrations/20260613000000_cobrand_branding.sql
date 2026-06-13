-- Co-branding (producer × client × joint) for proposals, invoices, emails.
-- Adds the client + proposal branding layers and makes the branding bucket
-- public-read so anon proposal viewers can load logos. Additive + nullable;
-- existing proposals (theme-only) are unaffected.
--
-- LDP note: these are branding/asset columns, not lifecycle columns — no
-- *_state/*_phase applies and no bare `status` column is introduced.

-- Client branding layer (unblocks the existing resolvePdfBrand client path).
alter table public.clients add column if not exists branding jsonb not null default '{}'::jsonb;
alter table public.clients add column if not exists logo_url text;

-- Per-proposal override layer (cascades over project → org). proposals.theme
-- is retained for back-compat; the resolver reads branding first.
alter table public.proposals add column if not exists branding jsonb not null default '{}'::jsonb;

-- Branding bucket: ensure it exists and is public-read (logos are non-sensitive
-- and must render for unauthenticated proposal recipients).
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do update set public = true;

-- Anyone can read branding assets; only authenticated org members upload
-- (writes go through the service-role upload route, which scopes by org).
drop policy if exists "branding_public_read" on storage.objects;
create policy "branding_public_read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding_authenticated_write" on storage.objects;
create policy "branding_authenticated_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');
