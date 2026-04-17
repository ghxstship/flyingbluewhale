# Optimized Information Architecture & Site Map

**Scope:** Unified IA applicable to either `redsealion/` (FlyteDeck) or `opus-one/` (gvteway).
**Date:** 2026-04-16
**Framework:** Next.js App Router, Supabase, Stripe, Vercel AI SDK

---

## 1. Comparative Diagnosis

| Dimension | Red Sea Lion (FlyteDeck) | Opus One (gvteway) | Gap / Opportunity |
|---|---|---|---|
| **Shells** | 1 — web app only | 3 — `(platform)` console + `(portal)` external + `(mobile)` PWA | RSL lacks mobile + external portals |
| **Marketing surface** | Full `(marketing)` group (home, pricing, features, blog) | Minimal / missing | Opus lacks marketing |
| **Dashboard pattern** | `(hub)` route group, 20+ domain modules | `/console/<module>` flat pattern | Inconsistent hub pattern across sibling apps |
| **Finance depth** | Invoices, expenses, budgets, time, mileage, advances | Finance implied, shallow | RSL is the reference |
| **Procurement** | POs, requisitions, vendors, payments | Vendors only | RSL is the reference |
| **AI** | Assistant, drafting, automations | None | RSL is the reference |
| **External portals** | `/client-portal`, `/project-portals` (internal-only views) | Slug-based multi-role: artist, vendor, client, sponsor, guest | Opus is the reference |
| **Field operations** | None | COMPVSS mobile + QR check-in/scan | Opus is the reference |
| **Ticketing** | None | `/api/v1/tickets/[id]/scan`, personal `/tickets` | Opus is the reference |
| **RBAC depth** | 10 platform + 4 project roles, 4 tiers | 11 personas, context-based provider | RSL's formalism is stronger; Opus' persona clarity is stronger |
| **API convention** | `/api/<resource>` | `/api/v1/<resource>` with `apiOk/apiError` helpers + Zod | Opus is cleaner — versioned + typed |

**Verdict:** Neither app is complete on its own. The optimized IA adopts **Opus One's three-shell topology** (platform + portal + mobile) and **Red Sea Lion's feature depth** (finance, procurement, AI), normalized to a single `(hub)` pattern with a versioned API.

---

## 2. Canonical Route-Group Topology

```
src/app/
├── (marketing)/          # Public, SEO-indexed, no auth
├── (auth)/               # Unauthenticated flows + invite/magic tokens
├── (personal)/           # Self-service account area — any authenticated user
├── (platform)/           # Internal operations console (was ATLVS / FlyteDeck app)
├── (portal)/             # External stakeholder workspaces (slug-scoped)
├── (mobile)/             # Field PWA (was COMPVSS) — camera, offline, location
└── api/v1/               # Versioned, Zod-validated, withAuth-guarded
```

**Principles:**
1. **Route groups carry no URL segment** — they exist for layout + middleware isolation.
2. **Every module uses a `(hub)` sub-group** for its list/detail/create triad. One pattern, one sidebar shell.
3. **External ≠ internal.** `(portal)` is slug-scoped (`/p/[slug]/...`) and never shares the console sidebar.
4. **Mobile is a separate shell**, not a responsive variant — it has different auth, different nav, different offline rules.
5. **API is versioned** — `/api/v1/...` with `apiOk/apiError/apiCreated` helpers and Zod parsing at the boundary.

---

## 3. Full Site Map

### 3.1 `(marketing)` — Public

```
/                          Home
/pricing                   Tiers: Portal → Starter → Professional → Enterprise
/features                  Feature overview
/features/[module]         Per-module landing (projects, finance, portals, mobile, ai)
/solutions/[industry]      Vertical pages (live-events, fabrication, touring, corporate)
/customers                 Case studies index
/customers/[slug]          Individual case study
/blog                      Blog index
/blog/[slug]               Blog post
/changelog                 Product changelog
/docs                      Public docs landing (links to hosted docs site)
/about                     Company / team
/contact                   Contact + demo request
/legal/terms
/legal/privacy
/legal/dpa
/legal/sla
```

### 3.2 `(auth)` — Unauthenticated

```
/login
/signup
/forgot-password
/reset-password/[token]
/verify-email/[token]
/magic-link/[token]
/accept-invite/[token]     Org + project invites unified
/sso/[provider]            OAuth/OIDC entry
/auth/callback             Provider callback
/auth/resolve              Role → shell router (platform | portal | mobile | personal)
```

### 3.3 `(personal)` — Any authenticated user

```
/me                        Personal dashboard (tickets, tasks assigned to me, notifications)
/me/profile                Identity, avatar, contact
/me/settings               Preferences, timezone, locale
/me/notifications          Per-channel preferences
/me/security               Password, 2FA, sessions, API tokens
/me/tickets                Tickets purchased / scanned (from portal + mobile)
/me/organizations          Orgs I belong to + switcher
```

### 3.4 `(platform)` — Internal Operations Console

Shared layout: left sidebar (grouped nav), top bar (org switcher, command palette, AI assistant drawer).

```
/console                                   Operations dashboard (KPIs, pinned items, inbox)
/console/command                           Global command palette deep-link

WORK
/console/projects/(hub)                    List → /[projectId] → /create
  /[projectId]/overview
  /[projectId]/tasks
  /[projectId]/gantt
  /[projectId]/roadmap
  /[projectId]/files
  /[projectId]/calendar
  /[projectId]/budget
  /[projectId]/crew
  /[projectId]/advancing                   Internal view of portal advancing
  /[projectId]/portal-preview              Preview external portal as role
/console/tasks/(hub)
/console/schedule/(hub)                    Master schedule (RRULE, ICS export, conflicts)
/console/events/(hub)
/console/locations/(hub)                   Canonical locations DB + picker

SALES & CRM
/console/pipeline/(hub)                    Kanban by stage
/console/leads/(hub)
/console/clients/(hub)
/console/proposals/(hub)                   Editor + templates + send-to-portal
/console/campaigns/(hub)

FINANCE
/console/finance                           Finance hub (cash, AR, AP, budget roll-up)
/console/finance/invoices/(hub)
/console/finance/expenses/(hub)
/console/finance/budgets/(hub)
/console/finance/time/(hub)
/console/finance/mileage/(hub)
/console/finance/advances/(hub)
/console/finance/payouts                   Stripe Connect payouts
/console/finance/reports                   P&L, cash flow, project profitability

PROCUREMENT
/console/procurement                       Hub
/console/procurement/requisitions/(hub)
/console/procurement/purchase-orders/(hub)
/console/procurement/vendors/(hub)
/console/procurement/rfqs/(hub)
/console/procurement/catalog               Approved item catalog

PRODUCTION
/console/production/fabrication/(hub)
/console/production/dispatch/(hub)          + /live board
/console/production/rentals/(hub)           + /availability
/console/production/equipment/(hub)         Inventory + maintenance
/console/production/warehouse/(hub)         Locations, stock moves
/console/production/logistics/(hub)

PEOPLE
/console/people/(hub)                      Directory
/console/people/crew/(hub)                 Rostering + scheduling board
/console/people/credentials/(hub)          Certs + asset-linker
/console/people/roles                      Role matrix
/console/people/invites                    Pending invites

AI & AUTOMATION
/console/ai                                 AI hub (always-available drawer elsewhere)
/console/ai/assistant/[conversationId]
/console/ai/drafting                        Document drafting workspace
/console/ai/automations/(hub)               Rule builder + templates
/console/ai/agents                          Long-running managed agents

COLLABORATION
/console/inbox                              Unified messages + mentions
/console/files                              Global file browser (project-scoped)
/console/forms/(hub)                        Public/private form builder

ADMIN & SETTINGS
/console/settings                           Hub
/console/settings/organization
/console/settings/billing                   Subscription + payment methods
/console/settings/integrations/(hub)        + /marketplace
/console/settings/api                       Keys, webhooks, rate limits
/console/settings/webhooks/(hub)
/console/settings/audit                     Audit log
/console/settings/compliance                Retention, DPA, exports
/console/settings/branding                  Portal + email branding
/console/settings/domains                   Custom domains for portals
```

### 3.5 `(portal)` — External Stakeholder Workspaces

Slug-scoped, never uses console layout. URL form: `/p/[slug]/...` where `[slug]` is project or event.

```
/p/[slug]                                  Gateway — auth-resolves persona → routes below
/p/[slug]/overview                         Event/project summary for the role

ARTIST / TALENT
/p/[slug]/artist
/p/[slug]/artist/advancing                 Riders, input list, stage plot uploads
/p/[slug]/artist/catering
/p/[slug]/artist/venue                     Specs, load-in, parking
/p/[slug]/artist/schedule                  Day-of-show schedule
/p/[slug]/artist/travel                    Flights, hotel, ground

VENDOR
/p/[slug]/vendor
/p/[slug]/vendor/submissions
/p/[slug]/vendor/equipment-pull-list
/p/[slug]/vendor/purchase-orders           POs issued to me
/p/[slug]/vendor/invoices                  Submit invoice, track status
/p/[slug]/vendor/credentials               Upload COI, W-9, licenses

CLIENT
/p/[slug]/client
/p/[slug]/client/proposals                 Review, approve, e-sign
/p/[slug]/client/deliverables
/p/[slug]/client/invoices
/p/[slug]/client/messages
/p/[slug]/client/files

SPONSOR
/p/[slug]/sponsor
/p/[slug]/sponsor/activations
/p/[slug]/sponsor/assets                   Brand assets, logos
/p/[slug]/sponsor/reporting

GUEST / INDUSTRY
/p/[slug]/guest
/p/[slug]/guest/tickets                    Buy / claim / transfer
/p/[slug]/guest/schedule
/p/[slug]/guest/logistics                  Parking, entrances, rideshare

CREW (external contractor view)
/p/[slug]/crew
/p/[slug]/crew/call-sheet
/p/[slug]/crew/time                        Submit hours
/p/[slug]/crew/advances                    Request per-diem / advance
```

### 3.6 `(mobile)` — Field PWA

Separate PWA manifest, offline-first, camera + geolocation permissions on install.

```
/m                                         Role-routed landing
/m/check-in                                 Scanner home
/m/check-in/scan/[slug]                     QR scan UI → /api/v1/tickets/[id]/scan
/m/check-in/manual                          Manual ticket lookup
/m/crew                                     Today's call sheet
/m/crew/clock                               Clock in/out (geo-verified)
/m/tasks                                    My assigned tasks (offline queue)
/m/inventory/scan                           Equipment scan in/out
/m/incidents/new                            Incident / safety report
/m/settings                                 Offline sync, camera perms
```

### 3.7 `api/v1/` — Versioned API

Pattern: `/api/v1/<resource>[/<id>[/<action>]]`. All endpoints:
- Parse input with Zod at the boundary
- Return `apiOk(data) | apiCreated(data) | apiError(code, message)`
- Gated by `withAuth` + org-scoped RLS
- Stripe/webhook receivers under `/api/v1/webhooks/<provider>`

```
/api/v1/health
/api/v1/auth/{callback,refresh,logout,resolve}
/api/v1/orgs/[orgId]/{members,roles,invites,billing}
/api/v1/projects/[id]/{tasks,files,crew,advancing}
/api/v1/schedule                          Master schedule CRUD + ICS
/api/v1/locations                         Canonical search
/api/v1/crm/{leads,clients,pipeline,proposals,campaigns}
/api/v1/finance/{invoices,expenses,budgets,time,mileage,advances,payouts,reports}
/api/v1/procurement/{requisitions,pos,vendors,rfqs,catalog}
/api/v1/production/{fabrication,dispatch,rentals,equipment,warehouse,logistics}
/api/v1/people/{directory,crew,credentials,roles,invites}
/api/v1/tickets/[id]/{scan,transfer}
/api/v1/portal/[slug]/{artist,vendor,client,sponsor,guest,crew}
/api/v1/ai/{chat,draft,automations,agents}
/api/v1/forms/[formId]/submissions
/api/v1/webhooks/{stripe,sendgrid,twilio,custom/[id]}
/api/v1/integrations/[integrationId]
```

---

## 4. Persona → Shell Matrix

| Persona | `(marketing)` | `(auth)` | `(personal)` | `(platform)` | `(portal)` | `(mobile)` |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Visitor | ✅ | login/signup | — | — | — | — |
| Owner / Admin | ✅ | ✅ | ✅ | full | preview-as | full |
| Controller (finance) | — | ✅ | ✅ | finance, procurement | — | — |
| Project Manager | — | ✅ | ✅ | work, production, people | preview-as | clock, tasks |
| Crew / Contractor | — | ✅ | ✅ | read-only projects | crew slug | full |
| Client | — | ✅ | ✅ | — | client slug | — |
| Vendor | — | ✅ | ✅ | — | vendor slug | scan only |
| Artist / Talent | — | ✅ | ✅ | — | artist slug | check-in |
| Sponsor | — | ✅ | ✅ | — | sponsor slug | — |
| Industry Guest | — | ✅ | ✅ | — | guest slug | check-in |
| Developer | ✅ | ✅ | ✅ | settings/api | — | — |

**Routing rule:** `/auth/resolve` inspects role + context and 307s to the right shell root (`/console`, `/p/[slug]`, `/m`, or `/me`).

---

## 5. Navigation Patterns

### 5.1 Platform sidebar (grouped, collapsible)

```
▸ Dashboard
▸ Work           projects · tasks · schedule · events · locations
▸ Sales          pipeline · leads · clients · proposals · campaigns
▸ Finance        invoices · expenses · budgets · time · mileage · advances · reports
▸ Procurement    requisitions · POs · vendors · RFQs · catalog
▸ Production     fabrication · dispatch · rentals · equipment · warehouse · logistics
▸ People         directory · crew · credentials · roles
▸ AI             assistant · drafting · automations · agents
▸ Inbox · Files · Forms
▸ Settings       org · billing · integrations · api · audit · compliance · branding
```

Group visibility is tier- and role-gated (Portal tier sees only Dashboard + Work; Enterprise sees all).

### 5.2 Portal shell

Top bar: event/project name, role badge, switch-project. Left rail: persona-scoped modules (see §3.5). No cross-project navigation — the slug is the boundary.

### 5.3 Mobile shell

Bottom tab bar (max 5): Home · Check-in · Tasks · Scan · Me. Everything else via contextual actions. Offline indicator in status area.

---

## 6. URL & Slug Conventions

| Pattern | Example | Notes |
|---|---|---|
| Resource list | `/console/projects` | Plural, no trailing slash |
| Resource detail | `/console/projects/[projectId]` | Use opaque IDs, not slugs, for internal |
| Resource create | `/console/projects/new` | Prefer `/new` over `/create` |
| Sub-resource | `/console/projects/[projectId]/tasks` | Nest only one level deep in URL |
| External portal | `/p/[slug]/artist/advancing` | `p` prefix reserves portal namespace |
| Mobile | `/m/check-in/scan/[slug]` | `m` prefix isolates PWA manifest scope |
| Tokens | `/accept-invite/[token]` | One-time, single-segment, rate-limited |
| Public share | `/s/[shareId]` | Signed, expirable, read-only |

Slugs (portal) are stable, human-readable, lowercase-kebab, max 48 chars. IDs (platform) are nanoid(12) or uuid — never leak DB primary keys.

---

## 7. Module Naming Normalization

Rename where the two repos disagree so one convention wins:

| Red Sea Lion | Opus One | Canonical |
|---|---|---|
| `/app/purchase-orders` | `/console/vendors` (bundled) | `/console/procurement/purchase-orders` |
| `/app/client-portal` (internal) | `/[slug]/client` | `/p/[slug]/client` (external only) |
| `/app/project-portals` | — | Deleted — folded into `/p/[slug]` |
| `/app/schedule` | `/console/master-schedule` | `/console/schedule` |
| `/app/people` | `/console/users` + `/console/crew` | `/console/people/{directory,crew,credentials,roles}` |
| `/app/ai-assistant`, `/app/ai-drafting` | — | `/console/ai/{assistant,drafting,automations,agents}` |
| `/api/...` | `/api/v1/...` | `/api/v1/...` |

---

## 8. RBAC & Tier Gating Model

- **Platform roles (10):** developer, owner, admin, controller, collaborator, contractor, crew, client, viewer, community
- **Project roles (4):** creator, collaborator, viewer, vendor
- **Tiers (4):** portal, starter, professional, enterprise

Enforcement layers (defense in depth):
1. **Middleware** — shell-level route guard (`/console/*` requires platform role; `/p/[slug]/*` requires a project membership for slug).
2. **Layout** — server component checks role+tier, renders gated nav.
3. **Server action / API route** — `withAuth` + explicit capability check (`can(user, 'invoices:create', { orgId })`).
4. **Database** — Supabase RLS policies keyed on `org_id`, `project_id`, and role.

Feature flags live in `settings.features` per org and are consulted at layer 2.

---

## 9. Docs to Add (in `/docs`)

```
docs/
├── ia/
│   ├── 01-topology.md            This document
│   ├── 02-route-inventory.md     Generated from app tree
│   ├── 03-persona-matrix.md      §4 expanded
│   ├── 04-rbac-capabilities.md   Full capability → role map
│   └── 05-url-conventions.md     §6 + deprecations
├── api/
│   └── v1-contract.md            OpenAPI dump + Zod schemas
└── decisions/
    └── ADR-0001-three-shell-topology.md
```

---

## 10. Migration Plan (per repo)

### Red Sea Lion (FlyteDeck) — gains portals + mobile
1. Introduce `(portal)` and `(mobile)` groups; keep `(marketing)/(auth)/app/` working.
2. Rename `/app/` → `/(platform)/console/` with 307 redirects for one release.
3. Fold `/app/client-portal` and `/app/project-portals` into `/p/[slug]/*`.
4. Add ticketing + check-in scaffolding on API side (copy from Opus One).
5. Version API: `/api/*` → `/api/v1/*` with rewrites; mark old as deprecated.

### Opus One (gvteway) — gains depth + marketing
1. Add `(marketing)` group with home/pricing/features/blog.
2. Expand `/console/finance` and introduce `/console/procurement` hubs.
3. Add `/console/ai/*` modules (assistant, drafting, automations).
4. Introduce the `(hub)` sub-group pattern inside each console module.
5. Formalize RBAC with the 10+4+4 model and migrate the context provider.

### Shared (do once, copy to both)
- Extract `@workspace/ia` — shared route manifest + navigation config — as a small package consumed by both apps so the sidebar/nav stays in sync.
- Adopt `apiOk/apiError/apiCreated` helpers + Zod everywhere (Opus already has this; port to RSL).
- Auth resolve endpoint routes to the right shell based on role + context.

---

## 11. What's deliberately out of scope

- **Multi-region / data residency** — single Supabase project assumed; revisit at Enterprise GA.
- **Native mobile** — `(mobile)` is a PWA; native is a separate track.
- **Public marketplace** — integration marketplace stays internal-only in v1.
- **i18n URL routing** — prefer `Accept-Language` over `/en/`, `/es/` prefixes until a real localization program exists.
