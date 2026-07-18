# COMPVSS Kits 30 · 31 · 32 — Conformance Close-Out

**Date**: 2026-07-18 · **Session**: lifecycle/UPC (kit 30) + field-PWA conformance (kits 31, 32)
**SSOT for design**: `ATLVS Ecosystem (30/31/32).zip` → `design_handoff_compvss_field` / `design_handoff_lifecycle_upc` (governance: kit leads, repo follows; MORE and LESS are both violations)
**Companion**: `KIT28_CONFORMANCE_BACKLOG.md` (prior cycle), `src/lib/mobile/self-sufficiency-manifest.ts` (guarded capability SSOT)

## Shipped this cycle (pushed to main)

- **Kit 30** — Employee Lifecycle Parity + UPC scan-to-fulfill. `/studio/projects/[id]/roster` (+ assign drawer, reporting tree), `advancing/cart` + `fulfillment`, offer-letter track + 4-doc packet; COMPVSS `/m/roster` suite; UPC resolver + Confirm Fulfillment + Bind-to-Catalog. Migrations `20260717213845` (catering details, catalog_item_gtins, fulfilled provenance), `20260717231335` (party org-scope index), `20260718004914` (ensure_custom_position_role RPC). **Jack-Sparrow acceptance: green ×3 vs prod (`82590b27`), 4/4 in ~42s.**
- **Kit 31** — shared field primitives (SwipeRow/withUndo/Crumbs/SheetHead/EmptySkeleton/fmtPosition) + floating tab bar + Aurora AI rename + More-hub regroup; Templates / Finance / Emergency pages / Scanner / Notification-detail surfaces; advance dates + catalog prefill + construction tasks + job publish + PO request + profile stepper; the v2.7 swipe canon across 8 lists + ActionBar enums + EmptySkeleton adoption + linked assets. Migrations `20260718013147/13348/13355/13408/13421`.
- **Kit 32** — v2.8 drawer canon (one `Sheet` grammar, SheetHead everywhere, approvals-drawer real-state, 4 new drawers); Shift Scheduler (`/m/scheduler`, `20260718022624`); enrichment wave 1 (report records, I'm-Safe muster check-in `20260718023356`, sync stamp + pull-to-refresh, outbox chips, crumbs, table sort, doc viewer); tier severity tokens; SwipeRow long-press + haptics; PWA shell polish (A2HS card, SW update toast, scroll memory, scan queue chip).

## Governance dispositions

### 7th "Onsite" tab
The kit defines **six** tabs (Home · Calendar · Tasks · Inbox · Assets · More). The repo's former 7th "Onsite" tab was already **retired** before this cycle: it was rehomed to `/p/onsite` on 2026-07-15 (see the `(mobile)/layout.tsx` docblock — "The GVTEWAY Onsite tab added 2026-06-23 was rehomed to `/p/onsite`"). `mobileTabs` in `src/lib/nav.ts` carries exactly the kit's six. **No violation outstanding.**

### Seed data (Pirates of the Caribbean canon)
Kit 32 makes `runtime/app.jsx.txt`'s seed consts canonical (BLACK PEARL CO. / Port Royal Kickoff / Joshamee Gibbs / the Rose assets / 10 emergency codes). This is the **design-kit demo** fixture. The repo's demo/E2E org data (Test Professional Org, Demo Events Co.) is the test-harness canon per `docs/E2E_COVERAGE_BACKLOG.md` and is NOT reconciled to the Pirates seed — the two serve different purposes (kit screenshots vs. RLS-faithful multi-persona e2e). **Disposition: no repo data change; the Pirates seed applies only if/when a COMPVSS screenshot-gallery regeneration is undertaken.**

## Deferred — wave-2 / DS polish not reached (Fable-5 credit exhaustion, 2026-07-18)

The wave-2 (#30) and DS-alignment (#31) agents were terminated mid-build by credit exhaustion. Complete slices were salvaged and pushed; the rest is listed here.

### Held (written, recoverable — need adoption decisions)
Git stash `kit32-unwired-primitives`:
- **`SyncBadge`** (`src/components/mobile/kit/SyncBadge.tsx`) — the sync/offline PILL as a shared kit component. Needs the `SyncBanner`/`SyncStampBar` refactor to consume it (DS_ALIGNMENT §2 directive). No consumer yet.
- **`AskLead` / `LockedRow`** (`src/components/mobile/kit/AskLead.tsx`) — the E2 permission-denied affordance (lock icon + "Ask Your Lead" sheet). Needs 2-3 opt-in adoption sites decided; default stays hide-when-denied.

### Not built (agents died before reaching)
- **A4** saved jobs (bookmark set + All / Saved·N filter chips; Share → refer flow)
- **A5** community post likes (toggle + count; real reaction store)
- **A6** vendor/roster Call/Email/Website as real `tel:`/`mailto:`/`https` anchors + recent-contact line
- **D2** sticky group headers in grouped lists
- **B5** first-load skeleton shimmer (reuse EmptySkeleton under Suspense)
- **C2** global-search upgrade (`/m/search` spanning tasks/assets/docs/people/templates, grouped results)
- **C3** recently-viewed rail on More (last 5 records)
- **D3** relative timestamps flip to absolute on tap
- **D4** task-row progress rings when `percent_complete` exists
- **B4 (UI half)** the Haptics toggle control on `/m/settings` — the lib (`setHapticsEnabled`) shipped; the settings row isn't wired
- **E2** permission-denied lock-row adoption (component held above)
- **E4** shift-fatigue nudge (>10h clocked → break banner on `/m/clock`)
- **A7** document-share scope audit-log note
- **P3** deep-links verification note (C4), density toggle (D5) disposition
- **E3** weather strip — **deliberately not built** (no data source; needs a weather integration decision — do not fabricate)

All are P2/P3 polish (the lowest-stakes tier). Core conformance and all field-critical flows are shipped.

## Violations flagged by the build agents (for kit-side remediation per governance rule 3)

- More hub carries ~23 repo-only surfaces the kit's `MORE_LINKS` doesn't list (My Work, Punch List, Mileage, Purchase Requests, Handover, Daily Log, Chain of Custody, etc.). Pre-existing; documented in the More page docblock.
- The Aurora brand button routes to `/m/inbox`; the kit's `.brandbtn` opens an Aurora AI chat sheet — that sheet does not exist in the repo.
- Refer/Invite is an inline composer (`/m/referrals`), not the kit's refer drawer; Share Profile / Share QR share-drawers (`.qa` grid + `.pass-qr`) don't exist; Join Org/Project drawers absent (join lives only in onboarding) — the switcher can't stack the kit's join child.
- No mobile advance **cart** surface — the `/m` advance flow is single-item (`/m/advances/new`); the kit's cart (with Remove swipe) has no mobile home.
- Broadcast notifications (`user_id IS NULL`) can't be acknowledged — `notifications_update` RLS requires `user_id = auth.uid()`, so `acknowledgeAlert` is a silent no-op on them. Needs a per-user broadcast-read store.
- `NEXT_FULFILLMENT_STATES` (`src/lib/db/assignments.ts`) lacks `issued→returned` though the `checkin_my_assignment` RPC allows it — the studio transition UI doesn't offer the return. Reconcile cross-shell.
- Roster swipe uses Message/Call/Email; the kit's swipe table says Message/Call/**Badge** for roster — kit disagrees with itself vs. the repo.
- Approvals: `approval_instances.metadata` carries no asset refs, so the kit's "Requested Items" tap-open can't bind; per-step "mine vs someone else's" is flattened to the manager band.
- Kit-internal: REPO_UPDATE says `.sheet-panel` max-height **85%**, the authoritative runtime CSS says **78%** — repo follows runtime; kit doc should reconcile.
- Portal volunteer schedule (`/p/[slug]/volunteer/schedule`) reads `shifts` without a `publish_state='published'` filter — harmless today (only the field scheduler writes drafts) but worth the one-line filter.

## Validation state at close

tsc exit 0 on main; theme/design-system/ia-lint/client-server-boundary/nav-routes/sitemap/ia-map/ldp-naming/enum-sync/kind-mirror guards green (verified per-commit in detached worktrees). The full vitest suite + local prod build + the screen-by-screen pixel pass against the 42-image gallery remain as the pre-existing `KIT28` §5 hygiene items (not regressed this cycle).
