DO $migrate$ BEGIN
  -- Wrap current_setting('role') in (select ...) so Postgres init-plans the
-- function call instead of re-evaluating it per row. Same optimization
-- pattern as migration 20260509100004 (auth.uid() wraps in 54 policies).
--
-- Behavior unchanged — only the postgres + service_role roles can insert
-- into audit_events, and current_setting('role') is stable inside one
-- transaction so the cached value is correct for every row in the batch.

drop policy if exists uap_audit_events_insert on public.audit_events;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
DO $migrate$ BEGIN
  create policy uap_audit_events_insert on public.audit_events
  for insert to authenticated, anon
  with check ((select current_setting('role')) = any (array['postgres', 'service_role']));
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;

DO $migrate$ BEGIN
  comment on policy uap_audit_events_insert on public.audit_events is
  'Insert allowed only when running as postgres or service_role. The (select '
  'current_setting(...)) wrapper is an init-plan optimization — Postgres '
  'evaluates the function once per query plan instead of per row.';
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
  WHEN undefined_object THEN NULL;
END $migrate$;
