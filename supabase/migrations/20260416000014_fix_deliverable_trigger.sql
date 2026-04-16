-- ═══════════════════════════════════════════════════════
-- GVTEWAY Migration 014: Fix deliverable triggers + history RLS
--
-- Bug: snapshot_deliverable_on_submit() trigger inserts into
-- deliverable_history, but RLS on that table blocks the insert
-- because the trigger runs as the calling user. Fix by making
-- the function SECURITY DEFINER.
-- ═══════════════════════════════════════════════════════

-- Fix the snapshot trigger to run as definer (bypasses RLS)
create or replace function snapshot_deliverable_on_submit()
returns trigger as $$
begin
  if old.status != new.status and new.status = 'submitted' then
    new.version = old.version + 1;
    new.submitted_at = now();
    insert into deliverable_history (deliverable_id, version, data, changed_by)
    values (new.id, new.version, new.data, coalesce(new.submitted_by, old.submitted_by));
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;
