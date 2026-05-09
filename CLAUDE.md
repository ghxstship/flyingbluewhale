# CLAUDE.md

Project-specific notes for Claude Code agents working on `flyingbluewhale` (the engineering repo for **LYTEHAUS Technologies** — the brand name visitors see in the marketing site, console chrome, and OG cards).

## Brand

- **Brand name (legal/text)**: `LYTEHAUS Technologies`
- **Brand mark (visible)**: `L Y T E H A U S` — literal spaces in JSX, matches the spaced `G H X S T S H I P` parent-company treatment. Use `aria-label="LYTEHAUS Technologies — home"` so screen readers don't read it letter-by-letter.
- **Apex domain**: `lytehaus.live` — marketing, auth, `/me`, public proposals/offers. The whole platform lives under this apex; `flyingbluewhale` is a _repo nickname only_ and must not appear in any URL, email, identifier, or copy.
- **App subdomains**: `atlvs.lytehaus.live` (console) · `gvteway.lytehaus.live` (portal) · `compvss.lytehaus.live` (field PWA). Host-rewrite middleware in `src/proxy.ts` maps each subdomain to its internal route group (`/console`, `/p`, `/m`).
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
- **Schema:** 33+ tables — identity (`orgs`, `users`, `memberships`), core (`projects`, `tickets`, `ticket_scans`), advancing (`deliverables`, `deliverable_comments`, `deliverable_history`), sales (`clients`, `leads`, `proposals`), finance (`invoices`, `invoice_line_items`, `expenses`, `budgets`, `time_entries`, `mileage_logs`, `advances`), procurement (`vendors`, `requisitions`, `purchase_orders`, `po_line_items`), production (`equipment`, `rentals`, `fabrication_orders`), ops (`tasks`, `events`, `locations`, `crew_members`, `credentials`), AI/system (`ai_conversations`, `ai_messages`, `audit_log`, `notifications`), event guides (`event_guides`).
- **Marketplace canon (migration 0002):** `talent_profiles`, `talent_riders`, `open_calls`, `open_call_submissions`, `talent_offers`, `job_postings`, `job_applications`, `availability_slots`, `reviews`, `saved_searches`, `user_profiles`. Public discovery views: `public_talent_directory`, `public_crew_directory`, `public_vendor_directory`, `public_job_board`, `public_open_calls`, `public_rfq_marketplace` (granted to anon + authenticated). Existing tables extended with public-profile columns: `vendors.is_public_profile/public_handle/...`, `crew_members.is_public_profile/...`, `rfqs.visibility/public_slug/...`, `orgs.marketplace_enabled/marketplace_take_rate_bps`. RLS pattern unchanged: `private.is_org_member` for org-scoped writes; public select policies gated on `status='published'` or `is_public=true`.
- **RLS:** Enforced on every table. `is_org_member(org_id)` and `has_org_role(org_id, roles[])` are the canonical helpers.
- **Seed:** `demo` org with existing auth users as owners. MMW26 Hialeah project with a guest-facing event guide.
- **Migrations:** In `supabase/migrations/`. Apply via the Supabase MCP `apply_migration` — do not hand-edit the remote DB.
- **Lifecycle naming discipline (LDP):** New schema-bearing columns MUST be named `*_phase` (sequential macro arc) or `*_state` (cyclical operational), per `LIFECYCLE_DECOMPOSITION_PROTOCOL.md` §NAMING DISCIPLINE. **`status` is banned in new tables** — every `status` column is a defect candidate at schema review. Eight canonical lifecycles, with their LYTEHAUS column homes: `xpms_phase` (project), `production_phase` (fabrication_orders), `ual_state` (asset_movements), `deliverable_status` (deliverables — pending rename), `uis_lifecycle_state` (uis_roles — engagement, per Party × Project × channel), `offer_letter_status` (engagement-document, including COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED), `accounting_period_state` (accounting_periods.state), `subscription_state` (subscriptions). See `docs/XPMS_TO_LYTEHAUS_MAPPING.md` for the conceptual ⇄ implementation translation, `docs/E2E_LRP_PRESET.md` for the durable Q1–Q6 answers for future protocol runs, and `reports/LDP_LIFECYCLE_AUDIT.md` for current conformance per table.

## Conventions

- **Route pattern:** `/<resource>` (list) · `/<resource>/new` (create) · `/<resource>/[id]` (detail).
- **Server actions:** `"use server"` in `actions.ts` next to the page. Shape: `export type State = { error?: string } | null;` — feeds `useActionState`.
- **Forms:** Use `<FormShell action={...}>` from `src/components/FormShell.tsx` for the standard layout + error surface.
- **Data fetching:** Server components use `listOrgScoped(table, orgId)` / `getOrgScoped(table, orgId, id)` from `src/lib/db/resource.ts`.
- **External portal prefix:** `/p/[slug]/...` (internal route). Don't add external features to `/console/*`.
- **Cross-shell URLs:** Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode `https://...lytehaus.live` and never concat `NEXT_PUBLIC_APP_URL` with `/console`/`/p`/`/m`. The helper is the single switch between subdomain mode and path-prefix fallback (preview deploys). Examples: `urlFor("platform", "/projects/abc")`, `urlFor("portal", "/mmw26/guide")`, `urlFor("auth", "/login")`.
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
- **Code anchor:** schema in `supabase/migrations/0002_marketplace_canon.sql`; shared types + helpers in `src/lib/marketplace.ts`; new-table queries use `as unknown as LooseSupabase` from `src/lib/supabase/loose.ts` until `npm run gen:types` regenerates the typed client.

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
- `NEXT_PUBLIC_APP_URL` — apex base URL (e.g. `https://lytehaus.live` in prod, `http://lvh.me:3000` in dev). Used as the canonical origin for sitemaps + as the host base from which subdomains are derived.
- `NEXT_PUBLIC_USE_SUBDOMAINS` — set to `"1"` in prod and (with `lvh.me`) in dev to enable subdomain routing. Leave unset on Vercel preview deploys; the helper falls back to single-host path-prefix mode (`/console`, `/p`, `/m`).

### Local dev with subdomains

Use `lvh.me` (resolves to `127.0.0.1`, no `/etc/hosts` edits needed):

- Apex: `http://lvh.me:3000`
- ATLVS: `http://atlvs.lvh.me:3000`
- GVTEWAY: `http://gvteway.lvh.me:3000`
- COMPVSS: `http://compvss.lvh.me:3000`

Set `NEXT_PUBLIC_APP_URL=http://lvh.me:3000` and `NEXT_PUBLIC_USE_SUBDOMAINS=1` in `.env.local`.

## Deployment

- **Vercel:** `vercel.json` sets security headers + API no-cache. Add `lytehaus.live`, `www.lytehaus.live`, `atlvs.lytehaus.live`, `gvteway.lytehaus.live`, `compvss.lytehaus.live` as project domains (all four point to the same deployment; `src/proxy.ts` does the host rewrite).
- **Service worker:** Registered only on `compvss.*` (the offline-first PWA shell). Other shells unregister any prior SW so they don't compete for scope.
- **Proxy (Next 16 middleware):** `src/proxy.ts` runs on non-static paths — host-rewrites subdomains to internal route groups, refreshes Supabase session cookies (with `domain=.lytehaus.live` for SSO across subdomains), enforces rate limits, and applies CORS.

## Repo siblings

- `/Users/julianclarkson/Documents/opus-one/` — gvteway (three-shell, shallow features)
- `/Users/julianclarkson/claude-code/xpb/redsealion/` — FlyteDeck (single-shell, deep features)
- `/Users/julianclarkson/Documents/OPTIMIZED_IA_SITEMAP.md` — source of truth for the shared IA
