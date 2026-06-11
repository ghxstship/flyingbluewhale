# CLAUDE.md

Project-specific notes for Claude Code agents working on `flyingbluewhale` (the engineering repo for **ATLVS Technologies** — the brand name visitors see in the marketing site, console chrome, and OG cards).

## Brand

- **Brand name (legal/text)**: `ATLVS Technologies`
- **Brand mark (visible)**: `A T L V S` — literal spaces in JSX, matches the spaced `G H X S T S H I P` parent-company treatment. Use `aria-label="ATLVS Technologies — home"` so screen readers don't read it letter-by-letter.
- **Apex domain**: `atlvs.pro` — marketing, auth, `/me`, public proposals/offers. The whole platform lives under this apex; `flyingbluewhale` is a _repo nickname only_ and must not appear in any URL, email, identifier, or copy.
- **App subdomains**: `app.atlvs.pro` (console) · `gvteway.atlvs.pro` (portal) · `compvss.atlvs.pro` (field PWA). Host-rewrite middleware in `src/proxy.ts` maps each subdomain to its internal route group (`/console`, `/p`, `/m`).
- **Sub-products**: ATLVS (red, the console), GVTEWAY (blue, the portal), COMPVSS (yellow, the field PWA) — sub-brand names + colors stay; do not rename or recolor these.
- **Voice canon**: see `feedback_marketing_voice.md` in memory — definitive, luxury self-confidence with hacker irreverence. Never compare to competitors.

## Overview

Unified production platform scaffolded against the optimized IA shared with FlyteDeck (redsealion) and gvteway (opus-one). See `docs/ia/01-topology.md` for the full IA and `docs/decisions/ADR-0001-three-shell-topology.md` for the rationale.

## Shells

Six route groups, three of them are full shells with distinct layouts:

- `(marketing)` — public, SEO, unauthenticated.
- `(auth)` — login, signup, invites. Posts to `/auth/resolve` which redirects based on persona.
- `(personal)` — `/me`, any authed user.
- `(platform)` — `/console`, internal operations. Left sidebar driven by `src/lib/nav.ts#platformNav`. `data-platform="atlvs"` (red).
- `(portal)` — `/p/[slug]/<persona>`. `data-platform="gvteway"` (blue). Slug is the authorization boundary.
- `(mobile)` — `/m`. `data-platform="compvss"` (yellow). Offline-first PWA.

## Design system

- **Fonts:** Inter + JetBrains Mono via `next/font`.
- **Tokens:** Defined in `src/app/globals.css` under `@theme inline`. Light/dark via `data-theme` on `<html>`. Brand overlay via `data-platform`.
- **Primitives:** `Button`, `Input`, `Badge`, `Avatar`, `ProgressBar`, `ThemeToggle`, `Card`, `MetricCard`, `EmptyState`, `StatusBadge` in `src/components/ui/`.
- **Shell helpers:** `ModuleHeader`, `PlatformSidebar`, `PortalRail`, `MobileTabBar`, `AuthCard`, `MarketingHeader`, `PageStub` in `src/components/Shell.tsx`.
- **Utilities:** `.surface`, `.surface-raised`, `.surface-inset`, `.elevation-{1..4}`, `.hover-lift`, `.press-scale`, `.metric-grid`, `.data-table`, `.nav-item`, `.glass-nav`, `.skeleton`.

## Backend (Supabase)

- **Project:** `flyingbluewhale` (`xrovijzjbyssajhtwvas`). URL + anon key in `.env.local`.
- **Schema:** 33+ tables — identity (`orgs`, `users`, `memberships`), core (`projects`), advancing — unified assignments (`assignments`, `assignment_events`, `assignment_scan_codes`, `assignment_external_holders`, `{ticket,credential,lodging,travel,vehicle}_assignment_details`) + doc-specs (`deliverables`, `deliverable_comments`, `deliverable_history`), sales (`clients`, `leads`, `proposals`), finance (`invoices`, `invoice_line_items`, `expenses`, `budgets`, `time_entries`, `mileage_logs`, `advances`), procurement (`vendors`, `requisitions`, `purchase_orders`, `po_line_items`), production (`equipment`, `rentals`, `fabrication_orders`), ops (`tasks`, `events`, `locations`, `crew_members`, `credentials`), AI/system (`ai_conversations`, `ai_messages`, `audit_log`, `notifications`), event guides (`event_guides`).
- **Marketplace canon (migration 0002):** `talent_profiles`, `talent_riders`, `open_calls`, `open_call_submissions`, `talent_offers`, `job_postings`, `job_applications`, `availability_slots`, `reviews`, `saved_searches`, `user_profiles`. Public discovery views: `public_talent_directory`, `public_crew_directory`, `public_vendor_directory`, `public_job_board`, `public_open_calls`, `public_rfq_marketplace` (granted to anon + authenticated). Existing tables extended with public-profile columns: `vendors.is_public_profile/public_handle/...`, `crew_members.is_public_profile/...`, `rfqs.visibility/public_slug/...`, `orgs.marketplace_enabled/marketplace_take_rate_bps`. RLS pattern unchanged: `private.is_org_member` for org-scoped writes; public select policies gated on `status='published'` or `is_public=true`.
- **RLS:** Enforced on every table. `is_org_member(org_id)` and `has_org_role(org_id, roles[])` are the canonical helpers.
- **Seed:** `demo` org with existing auth users as owners. MMW26 Hialeah project with a guest-facing event guide.
- **Migrations:** In `supabase/migrations/`. Apply via the Supabase MCP `apply_migration` — do not hand-edit the remote DB.
- **Lifecycle naming discipline (LDP):** New schema-bearing columns MUST be named `*_phase` (sequential macro arc) or `*_state` (cyclical operational), per `LIFECYCLE_DECOMPOSITION_PROTOCOL.md` §NAMING DISCIPLINE. **`status` is banned in new tables** — every `status` column is a defect candidate at schema review. Eight canonical lifecycles, with their ATLVS column homes: `xpms_phase` (project), `production_phase` (fabrication_orders), `ual_state` (asset_movements), `fulfillment_state` (shared by `deliverables` + `assignments`; renamed from `deliverable_state` in migration 0061), `uis_lifecycle_state` (uis_roles — engagement, per Party × Project × channel), `letter_state` on offer_letters (engagement-document, enum type `offer_letter_status`, including COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED), `accounting_period_state` (accounting_periods.state), `subscription_state` (subscriptions). See `docs/XPMS_TO_ATLVS_MAPPING.md` for the conceptual ⇄ implementation translation, `docs/E2E_LRP_PRESET.md` for the durable Q1–Q6 answers for future protocol runs, and `reports/LDP_LIFECYCLE_AUDIT.md` for historical conformance. **As of migration `20260609220000_ldp_status_rename` the live schema has ZERO bare `status` columns** — 69 renamed, 6 dropped in favor of their synced twins; the full map is `docs/LDP_STATUS_RENAME_MAP.md` and `src/lib/ldp-naming-canon.test.ts` guards regressions.

## Conventions

- **Route pattern:** `/<resource>` (list) · `/<resource>/new` (create) · `/<resource>/[id]` (detail).
- **Server actions:** `"use server"` in `actions.ts` next to the page. Shape: `export type State = { error?: string } | null;` — feeds `useActionState`.
- **Forms:** Use `<FormShell action={...}>` from `src/components/FormShell.tsx` for the standard layout + error surface.
- **Selects:** Native `<select className="ps-input">` is the sanctioned pattern for simple enum selects in server-component forms. Reserve `ui/Select` (Radix) for client components that need controlled behavior, and `ui/Combobox` for searchable/async option lists.
- **Data fetching:** Server components use `listOrgScoped(table, orgId)` / `getOrgScoped(table, orgId, id)` from `src/lib/db/resource.ts`.
- **External portal prefix:** `/p/[slug]/...` (internal route). Don't add external features to `/console/*`.
- **Cross-shell URLs:** Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode `https://...atlvs.pro` and never concat `NEXT_PUBLIC_APP_URL` with `/console`/`/p`/`/m`. The helper is the single switch between subdomain mode and path-prefix fallback (preview deploys). Examples: `urlFor("platform", "/projects/abc")`, `urlFor("portal", "/mmw26/guide")`, `urlFor("auth", "/login")`.
- **API:** All endpoints under `/api/v1/*`. Use `apiOk`, `apiCreated`, `apiError`, `parseJson` from `@/lib/api`. Guard with `withAuth` from `@/lib/auth`. Zod-validate all inputs at the boundary.
- **Nav:** When adding a platform module, also add it to `src/lib/nav.ts#platformNav`.
- **Stubs:** New routes are added via `scripts/routes.txt` + `bash scripts/generate-stubs.sh`. The generator is idempotent.

## Integrations

- **Anthropic (AI):** `src/app/api/v1/ai/chat/route.ts` — streaming chat via `@anthropic-ai/sdk` with `claude-sonnet-4-6` / `claude-opus-4-7`. Conversation + messages persisted in `ai_conversations` / `ai_messages`.
- **Stripe:** Webhook receiver at `/api/v1/webhooks/stripe` — HMAC-SHA256 signature verification (no SDK dep). Checkout at `/api/v1/stripe/checkout`. Connect Express onboarding at `/api/v1/stripe/connect/onboarding`.
- **Supabase Storage:** Buckets `advancing`, `receipts`, `proposals`, `credentials`, `branding`. Deliverable downloads via signed URLs at `/api/v1/deliverables/[id]/download`.

## Marketplace (0002)

Public surfaces exposing your org's RFQs, gigs, talent calls, talent EPKs, crew profiles, and vendor profiles to logged-out visitors.

- **Operator console:** `/console/marketplace` — hub with metric cards. Sub-routes: `postings` (job board ATS), `calls` (open calls / casting), `talent` (EPK roster + riders), `offers` (booking workflow with state machine), `reviews` (bidirectional moderation), `settings` (take rate, visibility). RFQ publishing extends existing procurement at `/console/procurement/rfqs/[rfqId]/publish`.
- **Public discovery:** `/marketplace` (marketing shell, anon-readable). Sub-routes: `rfqs`, `gigs`, `calls`, `talent`, `crew`, `vendors`. Each has a list page (driven by the `public_*` views) and a detail page keyed by `public_slug` or `public_handle`.
- **Personal (/me):** `applications`, `submissions`, `availability` (booking calendar), `reviews` (received + written), `talent` (self-managed EPK editor), `crew`, `offers`. Auth required.
- **Default booking terms:** 60% deposit / 40% balance on load-in (per `feedback_payment_terms_default.md`). `talent_profiles.deposit_pct=60` and `talent_offers.balance_terms='load_in'` enforce this default.
- **Reviews trigger:** insert a counterpart review on the same `(transaction_type, transaction_id)` and both rows auto-flip `released_at=now()` (BeatGig pattern). Subject `rating_avg` / `rating_count` roll up via `tg_reviews_aggregate`.
- **Compliance gating on public RFQs:** `requires_prequalification`, `requires_insurance`, `requires_w9`, `nda_required` columns on `rfqs`. Vendor portal is the bid-submission surface; gates evaluated app-side before allowing a response.
- **Code anchor:** schema in `supabase/migrations/0002_marketplace_canon.sql`; shared types + helpers in `src/lib/marketplace.ts`; the generated client types (`src/lib/supabase/database.types.ts`, regenerated via the Supabase MCP `generate_typescript_types` — there is no `gen:types` npm script) cover every table; `as unknown as LooseSupabase` from `src/lib/supabase/loose.ts` is reserved for genuinely dynamic table names.

## Advancing canon (unified `assignments`, 0061–0068)

"Advancing" in this codebase means the unified per-project, per-individual catalog fulfillment lifecycle. Everything assignable from the master catalog to a party — **tickets, credentials, catering, radios, tools, equipment, uniforms, travel, lodging, vehicles** — is a row in `public.assignments`. Project-document deliverables (riders, plots, lists, plans, grids) stay in `public.deliverables` (different shape: file-centric, no party). NEVER financial cash advances.

> **Supersedes 0049.** The old model put per-individual rows in `deliverables` via `assignee_id` + 9 `*_assignment` `deliverable_type` values. Migrations `0061`–`0068` (`0061_unified_assignments_*` … `0068_*`) moved all of that into the `assignments` domain. `deliverables.assignee_id` and `deliverables.catalog_item_id` are **dropped**; the 9 `*_assignment` enum values are **gone**; `tickets`/`ticket_scans`/`ticket_types`/`asset_links` are **dropped** (rolled into `assignments` + `assignment_events` + `assignment_scan_codes` + `master_catalog_items WHERE kind='ticket'`).

- **Core table — `public.assignments`:** one row per (party × project × catalog_item). `catalog_item_id` (NOT NULL → `master_catalog_items`, `ON DELETE RESTRICT`) — every assignment is a concrete instance of a catalog SKU; free-form one-offs author a catalog row first. `catalog_kind` (`catalog_kind` enum: `ticket`/`credential`/`catering`/`radio`/`tool`/`equipment`/`uniform`/`travel`/`lodging`/`vehicle`) is **denormalized** from `master_catalog_items.kind` by the `assignments_sync_catalog_kind` trigger so kind-filtered lists never JOIN (SSOT stays `master_catalog_items.kind`). Org/project scoped; soft-delete via `deleted_at`; per-kind extras in `data jsonb`; optional `atom_id` → `xpms_atoms` ties to the XPMS WBS.
- **Party model (exactly-one-of):** `party_kind` (`assignment_party_kind` enum: `user` | `crew_member` | `external_holder`) with the matching one of `party_user_id` (→ `auth.users`) / `party_crew_id` (→ `crew_members`) / `party_external_id` (→ `assignment_external_holders`, for guest-ticket holders not yet on platform — claimed by case-insensitive email). A CHECK constraint enforces exactly one is set. RLS: org members read; the `party_user_id` user reads their own; manager+ (owner/admin/controller/collaborator) writes.
- **Fulfillment state machine — `fulfillment_state`:** the `fulfillment_state` enum (renamed from `deliverable_state` in `0061`; **shared by `deliverables` and `assignments`**). Doc/advance arc: `briefed → draft → submitted → in_review → approved → delivered` (+ `revision_requested`, `rejected`). Physical-asset/ticket arc adds `issued → transferred → redeemed`, plus `expired`, `voided`, `returned`. Allowed transitions are codified in `NEXT_FULFILLMENT_STATES` (`src/lib/db/assignments.ts`) and enforced server-side so a stale tab can't write an illegal jump.
- **Append-only journal — `public.assignment_events`:** universal log replacing `ticket_scans` + `deliverable_history` + `deliverable_comments` (for assignments). `event_kind` (`assignment_event_kind`: `scan`/`consume`/`state_change`/`comment`/`version`/`void`/`reissue`) discriminates the payload: `state_change` carries `from_state`/`to_state`, `scan` carries `result` (`assignment_scan_result`: accepted/duplicate/voided/not_found/expired/wrong_zone) + `location`, `comment` carries `body`. Every state transition writes one row.
- **Scan codes — `public.assignment_scan_codes`:** many physical/digital tokens per assignment (`kind` ∈ `barcode`/`qr`/`nfc`/`rfid`/`wristband_serial`) to support reprints and gate re-bands. `UNIQUE (org_id, code) WHERE active` gives O(1) gate scans without losing audit trail. `scanAssignment()` (lib) resolves a code → assignment and logs an `assignment_events` scan row.
- **Per-kind detail siblings (1:1 PK = `assignments.id`):** `ticket_assignment_details` (tier/zone/gate/seat), `credential_assignment_details` (access_level/expires_on/parent badge), `lodging_assignment_details` (property/room/check-in/roommate), `travel_assignment_details` (mode/carrier/legs), `vehicle_assignment_details` (plate/mileage). Catering/radio/tool/equipment/uniform use `assignments.data` JSONB until structured requirements emerge.
- **Inventory:** `v_catalog_inventory` view rolls up assignment counts per `master_catalog_items` row by `fulfillment_state` bucket (open/fulfilled/cancelled/available) — replaces the denormalized `ticket_types.sold` counter.
- **Canonical lib:** `src/lib/db/assignments.ts` — `CATALOG_KINDS` / `FULFILLMENT_STATES` / `NEXT_FULFILLMENT_STATES` tuples + label maps + read helpers `listProjectAssignments` / `listMyAssignments` / `getAssignment` / `scanAssignment`. Deliverable doc-specs use `src/lib/db/advancing.ts`.
- **One domain, three shells.** Same advancing → fulfillment → tracking lifecycle drives ATLVS authoring, GVTEWAY portal display, and COMPVSS field view.
- **ATLVS admin:** `/console/projects/[projectId]/advancing/assignments` (per-project list + `/new` form + `/[assignmentId]` detail with transition row). New-assignment insert push-notifies the party (`kind: "assignment"`); every transition writes an `assignment_events` row. Cross-project per-person roster at `/console/people/[personId]/assignments`; scan-code binding at `/console/people/credentials/asset-linker`.
- **GVTEWAY portal:** `/p/[slug]/crew/advances` (project-scoped, per-individual; reads `listMyAssignments`). Guest tickets at `/p/[slug]/guest/tickets`.
- **COMPVSS field:** `/m/advances` (cross-project, per-individual; reads `listMyAssignments`, project name hydrated for context).
- **Shared widget:** `<PortalDocVault>` (`src/components/portal/PortalDocVault.tsx`) reads **`deliverables` (doc-specs only)** filtered to the caller's `submitted_by`, with an optional `types[]` filter. Mounted on `/p/[slug]/{artist, media, delegation}` index pages. Per-individual entitlements are NOT here — they live in `assignments`, surfaced via the advances routes above.
- **Notifications:** `notification_kind_catalog` (refreshed in `0067`) exposes the `assignment` / `assignment_state` / `assignment_scan` `PushKind`s — renamed from the legacy `advancing` / `advancing_state` — for the `/m/settings/notifications` matrix.
- **`/console/finance/advances` is gone** — that route was auto-scaffold debris. Never query the legacy `advances` table from any advancing surface.

## Connecteam parity (0046–0048)

Deskless-workforce features that bring COMPVSS to feature-parity with Connecteam, layered into the existing 3-shell IA — no new shells.

- **Schema:** `supabase/migrations/0046_connecteam_parity.sql` (19 tables: time_clock_zones, shift_swaps, announcements, announcement_reads, chat_rooms/members/messages, surveys/questions/responses, polls/options/votes, courses/lessons/quiz_questions/assignments/completions, time_off_policies/balances/requests, recognition_posts/reactions, badges/awards, personal_documents, new_hire_flows/steps/assignments) · `0047_connecteam_parity_wiring.sql` (time_entries.shift_id, personal-documents bucket, touch_updated_at triggers) · `0048_connecteam_parity_loop_closure.sql` (courses.completion_badge_id, announcements.read_count denorm trigger, approve_time_off_request SECURITY DEFINER RPC).
- **Canonical lib:** `src/lib/connecteam.ts` — enum tuples + `metersBetween`/`classifyPunch`/`scoreQuiz`/`daysBetween` helpers, mirrors the `src/lib/marketplace.ts` shape.
- **COMPVSS surfaces (/m):** `feed`, `inbox` + `[roomId]`, `learning` + `[courseId]`, `time-off` + `/new`, `kudos`, `polls`, `surveys` + `[surveyId]`, `docs` + `/new`, `directory`, `onboarding` + `[assignmentId]`, `checkin` (read-only meal/break summary, distinct from `/m/clock` punch), `incident` (My Incidents view, distinct from `/m/incidents` org queue), `incident/new` (express one-field quick-file).
- **ATLVS admin (/console):** under `comms/announcements`, `comms/polls`, `comms/surveys`, `workforce/courses`, `workforce/time-off`, `workforce/recognition`, `workforce/badges`, `workforce/onboarding`, `workforce/shift-swaps`, `settings/time-clock-zones`.
- **Realtime:** `src/components/RealtimeRefresh.tsx` is a tiny client island that subscribes to Supabase Realtime on a filtered table and nudges `router.refresh()` on changes. Mounted on `/m/feed` (announcements) and `/m/inbox/[roomId]` (chat_messages).
- **Push fan-out:** announcement publish, kudos creation, chat message post, badge award, advancing-state transitions, course pass, time-off, shift-swap, and incident filing all fire `sendPushTo`/`sendPushBulk` from `src/lib/push/send.ts`. `/m/settings` reuses `<PushToggle>` for subscription enable/disable. **Per-kind opt-out:** every call passes a `kind: PushKind` payload field; `sendPushTo`/`sendPushBulk` read `notification_preferences.matrix[<kind>].push` and short-circuit users who toggled the kind off in `/m/settings/notifications`. Omit `kind` only for system-level pings that shouldn't be user-disable-able.
- **Test users (demo org):** `performer@gvteway.test` (owner), `admin@gvteway.test` (admin), `mgmt@gvteway.test` (manager), `crew@gvteway.test` (member) — all password `CompvssTest2026!`. Re-role via SQL; passwords reset via pgcrypto's `crypt()`.
- **Smoke harnesses:** `scripts/compvss-smoke.mjs` (47 routes × 4 roles = 188 page-render checks with unique-title matchers + stub detection); `scripts/compvss-actions-smoke.mjs` (27 RLS-gated mutation checks across roles). Both run against a live dev server on :3000.

## Connecteam parity loop-closure (0050–0051)

Migrations that close the hardening loop on the 0046–0048 layer.

- **Schema:** `0050_connecteam_fk_indexes.sql` (20 missing FK indexes on the new Connecteam tables — announcements.author_id, badge_awards.badge_id, chat_messages.author_id, etc.) · `0051_catalog_account_manager_canon.sql` (three pieces).
- **Master catalog (0051 §1):** `public.master_catalog_items` — org-scoped reusable inventory (`catalog_kind` enum: credential/catering/radio/tool/equipment/uniform/travel/lodging/vehicle; `ticket` added in 0061). `assignments.catalog_item_id` FK points back so advancing assignments reference a canonical SKU instead of free-text titles (`catalog_kind` is denormalized onto `assignments` from `master_catalog_items.kind`). ATLVS admin at `/console/settings/catalog` (list + new + detail + edit + soft-delete + toggle). _(The `deliverables.catalog_item_id` FK named here originally was dropped in 0066 — see "Advancing canon".)_
- **Account-manager assignments (0051 §2):** `public.account_manager_assignments` — pairs a portal user (vendor/sponsor/delegation contact/etc.) with their org-side AM for a given persona × project. Drives `/p/[slug]/messages` (the portal's direct-to-AM thread) and `/p/[slug]/messages/start` (lazy chat_rooms row creation). ATLVS admin at `/console/settings/account-managers` (list + new + detail + toggle + delete; rooms preserved on delete via ON DELETE SET NULL on chat_room_id).
- **Notification preference taxonomy (0051 §3):** `notification_kind_catalog` view — canonical list of `PushKind` values that the `/m/settings/notifications` matrix renders against. See "Push fan-out" above for how the matrix is enforced.

## Boarding Pass (event guides)

Per-role Know-Before-You-Go — same Boarding Pass pattern, shared schema, role-scoped rendering.

- **Schema:** `GuideConfig` in `src/lib/guides/types.ts` — sections are `overview | schedule | set_times | timeline | credentials | contacts | faq | sops | ppe | radio | resources | evacuation | fire_safety | accessibility | sustainability | code_of_conduct | custom`.
- **Storage:** `event_guides` (one row per project × persona). JSONB `config` column.
- **CMS:** `/console/projects/[projectId]/guides` — index + `[persona]` editor.
- **Rendering:** `/p/[slug]/guide` (portal) and `/m/guide` (mobile), both auto-scoped to the viewer's session persona via `mapSessionToGuidePersona()`.
- **Component:** `<GuideView>` in `src/components/guides/GuideView.tsx`.

## Environment

`.env.local` keys:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
- `SUPABASE_SERVICE_ROLE_KEY` (for webhooks + admin flows)
- `ANTHROPIC_API_KEY` (for AI assistant)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (for billing + payouts)
- `NEXT_PUBLIC_APP_URL` — apex base URL (e.g. `https://atlvs.pro` in prod, `http://lvh.me:3000` in dev). Used as the canonical origin for sitemaps + as the host base from which subdomains are derived.
- `NEXT_PUBLIC_USE_SUBDOMAINS` — set to `"1"` in prod and (with `lvh.me`) in dev to enable subdomain routing. Leave unset on Vercel preview deploys; the helper falls back to single-host path-prefix mode (`/console`, `/p`, `/m`).

### Local dev with subdomains

Use `lvh.me` (resolves to `127.0.0.1`, no `/etc/hosts` edits needed):

- Apex: `http://lvh.me:3000`
- ATLVS: `http://atlvs.lvh.me:3000`
- GVTEWAY: `http://gvteway.lvh.me:3000`
- COMPVSS: `http://compvss.lvh.me:3000`

Set `NEXT_PUBLIC_APP_URL=http://lvh.me:3000` and `NEXT_PUBLIC_USE_SUBDOMAINS=1` in `.env.local`.

## Deployment

- **Vercel:** security headers + CSP live in `next.config.ts` `headers()`; `vercel.json` only carries legacy-domain redirects. Add `atlvs.pro`, `www.atlvs.pro`, `app.atlvs.pro`, `gvteway.atlvs.pro`, `compvss.atlvs.pro` as project domains (all four point to the same deployment; `src/proxy.ts` does the host rewrite).
- **Service worker:** Registered only on `compvss.*` (the offline-first PWA shell). Other shells unregister any prior SW so they don't compete for scope.
- **Proxy (Next 16 middleware):** `src/proxy.ts` runs on non-static paths — host-rewrites subdomains to internal route groups, refreshes Supabase session cookies (with `domain=.atlvs.pro` for SSO across subdomains), enforces rate limits, and applies CORS.

## Repo siblings

- `/Users/julianclarkson/Documents/opus-one/` — gvteway (three-shell, shallow features)
- `/Users/julianclarkson/claude-code/xpb/redsealion/` — FlyteDeck (single-shell, deep features)
- `/Users/julianclarkson/Documents/OPTIMIZED_IA_SITEMAP.md` — source of truth for the shared IA
