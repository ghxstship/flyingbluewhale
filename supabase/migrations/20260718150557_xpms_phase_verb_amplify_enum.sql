-- XPMS 2.5: verb-consistent rename of the xpms_phase enum + Amplify gate (before Close).
-- Existing rows on projects.xpms_phase / project_phase_transitions auto-carry the renames.
-- APPLIED 2026-07-18 (ledger 20260718150557). Ships with the app-code verb+Amplify changes.
-- Rollback caveat: Postgres cannot DROP an enum value, so 'Amplify' persists after any revert.
alter type public.xpms_phase rename value 'Discovery' to 'Discover';
alter type public.xpms_phase rename value 'Procurement' to 'Procure';
alter type public.xpms_phase add value if not exists 'Amplify' before 'Close';
