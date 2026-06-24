-- Plumb-line DB-3 + DB-4: trigger-maintain denormalized counters that previously
-- had no maintaining trigger (drift candidates), and derive event ticket
-- sales_state from its inputs instead of storing it independently.

-- ── DB-3: community_posts.like_count ← community_reactions(kind='like') ──────
create or replace function public.tg_community_post_like_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := coalesce(NEW.post_id, OLD.post_id);
  update public.community_posts p
     set like_count = (select count(*) from public.community_reactions r where r.post_id = pid and r.kind = 'like')
   where p.id = pid;
  return null;
end $$;

drop trigger if exists trg_community_reactions_like_count on public.community_reactions;
create trigger trg_community_reactions_like_count
  after insert or delete on public.community_reactions
  for each row execute function public.tg_community_post_like_count();

-- ── DB-3: community_posts.comment_count ← community_comments(deleted_at null) ─
create or replace function public.tg_community_post_comment_count() returns trigger
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  pid := coalesce(NEW.post_id, OLD.post_id);
  update public.community_posts p
     set comment_count = (select count(*) from public.community_comments c where c.post_id = pid and c.deleted_at is null)
   where p.id = pid;
  return null;
end $$;

drop trigger if exists trg_community_comments_comment_count on public.community_comments;
create trigger trg_community_comments_comment_count
  after insert or delete or update of deleted_at on public.community_comments
  for each row execute function public.tg_community_post_comment_count();

-- Backfill existing rows to reconcile any pre-trigger drift.
update public.community_posts p set
  like_count = (select count(*) from public.community_reactions r where r.post_id = p.id and r.kind = 'like'),
  comment_count = (select count(*) from public.community_comments c where c.post_id = p.id and c.deleted_at is null);

-- ── DB-4: event_ticket_types.sales_state derived from inventory inputs ───────
-- The manual 'closed' state stays authoritative; on_sale/sold_out is derived so
-- it can no longer drift independently of quantity_sold/quantity_total.
create or replace function public.tg_event_ticket_types_sales_state() returns trigger
language plpgsql set search_path = public as $$
begin
  if NEW.sales_state <> 'closed' then
    NEW.sales_state := case
      when NEW.quantity_total > 0 and NEW.quantity_sold >= NEW.quantity_total then 'sold_out'
      else 'on_sale'
    end;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_event_ticket_types_sales_state on public.event_ticket_types;
create trigger trg_event_ticket_types_sales_state
  before insert or update on public.event_ticket_types
  for each row execute function public.tg_event_ticket_types_sales_state();

-- Reconcile existing rows through the trigger.
update public.event_ticket_types set sales_state = sales_state where true;
