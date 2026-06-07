-- Round 13 fix: PostgREST upsert's ON CONFLICT can't target a partial
-- unique index (the WHERE clause makes it ambiguous which constraint
-- PG should use). Drop the partial and create a full unique on the
-- triple — Postgres treats NULL as distinct, so rows without a source
-- key still insert freely; the constraint only fires when all three
-- columns are non-null.
DROP INDEX IF EXISTS public.notifications_source_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_source_uniq
  ON public.notifications (user_id, source_type, source_id);
