-- incidents.deleted_at — close the SOFT_DELETABLE_TABLES mismatch.
--
-- src/lib/db/resource.ts lists "incidents" in its soft-delete allowlist,
-- so getOrgScoped/listOrgScoped append `.is("deleted_at", null)` — but the
-- table never had the column, which made the incident detail + edit pages
-- 500 with PostgREST 42703. Decision (AUDIT_2026-06-09 plan §2.2): add the
-- column for consistency with the other 74 soft-deletable tables rather
-- than shrinking the allowlist.

alter table public.incidents
  add column if not exists deleted_at timestamptz;

-- Partial index matching the established soft-delete query pattern
-- (org-scoped list pages always filter deleted_at IS NULL).
create index if not exists idx_incidents_org_active
  on public.incidents (org_id)
  where deleted_at is null;
