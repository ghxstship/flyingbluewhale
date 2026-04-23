# Phase 0 — Repository Discovery

**Repository:** `flyingbluewhale`
**Branch:** `main`
**HEAD:** `72f45e750ee08e864268e88429ca9c2b01917c59` — *feat(marketing): restore utility cluster (palette + locale + mode) to header*
**Working tree:** clean
**Date:** 2026-04-22

---

## Surfaces (what the repo ships)

Six Next.js App Router route groups + top-level utility routes. Each route group has its own layout.tsx and shell conventions.

| # | Surface | Route group | Entry | Purpose |
|---|---|---|---|---|
| 1 | Marketing | `src/app/(marketing)/` | `page.tsx` | Public SEO-indexed landing — solutions, features, pricing, community, resources |
| 2 | Auth | `src/app/(auth)/` | `login/`, `signup/`, `magic-link/`, `reset-password/`, `verify-email/`, `accept-invite/[token]/` | Pre-session flows; shared [AuthShell](src/components/auth/AuthShell.tsx) |
| 3 | Personal (`/me`) | `src/app/(personal)/me/` | `page.tsx` | Any authed user — profile, settings, notifications, organizations, tickets |
| 4 | Platform / ATLVS | `src/app/(platform)/console/` | `page.tsx` | Internal operations console. `data-platform="atlvs"` red brand |
| 5 | Portal / GVTEWAY | `src/app/(portal)/p/[slug]/` | `page.tsx` (+ `artist/`, `client/`, `vendor/`, `sponsor/`, `guest/`, `crew/`, `guide/`, `overview/`) | External stakeholder portals — slug is the auth boundary. `data-platform="gvteway"` blue |
| 6 | Mobile / COMPVSS | `src/app/(mobile)/m/` | `page.tsx` | Offline-first PWA for field ops. `data-platform="compvss"` amber |

**Non-shell routes at app root:**
- `src/app/auth/` — `callback/route.ts` (OAuth code exchange), `resolve/route.ts` (persona dispatcher), `signout/route.ts`
- `src/app/api/v1/` — 31 resource namespaces (`ai`, `auth`, `brand-kit`, `compliance`, `credentials`, `deliverable-templates`, `deliverables`, `dev-probe-page`, `email-templates`, `equipment`, `expenses`, `exports`, `guides`, `health`, `import`, `incidents`, `invoices`, `me`, `notifications`, `procurement`, `projects`, `proposals`, `rentals`, `schedule.ics`, `stage-plots`, `stripe`, `telemetry`, `tickets`, `users`, `webhooks`)
- `src/app/proposals/[token]/` — public signed-proposal viewer (outside every shell, token-gated)
- `src/app/og/route.tsx` — dynamic OG image generator
- `src/app/sitemap.ts`, `robots.ts` — SEO

**DISCREPANCY:** `CLAUDE.md` documents `src/middleware.ts` for Supabase session refresh. **File does not exist.** Either the doc is stale or session refresh is missing. Flagged as OPEN QUESTION #1.

---

## Roles (from [supabase/migrations/20260416_000001_identity_tenancy.sql:7-14](supabase/migrations/20260416_000001_identity_tenancy.sql))

```sql
create type platform_role as enum (
  'developer','owner','admin','controller','collaborator',
  'contractor','crew','client','viewer','community'
);
create type project_role as enum ('creator','collaborator','viewer','vendor');
create type tier as enum ('portal','starter','professional','enterprise');
```

**Personas** ([src/lib/auth.ts:67-84](src/lib/auth.ts) `personaForRole()`): derived mapping from platform_role → UI persona:

| platform_role | persona | shell via `resolveShell()` |
|---|---|---|
| `owner` | owner | `/console` |
| `admin` | admin | `/console` |
| `controller` | controller | `/console` |
| `collaborator` | project_manager | `/console` |
| `contractor` | vendor | `/p` |
| `crew` | crew | `/m` |
| `client` | client | `/p` |
| `developer` | developer | `/console` |
| `viewer` | guest | `/me` |
| `community` | guest | `/me` |

Portal personas additional enum at portal layer include `artist` and `sponsor` (via directory structure at `(portal)/p/[slug]/artist/`, `.../sponsor/`) — inferred from route presence; no explicit DB enum.

**Capabilities matrix:** `src/lib/auth.ts` `CAPABILITIES` const — `owner` + `admin` = `["*"]`; `controller` = finance + ops scope; `collaborator` = projects + advancing; `contractor`, `crew`, `client`, `viewer`, `community` = scoped read-heavy.

---

## Lifecycle entities

From the 29 applied migrations, the entities relevant to the UJV lifecycle are:

| Stage | Entities | State-machine fields |
|---|---|---|
| Identity / tenancy | `orgs`, `users`, `memberships`, `invites` | `orgs.tier`, `memberships.role`, `invites.status` (pending/accepted/revoked) |
| Projects | `projects`, `events`, `locations` | `projects.status` (enum from `000002_projects.sql`) |
| Team | `crew_members`, `credentials`, `memberships` | `memberships.role`, `credentials` |
| Advancing / deliverables | `deliverables` (16 standard types), `deliverable_comments`, `deliverable_history` | `deliverables.status` (draft/sent/received/approved/complete) |
| Tickets | `tickets`, `ticket_scans` | `tickets.status` (issued/scanned/void/refunded) |
| Finance | `invoices`, `invoice_line_items`, `expenses`, `budgets`, `time_entries`, `mileage_logs`, `advances` | `invoices.status` (draft/sent/paid/overdue), `expenses.status` (submitted/approved/reimbursed) |
| Procurement | `vendors`, `requisitions`, `purchase_orders`, `po_line_items` | `purchase_orders.status` (draft/approved/fulfilled/closed) |
| Production | `equipment`, `rentals`, `fabrication_orders` | `rentals.status` (reserved/out/returned) |
| Sales / proposals | `clients`, `leads`, `proposals`, `proposal_share_links` | `proposals.status` (draft/sent/signed/declined) |
| Event guides (KBYG) | `event_guides` | `event_guides.status` (draft/published/archived) |
| System | `audit_log`, `notifications`, `ai_conversations`, `ai_messages`, `export_runs`, `job_queue`, `usage_events` | job + usage states |

**Archive:** no dedicated archive flag — `deleted_at` soft-delete columns on most tables; "final reconciliation" maps to invoice `paid`/`overdue` + proposal `signed`/`declined` transitions + `audit_log` retention.

---

## Auth flows

| Flow | Entry | Server action | Redirect target |
|---|---|---|---|
| Email signup | `/signup` → `SignupForm.tsx` | `signupAction` in [src/app/(auth)/actions.ts](src/app/(auth)/actions.ts) | `/verify-email?email=…` if confirmation required, else `/auth/resolve` |
| Email verify | Magic link → Supabase `/auth/v1/verify` | → `/auth/callback?next=/auth/resolve` | `/auth/resolve` → shell |
| Email login | `/login` → `LoginForm.tsx` | `loginAction` | `/auth/resolve` |
| OAuth (Google/GitHub/Microsoft) | `OAuthButtons` → `/api/v1/auth/oauth?provider=…` | `supabase.auth.signInWithOAuth` | provider → `/auth/callback?next=/auth/resolve` |
| Magic link | `/magic-link` → `MagicLinkForm.tsx` | `magicLinkAction` (`signInWithOtp`, `shouldCreateUser: false`) | email → `/auth/callback?next=/auth/resolve` |
| Forgot password | `/forgot-password` → `ForgotPasswordForm.tsx` | `forgotPasswordAction` (`resetPasswordForEmail`) | email → `/auth/callback?next=/reset-password` |
| Reset password | `/reset-password` (post-callback) → `ResetPasswordForm.tsx` | `resetPasswordAction` (`updateUser`) | `/auth/resolve` |
| Invite accept | `/accept-invite/[token]` → `AcceptInviteForm.tsx` | `acceptInviteAction` | `/auth/resolve` |
| Logout | `/auth/signout` POST | `logoutAction` | `/` |
| Persona dispatch | `/auth/resolve` ([route.ts](src/app/auth/resolve/route.ts)) | reads session + emits audit + `resolveShell()` | `/console` / `/p/…` / `/m` |

**Missing / gap-risk:**
- SSO (SAML/OIDC) — advertised on `/pricing` as Enterprise; no `/sso/*` route present; `supabase.auth.signInWithSSO` not called anywhere. **OPEN QUESTION #2.**
- SCIM provisioning — advertised; no `/api/v1/scim/*` route. **OPEN QUESTION #3.**
- Passkeys — `@simplewebauthn/server` in deps + `FLAG_DEFAULTS.passkeys: false` — gated off. **Not tested.**

---

## Tooling (commands verified against `package.json`)

| Command | Purpose | Discovered |
|---|---|---|
| `npm run dev` | Local dev | ✓ |
| `npm run build` | Production build | ✓ |
| `npm run typecheck` | `tsc --noEmit` | ✓ |
| `npm run lint` | `eslint .` | ✓ |
| `npm run test` | `vitest run` (108 tests) | ✓ 15 test files |
| `npm run e2e` | `playwright test` | ✓ — Playwright config + specs present |
| `npm run format` | Prettier | ✓ |

Migrations apply via Supabase MCP (`apply_migration`) per CLAUDE.md convention. Local seed via `supabase/migrations/20260416_000006_seed.sql` + any post-migration seed scripts.

---

## External dependencies

| Service | Required by | Env key | Local env status |
|---|---|---|---|
| Supabase (Postgres + Auth + Storage) | Everything | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `anon_key` + `url` **SET**; service_role **NOT SET** |
| Anthropic | `/api/v1/ai/chat` + AI assistant UI | `ANTHROPIC_API_KEY` | **NOT SET** |
| Stripe | `/api/v1/stripe/*`, `/api/v1/webhooks/stripe`, invoice payments, Connect payouts | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | **NOT SET** |
| Resend | Transactional email (invite, proposal share, reset) | `RESEND_API_KEY`, `RESEND_FROM` | **NOT SET** — `sendEmail` no-ops with `hasResend === false` |
| GrowthBook | Feature flags | `NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY` | **NOT SET** — falls back to `FLAG_DEFAULTS` |
| Sentry | Error tracking | `NEXT_PUBLIC_SENTRY_DSN` | **NOT SET** — `hasSentry === false` |

**Implication for Phase 2:** flows that depend on Stripe, Resend, Anthropic, or service-role Supabase access will be **BLOCKED** end-to-end from this environment. Code paths + server-action wiring can still be verified, but full execution against a live third party is not possible without populating `.env.local`.

---

## Open questions (must be resolved before Phase 1 OR acknowledged as waived)

| # | Question | Impact |
|---|---|---|
| 1 | ~~`src/middleware.ts` missing~~ **RESOLVED** — session refresh lives in `src/proxy.ts` (Next.js 15+ proxy-convention). CLAUDE.md "middleware.ts" wording is stale docs. Not a bug. | Doc-only; P3. |
| 2 | Enterprise SSO (SAML/OIDC) — referenced in pricing copy; no implementation. Acceptable as "coming soon", or expected to ship? | P1 if advertised as current feature; marketing may need to trim until shipped. |
| 3 | SCIM user provisioning — same as #2. | P1 same basis. |
| 4 | `sponsor` + `artist` portal personas — routes exist in `src/app/(portal)/p/[slug]/sponsor/` and `.../artist/` but no corresponding platform_role enum value. Who gets access and how? | P1 if portal auth can't distinguish sponsors/artists from generic clients. |
| 5 | `.env.local` has only Supabase URL + anon key. Service-role + third-party keys unset. Are we expected to populate them for Phase 2 e2e, or scope Phase 2 to what's reachable without them? | Blocks full execution. Phase 2 will scope accordingly and flag gaps. |

---

## Phase 0 exit

- Surfaces, roles, entities, auth flows, tooling, external deps — all **enumerated from code** with file-path citations.
- 5 open questions listed.
- Per user's explicit "execute" instruction, proceeding to Phase 1 with open questions **logged but not blocking**. Items 1-4 will be tested in Phase 2 and remediated where within scope; item 5 will gate Phase 2 external-dep cells.
