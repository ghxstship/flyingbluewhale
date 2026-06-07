# Pre-baseline migration archive — 2026-06-06

These are the 129 migration files that existed in `supabase/migrations/` before the
**baseline squash** of 2026-06-06. They are preserved here for historical reference
and are **no longer applied** by the Supabase CLI (it only reads `supabase/migrations/`).

## Why the squash

The local migration files and the remote `schema_migrations` history had diverged badly:

- The MCP `apply_migration` auto-stamps its own version, so ~65 migrations were recorded
  on remote under timestamps that did not match their local filename versions (names matched).
- ~8 migrations existed only on remote with no local file
  (`guide_access_redeem_rpc_v2`, `match_document_chunks_rpc`, `risk_and_forecast_batch_functions`,
  `drawing_markups`, `site_plans_pdf_path`, `competitive_features`,
  `accept_invite_fix_ambiguous_org_id`, `0052_labor_po_kind`).
- Local had duplicate version numbers: `0061`–`0064` each had two files (the unified-assignments
  series collided with the invite/budget series).
- `0060_ssot_3nf_orphan_remediation` had never been applied; it was applied to remote
  (guide_comments CHECK + deprecation comments only — its part-3 `asset_movements` assertion
  was omitted because remote carries the 0019 `asset_id` variant, not the 0016 canonical shape)
  immediately before the dump.

Rather than reconcile 129 files row-by-row, the operator chose to squash to a single baseline.

## Replacement

`supabase/migrations/20260606230000_baseline.sql` is a `supabase db dump --linked -s public,private`
snapshot of the production schema (project `xrovijzjbyssajhtwvas`) as of 2026-06-06, after `0060`.
The remote `schema_migrations` table was reset to a single row at version `20260606230000`.

## Not re-emitted in the baseline

The dump covered the app-owned `public` + `private` schemas only. System schemas
(`auth`, `storage`, `realtime`, `vault`, `extensions`) are Supabase-managed and were excluded.
That means **storage RLS policies and any auth triggers** defined in these archived migrations
(e.g. `0027_storage_rls_initplan_wrap`, `0031_storage_org_folder_enforcement`,
`0045_storage_org_folder_enforcement_v2`) are NOT in the baseline. They remain live on the
remote DB; if you ever rebuild a fresh project from the baseline, re-apply those policy
migrations from this archive.
