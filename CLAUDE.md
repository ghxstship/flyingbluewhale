# CLAUDE.md

Project-specific notes for Claude Code agents working on `flyingbluewhale` (the engineering repo for **LYTEHAUS Technologies** — the brand name visitors see in the marketing site, console chrome, and OG cards).

## Brand

- **Brand name (legal/text)**: `LYTEHAUS Technologies`
- **Brand mark (visible)**: `L Y T E H A U S` — literal spaces in JSX, matches the spaced `G H X S T S H I P` parent-company treatment. Use `aria-label="LYTEHAUS Technologies — home"` so screen readers don't read it letter-by-letter.
- **Apex domain**: `lytehaus.tech` — marketing, auth, `/me`, public proposals/offers. The whole platform lives under this apex; `flyingbluewhale` is a _repo nickname only_ and must not appear in any URL, email, identifier, or copy.
- **App subdomains**: `atlvs.lytehaus.tech` (console) · `gvteway.lytehaus.tech` (portal) · `compvss.lytehaus.tech` (field PWA). Host-rewrite middleware in `src/proxy.ts` maps each subdomain to its internal route group (`/console`, `/p`, `/m`).
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
- **RLS:** Enforced on every table. `is_org_member(org_id)` and `has_org_role(org_id, roles[])` are the canonical helpers.
- **Seed:** `demo` org with existing auth users as owners. MMW26 Hialeah project with a guest-facing event guide.
- **Migrations:** In `supabase/migrations/`. Apply via the Supabase MCP `apply_migration` — do not hand-edit the remote DB.

## Conventions

- **Route pattern:** `/<resource>` (list) · `/<resource>/new` (create) · `/<resource>/[id]` (detail).
- **Server actions:** `"use server"` in `actions.ts` next to the page. Shape: `export type State = { error?: string } | null;` — feeds `useActionState`.
- **Forms:** Use `<FormShell action={...}>` from `src/components/FormShell.tsx` for the standard layout + error surface.
- **Data fetching:** Server components use `listOrgScoped(table, orgId)` / `getOrgScoped(table, orgId, id)` from `src/lib/db/resource.ts`.
- **External portal prefix:** `/p/[slug]/...` (internal route). Don't add external features to `/console/*`.
- **Cross-shell URLs:** Always use `urlFor(shell, path)` from `@/lib/urls` — never hardcode `https://...lytehaus.tech` and never concat `NEXT_PUBLIC_APP_URL` with `/console`/`/p`/`/m`. The helper is the single switch between subdomain mode and path-prefix fallback (preview deploys). Examples: `urlFor("platform", "/projects/abc")`, `urlFor("portal", "/mmw26/guide")`, `urlFor("auth", "/login")`.
- **API:** All endpoints under `/api/v1/*`. Use `apiOk`, `apiCreated`, `apiError`, `parseJson` from `@/lib/api`. Guard with `withAuth` from `@/lib/auth`. Zod-validate all inputs at the boundary.
- **Nav:** When adding a platform module, also add it to `src/lib/nav.ts#platformNav`.
- **Stubs:** New routes are added via `scripts/routes.txt` + `bash scripts/generate-stubs.sh`. The generator is idempotent.

## Integrations

- **Anthropic (AI):** `src/app/api/v1/ai/chat/route.ts` — streaming chat via `@anthropic-ai/sdk` with `claude-sonnet-4-6` / `claude-opus-4-7`. Conversation + messages persisted in `ai_conversations` / `ai_messages`.
- **Stripe:** Webhook receiver at `/api/v1/webhooks/stripe` — HMAC-SHA256 signature verification (no SDK dep). Checkout at `/api/v1/stripe/checkout`. Connect Express onboarding at `/api/v1/stripe/connect/onboarding`.
- **Supabase Storage:** Buckets `advancing`, `receipts`, `proposals`, `credentials`, `branding`. Deliverable downloads via signed URLs at `/api/v1/deliverables/[id]/download`.

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
- `NEXT_PUBLIC_APP_URL` — apex base URL (e.g. `https://lytehaus.tech` in prod, `http://lvh.me:3000` in dev). Used as the canonical origin for sitemaps + as the host base from which subdomains are derived.
- `NEXT_PUBLIC_USE_SUBDOMAINS` — set to `"1"` in prod and (with `lvh.me`) in dev to enable subdomain routing. Leave unset on Vercel preview deploys; the helper falls back to single-host path-prefix mode (`/console`, `/p`, `/m`).

### Local dev with subdomains

Use `lvh.me` (resolves to `127.0.0.1`, no `/etc/hosts` edits needed):

- Apex: `http://lvh.me:3000`
- ATLVS: `http://atlvs.lvh.me:3000`
- GVTEWAY: `http://gvteway.lvh.me:3000`
- COMPVSS: `http://compvss.lvh.me:3000`

Set `NEXT_PUBLIC_APP_URL=http://lvh.me:3000` and `NEXT_PUBLIC_USE_SUBDOMAINS=1` in `.env.local`.

## Deployment

- **Vercel:** `vercel.json` sets security headers + API no-cache. Add `lytehaus.tech`, `www.lytehaus.tech`, `atlvs.lytehaus.tech`, `gvteway.lytehaus.tech`, `compvss.lytehaus.tech` as project domains (all four point to the same deployment; `src/proxy.ts` does the host rewrite).
- **Service worker:** Registered only on `compvss.*` (the offline-first PWA shell). Other shells unregister any prior SW so they don't compete for scope.
- **Proxy (Next 16 middleware):** `src/proxy.ts` runs on non-static paths — host-rewrites subdomains to internal route groups, refreshes Supabase session cookies (with `domain=.lytehaus.tech` for SSO across subdomains), enforces rate limits, and applies CORS.

## Repo siblings

- `/Users/julianclarkson/Documents/opus-one/` — gvteway (three-shell, shallow features)
- `/Users/julianclarkson/claude-code/xpb/redsealion/` — FlyteDeck (single-shell, deep features)
- `/Users/julianclarkson/Documents/OPTIMIZED_IA_SITEMAP.md` — source of truth for the shared IA
