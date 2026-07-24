-- announcements.read_count denorm was silently frozen for non-manager readers.
--
-- tg_bump_announcement_read_count (0048) UPDATEs public.announcements from an
-- AFTER INSERT trigger on announcement_reads. The trigger function was NOT
-- security definer, so the UPDATE ran with the READER's privileges — and the
-- announcements_publish_authority hardening (20260716000500) restricted
-- UPDATE to the manager band. Net effect since then: a crew member's read
-- receipt inserts fine, the counter UPDATE matches zero rows under RLS, and
-- read_count stays 0 while announcement_reads grows. Surfaced by the
-- 2026-07-24 comms walkthrough (receipt row present, counter still 0).
--
-- Fix: definer + pinned search_path (the standard counter-trigger posture,
-- same as private.* helpers), then backfill the counter from the truth table.

create or replace function public.tg_bump_announcement_read_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.announcements SET read_count = read_count + 1 WHERE id = NEW.announcement_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.announcements SET read_count = GREATEST(read_count - 1, 0) WHERE id = OLD.announcement_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Backfill: reconcile every announcement's counter with the receipts table.
update public.announcements a
set read_count = r.n
from (
  select announcement_id, count(*)::int as n
  from public.announcement_reads
  group by announcement_id
) r
where r.announcement_id = a.id
  and a.read_count is distinct from r.n;
