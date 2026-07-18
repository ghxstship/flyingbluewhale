-- Kit 32 A5 (COMPVSS Field community likes). recognition_posts already carry
-- reactions (public.recognition_reactions); the /m/feed stream also merges
-- announcements, which had no reaction store. This mirrors the
-- recognition_reactions shape (one row per user per announcement per emoji) so
-- the feed's like affordance is a real, org-scoped, per-user store — not local
-- state. No lifecycle column (a reaction is a join row, like its twin).

create table if not exists public.announcement_reactions (
  announcement_id uuid not null references public.announcements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  reacted_at timestamptz not null default now(),
  primary key (announcement_id, user_id, emoji)
);

alter table public.announcement_reactions enable row level security;

-- Read: org members of the announcement's org. Write: the reacting user only,
-- and only against an announcement in an org they belong to.
create policy announcement_reactions_select on public.announcement_reactions
  for select to authenticated using (
    exists (
      select 1 from public.announcements a
      where a.id = announcement_reactions.announcement_id
        and private.is_org_member(a.org_id)
    )
  );

create policy announcement_reactions_insert on public.announcement_reactions
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.announcements a
      where a.id = announcement_reactions.announcement_id
        and private.is_org_member(a.org_id)
    )
  );

create policy announcement_reactions_delete on public.announcement_reactions
  for delete to authenticated using (user_id = (select auth.uid()));

-- FK index (FK-gap audit discipline: every new FK ships its index; the PK
-- already covers announcement_id).
create index if not exists announcement_reactions_user_id_idx
  on public.announcement_reactions (user_id);

grant select on table public.announcement_reactions to anon;
grant select, insert, delete, update on table public.announcement_reactions to authenticated;
grant all on table public.announcement_reactions to service_role;
