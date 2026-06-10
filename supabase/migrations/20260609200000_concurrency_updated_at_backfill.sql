-- Concurrency token backfill — Sea Trial FINDING-022 follow-through.
--
-- The optimistic-concurrency pattern (edit page renders hidden `_updated_at`,
-- `updateOrgScopedWithCheck` adds `.eq("updated_at", token)`) was wired onto
-- 16 console edit surfaces whose tables never got an `updated_at` column.
-- At runtime the token rendered empty, the action treated the missing token
-- as "stale", and those edit forms could never save. The stale hand-written
-- `Database` type in src/lib/supabase/types.ts masked this; collapsing to the
-- generated types surfaced it as 16 type errors.
--
-- Fix: add `updated_at` + the SSOT `public.touch_updated_at()` trigger
-- (same `<table>_touch_updated_at` naming as leads/proposals/invoices/etc.)
-- to the 15 affected tables. Additive only.

do $$
declare
  t text;
begin
  foreach t in array array[
    'accommodation_blocks',
    'accreditation_categories',
    'accreditation_changes',
    'ad_manifests',
    'crisis_alerts',
    'delegation_entries',
    'dispatch_runs',
    'environmental_events',
    'insurance_policies',
    'major_incidents',
    'medical_encounters',
    'rate_card_items',
    'sustainability_metrics',
    'trademarks',
    'workforce_deployments'
  ]
  loop
    execute format(
      'alter table public.%I add column if not exists updated_at timestamptz not null default now()',
      t
    );
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      t || '_touch_updated_at',
      t
    );
  end loop;
end;
$$;
