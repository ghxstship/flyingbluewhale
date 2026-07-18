# COMPVSS Optimization Sweep — 2026-07-18

Full front-end + back-end optimization sweep of the COMPVSS field PWA (`/m`), organized by layer, with remediation and a re-audit. Commits `2620a43e … 852f2840` on main.

## What shipped (by layer)

### Front-end
- **Bundle** — `KIcon` was `import * as Lucide` + runtime string lookup (un-tree-shakeable → the whole ~1,600-icon lib on every `/m` route). Now an explicit `ICONS` registry (~260 named imports, `HelpCircle` fallback), guarded by `icon.test.ts` (asserts every `name="…"` literal in the mobile scope is registered). `next.config.ts` gained `optimizePackageImports` for `lucide-react` + the kit barrel. `qrcode` (RoseCard flip), `ToolSheet` (HomeShell), and the scanner capture stack (`ScannerCapture` + `image-pdf`) are now `next/dynamic` — off the initial route chunks.
- **CSS** — the root layout imported the whole ~170KB theme chain, so every shell downloaded every other shell's CSS. Split per shell: kit-mobile+onboarding → `(mobile)`, kit-reports+documents → `(platform)`, kit-signage → legend+portal, kit-rail → the 3 rail shells; kit-platform stays at root (global env layer, guard-locked); **kit-trends** (23KB) is now a runtime lazy `<link>` off the core path (drift-guarded public mirror). Verified no shell lost a layer it paints.
- **Data / render** — the mobile layout's per-nav reads cut ~9 → 4 (cached `getActiveProject` single-row read + the switcher catalog deferred to `GET /api/v1/me/switcher`, fetched on first sheet-open). `/m/clock` (6 serial hops → 3 parallel groups) + ~16 other page bodies parallelized (`Promise.all` for independent reads). `/m/feed` realtime confirmed org-scoped (no cross-tenant nudging).

### Back-end
- **Indexes** — the hottest COMPVSS predicate (the open-punch read, every clock-in/out) was unindexed → added `time_entries (org_id, user_id, started_at desc) where ended_at is null`; indexed the 2 unindexed FKs (`catalog_item_gtins(bound_by)`, `parties(auth_user_id)`).
- **RLS** — wrapped the 2 per-row `auth.uid()` evals on `chat_message_reactions` in `(select …)`; split 12 `FOR ALL` write policies (catalog_item_gtins, field_templates, the 6 assignment-detail siblings, daily_log_signoffs, pay_periods, spaces, space_post_reactions) into `INSERT/UPDATE/DELETE` so SELECT stops evaluating a redundant second permissive policy per row.
- **Caching / query** — `getMyPartyId` is `React.cache`-wrapped (writes use the uncached read); push fan-out reads `notification_preferences` once + batches `last_seen` in one UPDATE (was per-device); `revalidatePath` scoped off the whole-tree bust.

## Re-audit result

Two independent re-sweeps (front-end + back-end) against the landed code: **all substantive findings RESOLVED** except the two items below. The re-audit also **caught a HIGH-severity regression the first pass introduced** (see below) — the reason a re-audit is worth running.

### Regression caught + fixed (`852f2840`)
The open-punch index was first shipped as a partial **UNIQUE** (to also close the double-clock-in race). But three code paths open a `time_entries` row with `ended_at IS NULL` — personal punch, **`/api/v1/shifts/checkin`** (shift_id set), and the studio manual entry. A worker clocked in personally AND checking into a scheduled shift hit `23505` on the shift insert, which `shifts/checkin` did not error-check → the attendance FSM advanced while the shift's time entry was silently dropped (lost hours). **Fix:** the index is now **non-unique** (migration `20260718130000`, applied to prod); the double-punch guard reverts to the pre-existing app-level 409; `shifts/checkin` now captures + logs the insert error.

### Deferred (with rationale)
- **SW enqueue store-scan (FE L8.1)** — `enqueueRequest` does an O(n) full-store IndexedDB read to enforce the per-endpoint cap. Adding an `endpoint` index would need a store version bump, and legacy queued rows carry no `endpoint` field (treated as the punch endpoint) — an index would not capture them under that value, so index-based eviction could mishandle **un-synced field punches**. Bounded by the 500-row/endpoint cap and runs once per offline write. **Deferred:** the marginal win doesn't justify a subtly-incorrect change to delicate offline-data code.
- **`force-dynamic` redundancy (FE L1a)** — 98 `/m` pages carry `export const dynamic = "force-dynamic"`; each already reads cookies/session so is dynamic regardless. Cosmetic, no perf delta. Left as-is.

### DB-tier confirmed by a fresh advisor (MCP reconnected, same day)
Re-ran `get_advisors(performance)` after the Supabase MCP came back — the findings cleared, comparing to the original run:
- **Unindexed foreign keys: 2 → 0** — the category is gone; both `catalog_item_gtins(bound_by)` and `parties(auth_user_id)` are now indexed.
- **Auth RLS Initialization Plan: 4 → 2** — both `chat_message_reactions` policies cleared (the 2 remaining are non-COMPVSS).
- **Multiple Permissive Policies: 1095 → 1063** — −32, the findings across the 12 split COMPVSS tables.
- The 3 new indexes correctly appear in the (still ~1,771) "unused" list — expected on a pre-traffic DB; do NOT drop them.

A direct post-DDL safety check confirmed all 13 touched tables keep RLS enabled with exactly ONE SELECT policy + full write coverage (the two reaction tables intentionally have no UPDATE). No security lint introduced by the policy splits.

## Do NOT
Mass-drop the 177 "unused" indexes the advisor lists — on this pre-traffic DB they are overwhelmingly FK/predicate-covering indexes that will be used under load; re-run the advisor after real traffic before pruning any.
