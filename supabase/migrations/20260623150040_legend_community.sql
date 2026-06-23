-- LEG3ND Skool-class community — posts, comments, reactions. Members + their
-- contribution points come from the shared gamification ledger (points_ledger,
-- source='legend'); this migration is just the discussion surface. 3NF,
-- org-scoped, RLS. LDP naming: `*_state`.
--
-- CODE-READY migration — not applied to the live project here.

-- ── Community posts ────────────────────────────────────────────────────
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  body_html text not null default '',
  category text not null default 'general',
  pinned boolean not null default false,
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  post_state text not null default 'published' check (post_state in ('draft', 'published', 'archived', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index community_posts_org_idx on public.community_posts (org_id, pinned desc, created_at desc) where deleted_at is null;

alter table public.community_posts enable row level security;
create policy community_posts_select on public.community_posts
  for select using (private.is_org_member(org_id));
create policy community_posts_insert on public.community_posts
  for insert with check (private.is_org_member(org_id) and author_id = auth.uid());
create policy community_posts_update on public.community_posts
  for update using (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']))
  with check (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create policy community_posts_delete on public.community_posts
  for delete using (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_community_posts_updated before update on public.community_posts
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.community_posts to authenticated;

-- ── Community comments ─────────────────────────────────────────────────
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body_html text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index community_comments_post_idx on public.community_comments (org_id, post_id, created_at) where deleted_at is null;

alter table public.community_comments enable row level security;
create policy community_comments_select on public.community_comments
  for select using (private.is_org_member(org_id));
create policy community_comments_insert on public.community_comments
  for insert with check (private.is_org_member(org_id) and author_id = auth.uid());
create policy community_comments_update on public.community_comments
  for update using (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']))
  with check (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create policy community_comments_delete on public.community_comments
  for delete using (author_id = auth.uid() or private.has_org_role(org_id, array['owner', 'admin']));
create trigger trg_community_comments_updated before update on public.community_comments
  for each row execute function public.compvss_set_updated_at();
grant select, insert, update, delete on public.community_comments to authenticated;

-- ── Community reactions (one per user per post per kind) ───────────────
create table public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'like' check (kind in ('like', 'celebrate', 'insightful')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, kind)
);
create index community_reactions_post_idx on public.community_reactions (org_id, post_id);

alter table public.community_reactions enable row level security;
create policy community_reactions_select on public.community_reactions
  for select using (private.is_org_member(org_id));
create policy community_reactions_insert on public.community_reactions
  for insert with check (private.is_org_member(org_id) and user_id = auth.uid());
create policy community_reactions_delete on public.community_reactions
  for delete using (user_id = auth.uid());
grant select, insert, delete on public.community_reactions to authenticated;
