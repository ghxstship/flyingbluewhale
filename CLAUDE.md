# CLAUDE.md

Project-specific notes for Claude Code agents working on `flyingbluewhale` (the engineering repo for **ATLVS Technologies** — the brand name visitors see in the marketing site, console chrome, and OG cards).

## Brand

- **Brand name (legal/text)**: `ATLVS Technologies`
- **Brand mark (visible)**: `A T L V S` — literal spaces in JSX, matches the spaced `G H X S T S H I P` parent-company treatment. Use `aria-label="ATLVS Technologies — home"` so screen readers don't read it letter-by-letter.
- **Apex domain**: `atlvs.pro` — marketing, auth, `/me`, public proposals/offers. The whole platform lives under this apex; `flyingbluewhale` is a _repo nickname only_ and must not appear in any URL, email, identifier, or copy.
- **App subdomains**: `app.atlvs.pro` (console) · `gvteway.atlvs.pro` (portal) · `compvss.atlvs.pro` (field PWA). Host-rewrite middleware in `src/proxy.ts` maps each subdomain to its internal route group (`/console`, `/p`, `/m`).
- **Sub-products (v5 roles)** — four apps, one record store, one design system:
  - **ATLVS** (pink `#FF2E88`, the `/console`) — _Experiential Productions: ERP × CRM × PM._ The superset operator console: Sales & CRM **plus** all executive-level Project / Program / Venue / Design / Estimating / Governance / Production / Finance / Procurement / **Asset & Logistics** management. Internal org users + project-scoped external users.
  - **COMPVSS** (amber `#E9A23B`, the `/m` field PWA + venue-ops surface) — _Site & Venue Operations._ ConnectTeam-class field/venue workforce ops for internal + external orgs.
  - **GVTEWAY** (blue `#2563EB`, the `/p` portal + public marketplace) — _Public Interface & Marketplace._ Every public/engagement surface: tickets, stores, directory, jobs, peer-to-peer, RFPs, + the host & commerce console. _(Recolored cyan→blue in kit v5.1.)_
  - **LEG3ND** (Production Orange `#E8500A`, the `/console/legend/*` Knowledge surface) — _Knowledge · LMS · Resources_ on the **XPMS 2.0 protocol_**: The Standard (knowledge base), Courses & LMS, Certifications, Resources hub, Catalog (priced atoms/URIDs), **Signage library** (the sole pictogram set is the **60 public-domain AIGA / U.S. DOT symbol signs** — `public/brand/pictograms.svg`, all `aiga-*` ids, each normalized to a 48×48 box with `#000`→`currentColor`; the legacy house `p-*` glyphs are **retired/removed**; metadata index `src/lib/signage_pictograms.ts`. Every signage surface colors from the sign's **category → airport tone** (`CATEGORY_TONE` in `src/lib/legend_signage.ts`) → the `--sign-{tone}-field`/`-legend` tokens — `PictogramPreview` is a function-colored chip, `<SignPanel>` is the full sign; no ad-hoc colorway tinting. **Two-color rule**: every sign is exactly POSITIVE (the symbol, `currentColor` = the tone legend) + NEGATIVE (the field AND the symbol's own counters, via the `--sign-knock` custom property = the tone field) — no third color; the sprite is authored with only `currentColor` + `var(--sign-knock)` (guarded), and the tone containers set `--sign-knock` to the field. The `--sign-*` color/legibility/anatomy token layer is `src/app/theme/kit-signage.css` — SSOT mirrored in `tokens.json#signage`, guarded by `src/lib/theme/signage-tokens.test.ts` — rendered by `src/components/signage/{SignIcon,SignPanel}.tsx`; the licensed Frutiger/Airport face is **not** redistributed, `--sign-font` degrades to the legend fallback), **XMCE compliance engine**, Safety. Wordmark `L E G 3 N D` (the `3` in accent).
  - Sub-brand names + colors are fixed; do not rename or recolor.
- **Typography (MONUMENT, ratified 2026-06-13)**: display/headings/metrics = **Anton** (single black weight, no width axis, rendered ALL-CAPS via `--p-display-case`); body/UI = **Hanken Grotesk**; eyebrows/IDs/mono = **Space Mono**; wordmark lockup only = **Jost**. Supersedes the v2 "Industrial Wide" (Archivo + Space Grotesk) stack — those faces, plus Inter/JetBrains Mono, are retired and guarded by `src/app/design-system.test.ts`.
- **Type axis (`data-type`, v5)**: `monument` (default — the stack above) ↔ `legend` (the LEG3ND airport-signage type: **Airport** display + **Airport X** text — _licensed_, Revolver Type; mount via `@font-face` + `/fonts` — degrading to **Fira Sans** / Helvetica until then — and **IBM Plex Mono** data, Title Case). Persisted like the accent axis; the LEG3ND surface sets `data-type="legend"` on its subtree. Five theming axes total: product · mode · density · accent · type.
- **Design SSOT**: the **kit v6.4 (parity-certified)** (`design_handoff_atlvs_kit`) is the design reference; the repo is the implementation. **`src/app/theme/tokens.json` (v6.4 "Monument") is the single hand-authored token source of truth** — the generated theme `src/app/theme/themes/atlvs-product.css` (the `--p-*` namespace) is its derivative, and `src/lib/theme/tokens-contract.test.ts` guards that the two can't silently fork. **v6.4 is the BRIGHTWORK kit↔repo alignment**: it certifies `tokens.json` == the generated theme (one token vocabulary — the legacy `--bg/--surface/--accent/--org-*/--radius-*` parallel namespace was deleted from the cold-start fallbacks), promotes the AA accent layer into `tokens.json` (`accent-text`/`accent-cta`/`accent-cta-contrast`/`focus` per product × mode, all WCAG-AA, including the 4th product **LEG3ND**), fixes tertiary text to AA (`--p-text-3` `#656D7A` light / `#9098A4` dark), rebinds `Badge.tsx` to the canonical `.ps-badge--{ok,warn,danger,info,neutral,accent}` classes (the retired `.badge-*` vocabulary was dead), routes the focus ring through `--p-focus`, exposes the `cta` Button variant (`.ps-btn--cta`), reconciles the density axis to **`compact`/`cozy`/`spacious`** (default cozy) and retunes it page-wide via the `--k-*` tokens, and adds the machine-checkable contrast guard `src/lib/theme/contrast.test.ts` (reads `tokens.json#contrast`, fails CI below AA). The cross-app **Documents system** (`kit-documents.css` format layer + `data-path` merge contract + `data-brand` white-label modes) carries **29** doc types (v6.1 added `itinerary` + `staffing`; v6.2 added the `rentals` + `workforce` reference surfaces and closed the `pull-sheet` / `state-xml` endpoints). v6.3 adds the cross-app **Reports & Analytics engine** (`kit-reports.css` viz layer reading only `--p-*`; metric registry SSOT at `src/lib/reports/metrics.json`) — see "Reports & Analytics (v6.3)" below. The retired cosmic GHXSTSHIP token export (Big Shoulders / Space Grotesk / Silkscreen / void-ink / voyage register / RRR project IDs) and the XPMS dual-nav + `/ghxstship` cosmic route are deleted — do not reintroduce.
- **Voice canon**: see `feedback_marketing_voice.md` in memory — definitive, luxury self-confidence with hacker irreverence. Never compare to competitors.

## Overview

Unified production platform scaffolded against the optimized IA shared with FlyteDeck (redsealion) and gvteway (opus-one). See `docs/ia/01-topology.md` for the full IA and `docs/decisions/ADR-0001-three-shell-topology.md` for the rationale.

## Shells

Six route groups, three of them are full shells with distinct layouts:

- `(marketing)` — public, SEO, unauthenticated.
- `(auth)` — login, signup, invites. Posts to `/auth/resolve` which redirects based on persona.
- `(personal)` — `/me`, any authed user.
- `(platform)` — `/console`, internal operations. Left sidebar driven by `src/lib/nav.ts#platformNav`. `data-platform="atlvs"` (pink).
- `(portal)` — `/p/[slug]/<persona>`. `data-platform="gvteway"` (cyan). Slug is the authorization boundary.
- `(mobile)` — `/m`. `data-platform="compvss"` (amber). Offline-first PWA.

## Design system

- **Fonts (MONUMENT):** Anton (display) + Hanken Grotesk (body) + Space Mono (eyebrow/mono) + Jost (wordmark) via `next/font`.
- **Tokens:** Defined in `src/app/globals.css` under `@theme inline`. Light/dark via `data-theme` on `<html>`. Brand overlay via `data-platform`.
- **Primitives:** `Button`, `Input`, `Badge`, `Avatar`, `ProgressBar`, `ThemeToggle`, `Card`, `MetricCard`, `EmptyState`, `StatusBadge` in `src/components/ui/`.
- **Shell helpers:** `ModuleHeader`, `PlatformSidebar`, `PortalRail`, `MobileTabBar`, `AuthCard`, `MarketingHeader`, `PageSkeleton` in `src/components/Shell.tsx`. (`PageStub` was retired in the 2026-06-09 audit — new routes build real pages.)
- **Utilities:** `.surface`, `.surface-raised`, `.surface-inset`, `.elevation-{1..4}`, `.hover-lift`, `.press-scale`, `.metric-grid`, `.data-table`, `.nav-item`, `.glass-nav`, `.skeleton`.

## Documents system (v6)

The 29 v6 document types (v6.2) (format layer `src/app/theme/kit-documents.css`) are fully wired end-to-end:

- **Templates:** `src/lib/documents/registry.ts` — 29 `DocTemplate` descriptors over the shared engine `src/components/documents/DocEngine.tsx` (v6.2 added `itinerary` + `staffing`). Every merge field carries a `data-path` (dotted JSON pointer).
- **Contract (auto-derived):** `src/lib/documents/contract.ts` derives, per template, the merge-field `paths`, a nested `sample` object, and a JSON Schema — straight from the registry, so the contract can never drift from what a template renders. Namespaces mixing line-item indices with summary fields (e.g. `invest.0.amount` + `invest.subtotal`) are supported.
- **Data binding:** `<DocRenderer data={...}>` resolves each field from the data object at `path`, falling back to the template sample. `src/lib/documents/render-html.ts` is the no-React string renderer (route handlers can't use `react-dom/server`) emitting the identical `.doc`/`.mf` markup.
- **Record-backing (100%):** `src/lib/documents/resolvers.ts` maps a real org-scoped record → the doc data object for **all 29** types. Most bind existing tables (proposal→proposals, invoice→invoices, agreement/vendoragreement→contracts, ticket→assignments, etc.); six got dedicated tables in migration `20260615215535_document_backing_tables` (`change_orders`, `show_recaps`, `run_of_shows`, `rams_assessments`, `sops`, `emergency_response_plans` — LDP `*_state` enums, RLS, demo seed; in the typed client after the `database.types.ts` regen).
- **API (OpenAPI-described, internal + 3rd-party):** `GET /api/v1/documents` (list + record-binding flags), `GET /api/v1/documents/{docType}` (JSON Schema + sample + paths), `POST /api/v1/documents/{docType}` (`{ data }` external or `{ recordId }` internal → rendered `.doc` HTML). Gated by `documents:read`/`documents:write` PAT scopes; documented in `docs/api/openapi.yaml` (drift-guarded).
- **Console:** `/console/documents` hub + `/console/documents/[docType]` preview/print (`?recordId=` binds a live record). Detail pages link out via "Document" (proposals, invoices). Guards: `src/lib/documents/contract.test.ts`, `render-html.test.ts`, `e2e/documents-v6.spec.ts`, `e2e/documents-api.spec.ts`.

## Reports & Analytics (v6.3)

The cross-app reporting engine. Mirrors the documents system (registry → engine → resolvers → API → console), but reports are **computed live, never stored** — no migration. Viz CSS layer `src/app/theme/kit-reports.css` (imported from `theme/index.css` after `kit-documents.css`) reads only `--p-*` tokens and is print-clean (`print-color-adjust:exact`).

- **Registry (SSOT):** `src/lib/reports/metrics.json` (vendored from the kit) — **77 metrics** (id-keyed: `{app,label,unit,format,grain,direction,target?,formula,sources}`) + **43 reports** (id-keyed: `{app,title,doc,cadence,print,kind,metrics[],status}`). `src/lib/reports/registry.ts` types + loads it and exports `METRICS`/`REPORTS`/`REPORTS_LIST`/`REPORTS_BY_APP`/`getReport`/`getMetric` and `formatMetricValue(value, def)` (currency→$/K/M, pct→%, days→d, ratio→×, score/int/float; `null`→"—"). Reports split **8 turnkey templates** (`status:"template"`) + **35 preconfigured**.
- **Engine:** `src/components/reports/ReportEngine.tsx` — `ReportRenderer` emits `.rpt-stage > .doc.doc--report[data-doc="report:<id>"][data-brand]` with a doc-head masthead, a `.rpt-summary` (first 4 KPIs) and a `.rpt-grid` of `KpiTile`s. Each tile's value is a merge field (`<span class="mf" data-path="metric.<id>.value">`), with a delta pill (`delta--inv` flips good/bad for `direction:"down"` metrics), a spark series, or a bullet-vs-target. `src/components/reports/ReportToolbar.tsx` is the client wrapper (brand toggle atlvs/co/white + Print/PDF).
- **Resolvers (real org data):** `src/lib/reports/resolvers/{atlvs,compvss,gvteway,legend}.ts` compute each metric org-scoped from live tables; `resolveMetrics(orgId, ids)` (in `index.ts`, `server-only`) combines them with per-metric try/catch→`null`. Honest coverage: ~52/77 metrics compute real values; the rest return `null`→"—" where no backing table exists (never fabricated). Unit conventions: currency in dollars, pct as 0–100.
- **API (OpenAPI-described, `reports:read` scope):** `GET /api/v1/metrics` (catalog + computed flag), `GET /api/v1/metrics/{metricId}` (def + resolved value), `GET /api/v1/reports` (library), `GET /api/v1/reports/{reportId}` (report + resolved metrics), `GET /api/v1/reports/{reportId}/snapshot` (+ `capturedAt`). Documented in `docs/api/openapi.yaml` (drift-guarded).
- **Console:** `/console/reports` hub (43-report library grouped by app, turnkey-template dot) + `/console/reports/[reportId]` parametric viewer (metrics resolved live, org/client white-label brand applied, print/PDF artifact). Nav entry in the Dashboard group (`src/lib/nav.ts`). Both render inside the auth-gated `(platform)` layout, so the hub is **dynamic** (not `force-static` — that bakes in the unauthenticated redirect). Guards: `src/lib/reports/registry.test.ts`, `e2e/reports-v63.spec.ts` (hub + all 43 renders + API).

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
- **Nav:** `src/lib/nav.ts` is the SSOT for **every** shell's navigation — the platform rails (`platformNav`), portal (`portalNav`), mobile (`mobileTabs`/`mobileSurfaces`/`ROLE_TABS`), **and** the self-nav shells (`marketingHeaderGroups`/`marketingFooterGroups` drive `MarketingHeader`/the marketing footer; `personalNavGroups` drives the `/me` tabs). When adding a route, wire it into the right nav export — or, if it's intentionally not navigable (token/auth/locale/redirect), add it to `EXEMPT` in `scripts/generate-sitemap.mjs` with a reason.
- **Sitemap SSOT:** `docs/ia/SITEMAP.md` is the generated route-surface SSOT (`npm run gen:sitemap`; `gen:sitemap:check` is the drift gate). It reconciles the filesystem against `nav.ts` and must show **0 orphans / 0 dangling / 0 dead priority refs** — guarded by `src/lib/ia/sitemap.test.ts` (runs in pre-push). Plan/history: `docs/ia/SITEMAP_RECONCILIATION.md`.
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
