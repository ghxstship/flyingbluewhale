# ATLVS Platform — Full UI/UX & Capability Audit

**Date:** 2026-07-10 · **Auditor:** Claude Code · **Scope:** every user-facing surface across all shells, plus emails, API, and CLI.

> **Remediation status (2026-07-10, same day):** all 181 actionable findings were remediated in a two-wave agent pass. Deltas of note: A-15 kept `ui/EditableCell` (real consumer found), F-11 needed no migration (`webhook_deliveries` already existed in the baseline), E-07 hosted auth-template application and D-28 anonymous cert verification are the two deliberately-deferred remainders, and F-14 recorded chart-4/chart-7 light-mode contrast as documented token-canon exceptions. Gate stack after remediation: typecheck, ESLint, sitemap/ia-map/create-actions drift gates, and the full vitest canon suite (114 files / 1,290 tests) all green; locale catalogs at 7-way parity.

**Source of truth for routes:** `docs/ia/SITEMAP.md` (generated, 0 orphans / 0 dangling). This audit inventories at the **surface-family (module) level** — each numbered surface covers its list / `new` / `[id]` detail routes — because per-route repetition would hide, not surface, findings. Raw counts: **1,173 page routes · 145 API route handlers · 514 nav hrefs · 392 server-action files · 279 FormShell forms · ~85 UI primitives**.

---

# PHASE 1 — SURFACE INVENTORY

## Shell topology (7 shells)

| Shell | Route group | Host | Routes | Nav SSOT |
|---|---|---|---:|---|
| ATLVS Operator Console | `(platform)` `/studio` | app.atlvs.pro | 783 | `platformNav` + `platformTabs` + `platformUtility` |
| GVTEWAY External Portal | `(portal)` `/p/[slug]` | gvteway.atlvs.pro | 150 | `portalNav` |
| GVTEWAY Public/Marketing | `(marketing)` | atlvs.pro | 93 | `marketingHeaderGroups`/`marketingFooterGroups` |
| COMPVSS Field PWA | `(mobile)` `/m` | compvss.atlvs.pro | 54 | `mobileTabs`/`mobileSurfaces` |
| LEG3ND Knowledge | `(legend)` `/legend` | — | 41 | `legendNav` |
| Personal | `(personal)` `/me` | atlvs.pro | 25 | `personalNavGroups` |
| Auth | `(auth)` | atlvs.pro | 13 | header links + token flows |
| Token-gated public | `/offer` `/proposals` `/msa` `/sign` `/share` `/forms` | atlvs.pro | 12 | emailed links (exempt) |

## S1–S34 · Marketing shell (93 routes)

| # | Surface | Routes | Notes |
|---|---|---:|---|
| S1 | Homepage `/` | 1 | Hero, product pillars |
| S2 | Marketplace public discovery `/marketplace/*` | 28 | rfqs, gigs, calls, talent, crew, vendors — list + `[slug]` detail each |
| S3 | Solutions pages | 6 | per-vertical |
| S4 | Integrations catalog | 6 | |
| S5 | Features | 3 | |
| S6 | Pricing | 1 | |
| S7 | Legal (terms/privacy/DPA/…) | 4 | |
| S8 | Tools (free tools/SEO) | 3 | |
| S9 | Events | 3 | |
| S10 | Brand kit microsite | 3 | exempt-nav |
| S11 | Templates gallery | 2 | |
| S12 | Teams | 2 | |
| S13 | Guides | 2 | |
| S14 | Glossary | 2 | |
| S15 | Demo booking flow | 2 | exempt |
| S16 | Customers / case studies | 2 | |
| S17 | Compare pages | 2 | |
| S18 | Community | 2 | |
| S19 | Blog | 2 | |
| S20 | Alternatives (SEO) | 2 | |
| S21 | AI landing | 2 | |
| S22 | Status page | 1 | |
| S23 | Roadmap | 1 | |
| S24 | Press | 1 | |
| S25 | Pitch deck presenter `/pitch` | 1 | exempt |
| S26 | Partners | 1 | |
| S27 | Help center | 1 | |
| S28 | Docs landing | 1 | |
| S29 | Contact | 1 | form |
| S30 | Changelog | 1 | |
| S31 | Careers | 1 | |
| S32 | About | 1 | |
| S33 | i18n locale roots `/es-ES` `/pt-BR` | 2 | |
| S34 | Marketing chrome | — | `MarketingHeader`, footer, CookieConsent, ThemeToggle |

## S35–S46 · Auth shell (13 routes + flows)

| # | Surface | Notes |
|---|---|---|
| S35 | Login | password + magic-link entry |
| S36 | Signup | |
| S37 | Forgot / reset password | 2-step flow |
| S38 | Magic link (request + callback) | |
| S39 | Verify email (2 states) | |
| S40 | MFA challenge | |
| S41 | SSO entry | |
| S42 | Accept invite (token) | |
| S43 | Org onboarding `/onboarding/org` | post-signup |
| S44 | `/auth/resolve` persona redirect | logic surface |
| S45 | AuthCard shell chrome | shared layout |
| S46 | Session/impersonation ("Act As") | dev-gated |

## S47–S64 · Personal `/me` (25 routes)

S47 `/me` home · S48 notifications (3: list/prefs) · S49 submissions (2) · S50 settings (2) · S51 security (2, incl. MFA mgmt) · S52 reviews (2) · S53 applications (2) · S54 tickets · S55 talent EPK editor · S56 saved-searches · S57 profile · S58 privacy · S59 preferences · S60 organizations (org switcher) · S61 offers · S62 inquiries · S63 crew profile · S64 availability calendar.

## S65–S79 · Token-gated public flows (12 routes)

S65 `/proposals/[token]` view + accept · S66 `/offer/[token]` (4: view/sign/onboarding) · S67 `/msa/[token]` (2) · S68 `/sign/[token]` public e-signature · S69 `/share/[token]` record share · S70 `/forms/[slug]` embedded campaign forms · S71 `/accept-invite` · S72 `/api-docs` API reference microsite · S73 OG image generation `/og` · S74 sitemap/robots · S75 PWA manifest + service worker (compvss) · S76 proposal share email landing · S77 offer-letter countersign flow · S78 e-sig envelope completion states · S79 guest ticket claim (external holders).

## S80–S147 · ATLVS Operator Console `(platform)` `/studio` (783 routes, 68 modules)

| # | Module | Routes | # | Module | Routes |
|---|---|---:|---|---|---:|
| S80 | finance | 65 | S114 | leads | 6 |
| S81 | procurement | 50 | S115 | inspections | 6 |
| S82 | settings | 45 | S116 | forms builder | 6 |
| S83 | workforce | 42 | S117 | accommodation | 6 |
| S84 | safety | 39 | S118 | sustainability | 5 |
| S85 | marketplace ops | 38 | S119 | schedule | 5 |
| S86 | projects | 34 | S120 | punch lists | 5 |
| S87 | people | 26 | S121 | locations | 5 |
| S88 | production | 23 | S122 | bim | 5 |
| S89 | programs | 22 | S123 | tasks | 4 |
| S90 | operations | 21 | S124 | takeoffs | 4 |
| S91 | legal | 19 | S125 | subscriptions | 4 |
| S92 | accreditation | 17 | S126 | submittals | 4 |
| S93 | venues | 13 | S127 | tours | ~4 |
| S94 | participants | 13 | S128 | templates | 2 |
| S95 | comms | 13 | S129 | reports (43 defs) | 2 |
| S96 | transport | 11 | S130 | position lens | 2 |
| S97 | logistics | 11 | S131 | pipeline | 2 |
| S98 | sales | 10 | S132 | photos | 2 |
| S99 | assets | 10 | S133 | notes | 2 |
| S100 | ai / copilot | 11 | S134 | kits | 2 |
| S101 | xpms | 9 | S135 | email-inbox | 2 |
| S102 | commercial | 9 | S136 | documents (29 doc types) | 2+ |
| S103 | collaborate | 9 | S137 | captures | 2 |
| S104 | bookings | 9 | S138 | campaigns | 2 |
| S105 | meetings | 8 | S139 | annotations | 2 |
| S106 | clients | 8 | S140 | advancing hub | 2 |
| S107 | agency | 8 | S141 | access-control | 2 |
| S108 | governance | 7 | S142 | inbox (console messaging) | 1 |
| S109 | site-plans | 6 | S143 | my-work | 1 |
| S110 | proposals | 6 | S144 | home (Event Spine, Show-Day) | 1 |
| S111 | ops | 6 | S145 | triage / trash / risk / import / insights / calendar / board / crm / opportunities / action-items / guides / assistant | 12 |
| S112 | compliance | 2+ | S146 | Console chrome | rail (11 groups/60 items), `platformTabs` (30 families/116 tabs), lenses, ⌘K CommandPalette, CreateMenu (+), App Rail, ConsoleTour, ShortcutDialog |
| S113 | dashboards/home widgets | — | S147 | DataView system | saved views, inline edit (EditableCell), BulkActionBar, ExportMenu, ImportPanel, FilterBar |

## S148–S171 · GVTEWAY Portal `(portal)` `/p/[slug]` (150 routes, 15 personas)

S148 portal gateway/persona picker (`/p/[slug]`, `/p/select`) · S149 client (19) · S150 vendor (16, incl. bid submission) · S151 crew (14, incl. advances) · S152 delegation (10) · S153 producer (9) · S154 stakeholder (7) · S155 promoter (7) · S156 media (7) · S157 artist (7) · S158 volunteer (6) · S159 sponsor (6) · S160 athlete (6) · S161 vip (5) · S162 guest (5, incl. tickets) · S163 hospitality (4) · S164 messages / AM thread (2 + start) · S165 guide (Boarding Pass) · S166 apply flows (2) · S167 shared: tasks/schedule/inbox/announcements · S168 PortalRail chrome · S169 PortalDocVault widget · S170 GVTEWAY consumer discovery (`/p`, discover/saved/scenes/lists/community/account) · S171 ShareSheet.

## S172–S199 · COMPVSS Field PWA `(mobile)` `/m` (54 routes)

S172 home/tab shell (MobileTabBar) · S173 check-in (4) · S174 advances (3) · S175 time-off (2) · S176 tasks (2) · S177 settings + notification matrix (2) · S178 onboarding (2) · S179 inventory (2) · S180 incidents org queue (2) + my incidents (2) + express file · S181 inbox/chat (2, realtime) · S182 handover (2) · S183 directory (2) · S184 daily-log (2) · S185 wallet · S186 schedule · S187 scan (gate scanning) · S188 requests · S189 referrals · S190 punch · S191 profile · S192 onsite · S193 notifications · S194 more (overflow) · S195 market/gigs/catalog · S196 feed (realtime announcements) · S197 emergency · S198 clock + door + coc + docs + changelog + alerts + activity + connections + guide · S199 offline/PWA layer (service worker, manifest, offline queue).

## S200–S219 · LEG3ND Knowledge shell (41 routes)

S200 legend home · S201 resources (7) · S202 engine/XMCE compliance (7) · S203 signage library (5, AIGA pictograms) · S204 learn/LMS (4) · S205 community (3) · S206 store · S207 progress · S208 profile · S209 path · S210 my-learning · S211 live · S212 leaderboard · S213 for-institutions · S214 crew · S215 console · S216 compliance · S217 certifications · S218 badges · S219 architecture + `data-type="legend"` type axis.

## S220–S234 · Cross-cutting systems (not routes)

| # | System | Anchor |
|---|---|---|
| S220 | Design system primitives (~85) | `src/components/ui/` |
| S221 | Theming: 6 axes (product/mode/density/accent/type/trend), OKLCH | `src/app/theme/` |
| S222 | Forms engine | `FormShell` + 392 `actions.ts` + `useActionState` |
| S223 | Modals/drawers | `Dialog`, `Sheet`, `ConfirmDialog`, `ActivityDrawer`, `ToolSheet`, `MobileNavDrawer`, `AtomDrillIn` |
| S224 | Loading states | 13 `loading.tsx` (shell-level only), `Skeleton`/`PageSkeleton` |
| S225 | Error states | 8 `error.tsx` + `global-error.tsx` + 8 `not-found.tsx` (shell-level only) |
| S226 | Empty states | `EmptyState` (214 usages) |
| S227 | Toasts / LiveRegion / UndoStack | `ui/Toast`, `ui/LiveRegion`, `ui/UndoStack` |
| S228 | Realtime | `RealtimeRefresh`, chat, live nav badges |
| S229 | Push notifications | `push/send.ts`, per-kind matrix |
| S230 | Emails | `src/lib/email.ts` (`wrapEmailHtml`, `sendEmail`, org templates, proposal share) + automations `email-send` action |
| S231 | Search | ⌘K CommandPalette, per-list FilterBar, saved searches |
| S232 | i18n | en + es-ES + pt-BR catalogs |
| S233 | AI surfaces | streaming chat, Copilot Suggests, grounded Copilot, `.ai-msg` kit |
| S234 | Onboarding/education | ConsoleTour, Coachmark, SetupChecklist, Event Spine, guides CMS |

## S235–S238 · API & CLI surfaces

| # | Surface | Notes |
|---|---|---|
| S235 | REST API `/api/v1/*` | 145 handlers, 141 OpenAPI paths, PAT scopes, `docs/api/openapi.yaml` (drift-guarded) |
| S236 | API docs microsite `/api-docs` | |
| S237 | Webhooks | Stripe receiver; entitlements endpoint |
| S238 | CLI / scripts | ~60 `scripts/*.mjs` (smoke harnesses, generators, i18n pipeline, exports) — internal-facing |

**Inventory complete: 238 numbered surfaces covering all 1,173 page routes + 145 API handlers + non-route systems.**

---

# PHASE 2 — PER-SURFACE AUDIT

Six audit passes, one per surface slice. Finding IDs are prefixed by pass (A = console core, B = console long tail, C = portal + personal, D = mobile + LEG3ND, E = marketing/auth/tokens/email, F = cross-cutting). All findings are code-grounded (file:line).

## Pass A — Console core: chrome, projects/finance/procurement/sales, DataView engine (S80–S81, S86, S98, S106, S110, S114, S123, S131, S142–S147)

**Assessment.** The console core is engineered to an unusually high standard for chrome and primitives — the sidebar (role lenses, pins, drag-resize, i18n, `aria-current`, force-open active groups), CommandPalette (fuzzy ranking, recents, ⌘↵ new-tab, sr-only Radix title), FormShell (dirty-guard dialog, value echo on validation failure, live-region announcements), DeleteForm (focus-trapped confirm + soft-delete Undo toast), and the DataTable engine (multi-sort, filter chips, grouping w/ subtotals, column pin/hide/reorder/resize, density, CSV, URL-synced + persisted views, structure-preserving ghost empty states) are Linear/Airtable-class *designs*. The gap is between the engine and the ~100 list pages riding it: capabilities are built but unwired (inline edit on 0 pages, import 0, named saved views 1, alt views 2), data-honesty tooling exists but most pages skip it (silent 100-row caps with aggregates computed over the truncated slice), destructive bulk actions bypass the ConfirmDialog that exists two directories away, and two genuine defects live in the table engine itself (CSV column misalignment after hide/reorder; virtualization without spacers). Streaming/Suspense discipline is excellent on `/studio` home and invoices but absent from ~92% of pages.

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|----|---------|---------|----------|----------|--------|----------------|
| A-01 | CommandPalette | ⌘K indexes only routes/creates/settings — no record/entity search (`CommandPalette.tsx:135-414`); ConsoleTour copy promises "search across every page, record, and action" | Capability | P1 | L | Async records group (projects/invoices/clients by number/name); until then fix tour copy |
| A-02 | DataTableInteractive | `exportCsv` indexes `row.values` by rendered column position, not `colIndexByKey` (`DataTableInteractive.tsx:2347-2361` vs `:1338-1349`) — hiding/reordering/pinning any column exports wrong values under wrong headers | Bug / data integrity | P1 | S | Pass `colIndexByKey` into `exportCsv`; index by original column |
| A-03 | Bulk actions | Danger bulk actions fire immediately — clients bulk Delete (`clients/page.tsx:63-70`), invoices bulk Void (`finance/invoices/page.tsx:109-116`); bar calls `perform` with no confirm/undo (`DataTableInteractive.tsx:1223-1247`) despite `ConfirmDialog` existing | Safety | P1 | S | Gate `variant:"danger"` behind `ConfirmDialog` with count, or Undo toast |
| A-04 | DataTableInteractive | Virtualized mode renders only in-view rows with no spacers/transform (`:1149-1167`, `:660-665`) — scroll height collapses; scrollbar lies, wheel-scroll treadmills on tall tables | Bug | P1 | M | Padding rows or translateY (TanStack pattern) |
| A-05 | Procurement/Tasks lists | Aggregates computed over silent 100-row cap: PO count + committed sum (`purchase-orders/page.tsx:29-42`), tasks Open/Done (`tasks/page.tsx:37-47`); no `totalCount` so the "Showing first N of M" indicator never renders | Data honesty | P1 | M | `countOrgScoped` + narrow aggregates; pass `totalCount` |
| A-06 | `/new` forms | FK pickers fed by capped `listOrgScoped` — invoice New loads only first 100 clients/projects into a native select (`invoices/new/page.tsx:20-27`); rows past cap unselectable | Bug / capability | P1 | M | Async searchable Combobox for FK pickers |
| A-07 | Invoices list | Subtitle shows true total via `countOrgScoped` while table silently shows first 100 (`invoices/page.tsx:22,84,106`) | Data honesty | P2 | S | Pass `totalCount` or cursor pagination like expenses |
| A-08 | Console lists | Three sibling data idioms (Suspense islands / cursor pagination / blocking capped fetch) across adjacent nav items | Consistency | P2 | L | Pick expenses or invoices pattern as canon; codemod |
| A-09 | Loading states | Only 7 studio files use Suspense; module `loading.tsx` for 6 segments; all nav links `prefetch={false}` on `force-dynamic` pages | States / perf | P2 | M | Per-module `loading.tsx` with matched `PageSkeleton`; prefetch on hover |
| A-10 | Inbox | ~8 sequential query waterfall (`inbox/page.tsx:58-203`), fully re-run by `router.refresh()` on every realtime message (`ConsoleChat.tsx:155`) | Performance | P2 | M | Parallelize; stream thread pane; append client-side |
| A-11 | Inbox thread | History capped at 80 (`inbox/page.tsx:19,114-119`), no load-older | Capability | P2 | M | Cursor "Load earlier messages" |
| A-12 | Inbox chat | Message list has no `role="log"`/`aria-live` (`ConsoleChat.tsx:156`) — incoming messages silent to screen readers | A11y (4.1.3) | P2 | S | `role="log" aria-live="polite"` |
| A-13 | Inline edit | Optimistic override never rolls back — `void onCellEdit?.()` swallows rejection (`DataTableInteractive.tsx:342-348`); zero pages wire `onCellEdit` — the v7.7 flagship ships dark | Bug + capability | P2 | M | Await + revert + toast; wire `editable` on 2-3 high-traffic lists |
| A-14 | View system adoption | Named saved views on exactly 1 page (clients); `views/DataView` renderers on 2; `viewType` voided (`:261-264`); `onImport` 0 pages | Capability | P2 | L | Thread views through top 10 lists |
| A-15 | ui/ primitives | Dead duplicates: `ui/BulkActionBar`, `ui/ExportMenu`, `ui/ImportPanel`, `ui/Pagination`, `ui/EditableCell` have 0 studio consumers — table reimplements each inline | Debt | P2 | S | Delete or converge |
| A-16 | DataTable menus | Filter pickers render read-only checkboxes inside `role="menuitem"` without `menuitemcheckbox`/`aria-checked` (`:1827-1846, 2131-2146`) | A11y (4.1.2) | P2 | S | Radix `DropdownMenu.CheckboxItem` |
| A-17 | Bulk bar | No live-region announcement of selection count; select-all covers loaded rows only, no "select all N matching" | A11y + capability | P2 | M | LiveRegion announce; select-all-matching |
| A-18 | PlatformSidebar | Resize handle `role="separator"` pointer-only — no tabindex/arrow keys (`PlatformSidebar.tsx:424-435`) | A11y (2.1.1) | P2 | S | Focusable with arrow-key steps |
| A-19 | Sidebar/table chrome | Sub-24px targets: pin toggle ≈15px (`PlatformSidebar.tsx:678-692`), column funnel 20px (`DataTableInteractive.tsx:2115`) — WCAG 2.2 §2.5.8 | A11y | P2 | S | ≥24px hit areas |
| A-20 | DeleteForm | Hardcoded English ("Confirm delete", "Undo" toasts — `DeleteForm.tsx:59,79-90,111`) in a fully i18n'd console | i18n | P2 | S | Route through `useT` |
| A-21 | Delete flows | Undo adopted on 10 of 90 DeleteForm sites; other 80 hard-redirect with no recovery despite `restoreOrgScoped` + Trash | Interaction | P2 | M | Sweep soft-deletable surfaces onto `undo` |
| A-22 | List pages | Bulk actions on only 7 lists; proposals, expenses, POs, requisitions, tasks, leads have none | Capability | P2 | M | State-transition + export bulk on core lists |
| A-23 | Sales pipeline | Board is read-only server render — no drag between stages or inline stage change (`pipeline/page.tsx`, limit 500) | Capability | P2 | L | Client kanban island + stage-transition action |
| A-24 | CSV export scope | Exports only loaded rows (≤100) with no warning or server-side full export (`:873, 2347`) | Data honesty | P2 | M | "Export all N (server)" when truncated |
| A-25 | Empty states | Inconsistent: invoices falls to bare "No records yet" while expenses/requisitions teach the first action | Polish | P2 | S | Sweep for empty-state trio |
| A-26 | CommandPalette trigger | `hidden … sm:inline-flex` (`CommandPalette.tsx:567`) — below 640px no touch path to the palette at all | Responsiveness | P2 | S | Icon-only search button under sm |
| A-27 | Mobile inbox | Two-pane grid stacks list-above-thread at <lg (`inbox/page.tsx:236`) | Responsiveness | P3 | M | List OR thread with back affordance |
| A-28 | DataTableInteractive | `aria-selected` on `<tr>` of a native table (`:1327`) — unsupported outside grid role | A11y (minor) | P3 | S | Drop or use data attribute |
| A-29 | DataTable keyboard | No arrow-key cell navigation (acknowledged `:943-945`) | Capability | P3 | L | Optional roving tabindex |
| A-30 | Sidebar badges | Count pill `group-hover:opacity-0` (`PlatformSidebar.tsx:655`) — number vanishes on hover | Polish | P3 | S | Shift pill instead of hiding |
| A-31 | Sidebar search | Filters only lensed rail groups (`:173-187`) — 66 `platformUtility` surfaces findable only via ⌘K | Capability | P3 | S | Include utility items |
| A-32 | Lists realtime | `RealtimeRefresh` only on inbox/feed; every list depends on manual Refresh | Capability | P3 | M | Realtime nudge on collaborative lists |
| A-33 | Console-wide | No offline handling: no `navigator.onLine` banner; failed `router.refresh()` silent | States | P3 | M | Global offline banner in WorkspaceChrome |
| A-34 | Layout | `--p-content-max` 1200px cap (`globals.css:1049-1063`) — dense tables use ~60% of a 1440p display | Responsiveness | P3 | S | Full-width mode for table pages |
| A-35 | Tasks page | View toggle uses raw `<a href="?view=…">` full navigations (`tasks/page.tsx:53-60`) | Polish | P3 | S | `<Link replace scroll={false}>` |
| A-36 | Inbox | Mark-read write as GET render side effect (`inbox/page.tsx:181-185`) | Architecture | P3 | S | Client-fired action on mount |
| A-37 | FormShell | Dirty guard misses `popstate` — browser Back discards edits (`FormShell.tsx:82-112`) | Interaction | P3 | M | popstate interception |

**Benchmarks (P1s):**
- **A-01** Linear ⌘K returns issues/projects/users, not just commands; Stripe search resolves customers/payments by ID from the omnibar.
- **A-02** Airtable/Linear CSV exports serialize from the field model keyed by field ID — view-level hide/reorder can never shift values.
- **A-03** Linear confirms bulk delete with a count dialog; Stripe requires typed confirmation for destructive batch ops; Airtable offers ⌘Z undo.
- **A-04** Airtable/Linear virtualized lists keep a true-height scroll canvas; the scrollbar maps 1:1 to dataset position.
- **A-05** Stripe list headers show exact server-side counts/sums independent of the page window.
- **A-06** Linear/Stripe use async type-ahead comboboxes for record references — never a preloaded capped dump.

## Pass B — Console long tail: settings/workforce/safety/marketplace/people/operations + ~50 modules, reports & documents hubs (S82–S85, S87–S145)

**Assessment.** The long tail is far more consistent with the core than a 600-route surface has any right to be — ModuleHeader appears on 762/783 studio pages, 245 pages ride the shared `DataTable`, 105/142 create pages use `FormShell`, destructive record deletes go through a focus-trapped `DeleteForm` with undo, and even tiny surfaces (trash, triage) are polished, i18n'd, role-gated pages. Roughly **80–85% of sampled pages feel finished; the scaffold class concentrates in two shapes**: (a) label-only hub pages (safety, accreditation, ops) with zero live signal that omit some of their own children, and (b) dead-end detail records (the person record has three fields and no tabs). Systemic risks are data-truthfulness (`listOrgScoped`'s silent 100-row default cap — `/studio/calendar` shows the 100 *oldest* events; several pages compute "total" metrics from capped sets) and guard-rail gaps in shared chrome (unconfirmed bulk danger actions, invite revoke with no UI, "Copy Link" that navigates). Reports/documents hubs form a third visual dialect (no ModuleHeader, no i18n). Settings is a coherent IA, not a sprawl — though Billing shows the org's own AR invoices as "Recent invoices."

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|----|---------|---------|----------|----------|--------|----------------|
| B-01 | `/studio/calendar` | `listOrgScoped("events")` ascending, no limit → default cap 100 (`calendar/page.tsx:31-34`, `src/lib/db/resource.ts:197`). Calendar silently shows the 100 **oldest** events; orgs past 100 see a calendar frozen in the past | Correctness | **P0** | S | Query a date window around the visible month, no cap |
| B-02 | Bulk actions (7 pages) | Danger bulk (Deny/Delete/Void over up to 200 rows) executes immediately — no confirm, no undo (`DataTableInteractive.tsx:1216-1247`) | Safety | P1 | S | Route danger bulk through `useConfirm` with count |
| B-03 | `/studio/people/invites` | "Copy Link" is `<Button href=…>` — **navigates the admin to the accept-invite flow** instead of copying (`page.tsx:162-165`) | Broken control | P1 | S | `navigator.clipboard.writeText` + toast |
| B-04 | `/studio/people/invites` | `revokeInviteAction` exists (`actions.ts:148`) but zero UI consumers — cannot revoke or resend a pending invite | Capability gap | P1 | S | Revoke (confirm) + Resend on pending rows |
| B-05 | `/studio/settings/billing` | "Recent invoices" reads the org's **AR invoices** on the subscription billing page (`page.tsx:110-115,182-231`); also unfiltered by `source='ar'` | Wrong data model | P1 | M | Stripe subscription invoices; drop AR table |
| B-06 | board / incidents / time-off metrics | Absolute-total tiles computed from capped result sets (100/200/500) with no truncation indicator (`board/page.tsx:37-41`, `safety/incidents:56-80`, `time-off:49-69`) | Data honesty | P1 | M | `count:"exact", head:true` aggregates; "showing first N" |
| B-07 | `/studio/reports/[reportId]` | ~25/77 metrics always null → bare "—" with no affordance distinguishing "no backing data" vs zero vs unsupported (`ReportEngine.tsx:172`) | Reports UX | P1 | M | Per-null tooltip/footnote or suppress with coverage note |
| B-08 | `/studio/marketplace/offers` | Offers list has no talent/counterparty column — a booking pipeline where you can't see who is booked (`page.tsx:46-121`) | Capability gap | P1 | S | Join talent name as lead column |
| B-09 | `/studio/people/[personId]` | Person record is a dead end: 3 fields + remove; no tabs to assignments/tasks/time/certs though routes exist (`page.tsx:48-62`) | Dead-end detail | P1 | L | Record tabs (Assignments · Activity · Credentials · Time) |
| B-10 | Long-tail titles/labels | Em-dashes across dozens of ModuleHeader titles + labels (`safety/incidents/page.tsx:86` "Incidents — Unified", 8 venue titles, `settings/catalog/new:56`, more) — violates emphatic repo voice rule | Brand canon | P1 | M | Sweep to subtitle/hint; extend CI voice guard to `(platform)` |
| B-11 | `/studio/documents/[docType]` | Bad/foreign `recordId` silently falls back to sample showcase with no error (`page.tsx:38-48`) — easy to print fabricated numbers | States | P2 | S | Explicit "record not found / not bindable" alert |
| B-12 | `/studio/documents` hub | No record picker — binding requires arriving with `?recordId=`; binding indicator is a 6px dot | Capability | P2 | M | Record combobox per bindable type; labeled badge |
| B-13 | `/studio/reports` hub | 43 reports, no search/filter/status facet; template dot 6px `title`-only; no ModuleHeader, zero i18n — third visual dialect | Consistency | P2 | M | ModuleHeader + search + filters; i18n |
| B-14 | Report viewer | No period/date-range despite `cadence` metadata; no CSV of KPIs; snapshot API never called from console; brand toggle resets per view | Capability | P2 | M | Period param + snapshot save; persist brand choice |
| B-15 | `/studio/safety` hub | 12 label-only tiles, no live counts; omits its own children (briefings, osha, lost-found are ⌘K-only) | Scaffold hub | P2 | M | Descriptions + live counts; add missing tiles |
| B-16 | accreditation + ops hubs | Same label-only tile grids, zero signal | Scaffold hub | P2 | S | Counts/descriptions or fold |
| B-17 | `/studio/ops` vs `/studio/operations` | Two modules both titled "Operations" (`ops/page.tsx:9`) — duplicates in ⌘K/breadcrumbs | IA | P2 | S | Retitle or merge |
| B-18 | Incidents metrics | "Cyber" domain count from `ilike(summary, '%cyber%')` — string-matching free text as taxonomy | Data quality | P2 | M | Domain column/tag |
| B-19 | schedule + incidents | No realtime anywhere in studio except inbox chat — live ops timeline and incident feed need manual refresh on show day | Capability | P2 | M | `RealtimeRefresh` on events/shifts/incidents |
| B-20 | `/studio/import` | In-flight jobs don't poll; `catch { jobs = [] }` renders fetch failure as empty state (`page.tsx:14-18,46-51`) | States | P2 | S | Polling island; distinct error surface |
| B-21 | import vs settings/imports | Import split across two surfaces in different IA branches with near-identical descriptions | IA | P2 | S | Merge or cross-link |
| B-22 | marketplace + xpms hubs | Fetch every row (no limit) across 4 tables just to count in JS (`marketplace/page.tsx:33-38`, `xpms/page.tsx:31-35`) | Performance | P2 | S | `count:"exact", head:true` per tile |
| B-23 | `/studio/workforce` | `workforce_members` query unbounded — exactly where thousands of rows live (`page.tsx:92-100`) | Performance | P2 | S | Server pagination (`listOrgScopedPage` + `PagerNav`) |
| B-24 | People-domain IA | Three human directories over three stores (memberships/crew_members/workforce_members) in two modules, no cross-links | IA | P2 | L | Unified person search or cross-links |
| B-25 | 117 files `text-[10px]`, 4 `text-[9px]` | Violates the typography canon's 11px floor (`settings/catalog/[id]:113,126`, `SettingsSidebar.tsx:26,38`, `EventSpine.tsx:135`) | A11y / canon | P2 | M | Sweep to 11px/`.ps-caption`; ESLint guard |
| B-26 | Time-off deny | Denial requires no reason (RPC accepts `p_decision_note`, UI never collects) — crew get bare "denied" push | UX | P2 | S | Optional note on deny, pass to push |
| B-27 | Loading states | Only ~6 studio modules have `loading.tsx`; heavy pages (schedule, 592 lines of queries) blank whole-pane | States | P2 | S | `loading.tsx` for top-10 heaviest modules |
| B-28 | Settings hub | `DESCRIPTIONS` map hardcoded English amid i18n'd labels (`page.tsx:26-57`) | i18n | P3 | S | Key through `t()` |
| B-29 | time-off actions | Title-Case error copy vs sentence case in sibling action (`actions.ts:105,110,117`) | Copy | P3 | S | Sentence-case |
| B-30 | Catalog delete confirm | Leaks schema jargon: "keep their catalog_item_id" (`settings/catalog/[id]:102`) | Copy | P3 | S | Plain language |
| B-31 | Person remove confirm | "organisation" (British) vs "organization" elsewhere (`people/[personId]:79`) | Copy | P3 | S | Normalize |
| B-32 | Billing header | Title/subtitle inverted vs sibling settings pages (`billing/page.tsx:120-123`) | Consistency | P3 | S | Title "Billing" |
| B-33 | Billing plans grid | Tier cards have no upgrade/select CTA; only path is the portal button, disabled when Stripe unconfigured (`page.tsx:157-179`) | Capability | P3 | M | Per-tier CTA or collapse |
| B-34 | XPMS metrics | "UAC — Planned" em-dash + unexplained acronyms as primary labels | Copy | P3 | S | "Planned (UAC)" |

**Benchmarks (P0/P1s):**
- **B-01** Linear and Google Calendar fetch by visible range, never "first N rows of all time" — the viewport drives the query.
- **B-02** Linear confirms bulk destructive mutations with a count dialog + undo toast; Gmail's bulk archive ships one-click Undo.
- **B-03** Stripe's "Copy" affordances write to clipboard and flip to "Copied ✓" in place — never a navigation.
- **B-04** Vercel and Notion put Resend/Revoke inline on every pending-invite row; table-stakes team management.
- **B-05** Stripe-billed SaaS (Vercel, Linear) show the subscription's invoice history from the billing provider, strictly separated from product data.
- **B-06** Stripe Dashboard metrics are server-side aggregates; lists say "Showing 100 of 2,341" whenever truncated.
- **B-07** Vercel Analytics renders "No data yet" with a one-line reason and setup link per empty metric, never a bare dash.
- **B-08** ServiceTitan booking lists always lead with the customer — the "who" is never behind a click.
- **B-09** ServiceTitan/Rippling person records are tabbed hubs (jobs, timesheets, certifications).
- **B-10** Stripe enforces its terminology canon with lint-level checks over UI strings — canon lives in CI, not review memory.

## Pass C — GVTEWAY Portal (S148–S171) + Personal `/me` (S47–S64)

**Assessment.** The portal and `/me` shell have a strong skeleton — real data on most leaf pages, consistent tokenized styling, i18n plumbing, streaming skeletons, a genuinely deep client-proposal lifecycle (capability-gated approvals, change orders, revisions), and a thoughtful guide access-code/preview system — but they fall short of consumer-grade in three systemic ways. (1) **Mobile is effectively broken for navigation**: the persona rail is `hidden md:flex` with no drawer or tab-bar fallback anywhere in `(portal)`, so the phone-first external audience gets orphaned leaf pages. (2) **Capability promises outrun reality**: microcopy advertises "Pay invoices," "Buy · claim · transfer," vendor invoice submission, and a notification-preferences matrix saved to a table the delivery pipeline never reads. (3) **Persona parity is thin and leaky**: only 6 of 15 personas are reachable from the gateway, shared surfaces hardcode the crew/vendor rail for every persona, and thin personas (VIP, hospitality, delegation) show org-wide counts and hardcoded `@atlvs.pro` mailtos. `/me` is functional but engineer-flavored: raw enums, raw route strings as copy, no active-tab state, a "Booking Calendar" with no calendar.

**Positives worth keeping:** hard-404 slug anti-enumeration, `/p/select` auto-redirect with humane empty state, guide access-token/preview architecture, `DataTable` a11y, streaming `loading.tsx` skeletons, `ConnectivityBanner`, capability-gated proposal approvals.

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|----|---------|---------|----------|----------|--------|----------------|
| C-01 | Portal chrome (all 150 routes) | Persona nav rail is desktop-only (`hidden … md:flex`, `src/components/PortalRail.tsx:42`); no drawer/hamburger/tab bar in `(portal)`; `PortalSubpage` renders no breadcrumbs or back link (`src/components/PortalSubpage.tsx:24-31`) | Mobile | P1 | M | Mobile sheet/drawer rendering `portalNav` + default breadcrumbs in `PortalSubpage` |
| C-02 | Portal shared pages | tasks/inbox/announcements hardcode `portalNav(slug, "crew")` (`tasks/page.tsx:135`, `inbox/page.tsx:51`, `announcements/page.tsx:61`); messages hardcode `"vendor"` (`messages/page.tsx:68`, `[roomId]/page.tsx:91`) — a client sees vendor/crew nav | Persona parity | P1 | S | Resolve rail via `portalPersonaForSession(session.persona)` with neutral fallback |
| C-03 | Portal rail active state | No caller passes `currentPath` to `PortalRail`, so `aria-current`/`nav-item-active` are dead on every portal page (`PortalRail.tsx:70`) | A11y / wayfinding | P2 | S | Thread pathname into `PortalRail` |
| C-04 | `/p/[slug]` gateway | Lists only 6 of 15 personas (`page.tsx:87-118`); 9 persona homes reachable only by typed URL; `portalPersonaForSession` maps only 4 session personas (`src/lib/nav.ts:1213-1230`) | Persona parity | P1 | S | Route straight to viewer's persona home; full grid behind operator preview |
| C-05 | Guest/me tickets | Scan code rendered as monospace text (`guest/tickets/page.tsx:93`, `me/tickets`) — no QR/barcode/wallet pass (QR exists only in `/m/wallet`); guest home promises "Buy · claim · transfer" with none implemented (`guest/page.tsx:32`) | Capability gap | P1 | M | Render scannable pass per ticket (qrcode dep already in package.json); cut or implement buy/claim/transfer |
| C-06 | `/p/[slug]/guest/tickets` | Query is project-scoped not viewer-scoped: shows ALL guests' names/emails + active scan codes (limit 500) (`page.tsx:39-48,93-108`) — fraud/privacy vector; external holders see empty table under RLS | Privacy / states | P1 | M | Scope to `listMyAssignments` + claimed-email path for external holders |
| C-07 | Client invoices | Copy promises "Pay invoices and download receipts" (`page.tsx:33,41`) but no Pay button despite `/api/v1/stripe/checkout` existing | Capability gap | P1 | M | Pay action on open invoices wired to Stripe checkout |
| C-08 | Vendor invoices | No in-portal invoice submission; empty state tells external vendor to "Submit an invoice through the console or API" — vendor has neither (`page.tsx:44`) | Capability gap | P1 | M | Vendor invoice-submission form (amount, PO ref, upload to receipts bucket) |
| C-09 | Portal messages thread | Loads oldest 200 rows ascending (`[roomId]/page.tsx:64-69`); past 200 messages, new messages never render | Correctness | P1 | S | Newest-first fetch + reverse; "load earlier" pagination |
| C-10 | Messages list + room | No message preview or unread badge; no scroll-to-latest; composer placeholder-labeled only (`[roomId]/page.tsx:161-168`); raw enum persona chip | Interaction / a11y | P2 | M | Snippet + unread count; `aria-label` composer; humanize chip |
| C-11 | VIP/hospitality/delegation homes | KPI cards count org-wide rows, not viewer/project-scoped (`vip/page.tsx:28-39`, `hospitality/page.tsx:31-39`, `delegation/page.tsx:35-40`); "Status: Live" hardcoded; "T1 Runs" internal jargon | States / trust | P2 | M | Scope counts; plain-language labels; drop fake metric |
| C-12 | VIP/hospitality/apply footers | Hardcoded `vip@`/`hospitality@`/`accreditation@atlvs.pro` mailtos bypass org branding (`vip/page.tsx:90`, `hospitality/page.tsx:95`, `apply/page.tsx:125`) | White-label | P2 | S | Route through org branding or AM Messages thread |
| C-13 | `/p/[slug]/apply` | "Start a New Application" is a mailto (with em-dash subject) — no in-app accreditation form (`apply/page.tsx:124-129`) | Capability gap | P2 | M | Build the application form; email fallback |
| C-14 | PortalDocVault | Vault rows have no open/download action (`PortalDocVault.tsx:64-90`) though signed-URL endpoint exists; hardcoded English headers | Capability gap | P2 | S | Link title → download; i18n headers |
| C-15 | Persona homes (client/vendor/artist/sponsor/guest) | Static tile grids with zero live data — no counts, no "needs your attention" (`client/page.tsx:27-60`, `vendor/page.tsx:27-59`) | Polish / states | P2 | M | Per-tile counts + attention strip |
| C-16 | Persona chrome consistency | Three chrome patterns coexist (rail+header / header-only / bare page — `crew/advances/page.tsx:45-57` has neither); `PortalSubpage` type union stops at 6 personas (`PortalSubpage.tsx:16`) | Consistency | P2 | M | Normalize all 15 personas onto extended `PortalSubpage` |
| C-17 | `(portal)/error.tsx` | Renders raw `error.message` to external users (`error.tsx:21`) — internal errors leak to clients/vendors | Trust | P2 | S | Generic message + support link; keep digest for Sentry |
| C-18 | `/p` + `/p/discover` | Hardcoded demo `TicketCTA`s — fake `sold_out`/`owned` states, static dice.fm/ra.co links (`discover/page.tsx:83-88`) on production surface | Polish | P2 | S | Real event-linked CTAs |
| C-19 | ShareSheet + Discover | Hardcoded English strings in otherwise i18n'd shell (`ShareSheet.tsx:34-81`, `discover/page.tsx:30-40`) | i18n | P3 | S | Run through catalog |
| C-20 | Gateway persona picking | No pre-selection/badging of viewer's own persona; no first-run explanation for invitees | Onboarding | P2 | M | Auto-route session persona; grid behind operator preview |
| C-21 | Portal copy | Em-dashes in user-facing copy (`hospitality/page.tsx:62`, `vip/page.tsx:93`, guide intro) — violates repo voice rule | Voice canon | P3 | S | Sweep `(portal)`+`(personal)` for em-dashes |
| C-22 | `/me/notifications` | Prefs matrix saves to `user_preferences.ui_state.notifications` (`notifications/actions.ts:23-39`) but delivery reads `notification_preferences.matrix[PushKind]` (`push/send.ts:310-320`) with a different taxonomy — the whole page is a placebo | Correctness | P1 | M | Rebind to `notification_preferences` + `notification_kind_catalog` (as `/m/settings/notifications` does) |
| C-23 | `/me/availability` | "Booking Calendar" with no calendar grid; past slots under "Upcoming" (no `gte now()`, `page.tsx:28-33`); server-locale `toLocaleString()` (`page.tsx:102`); "Hold — Auto-release on TTL" jargon; unconfirmed single-click removal | Interaction | P2 | M | Month grid; past/upcoming split; request formatters; confirm on remove |
| C-24 | `/me/talent` EPK editor | Handle auto-generated, never editable (`actions.ts:69`); no photo upload for an EPK; raw routes as copy (`page.tsx:54-57,133`); silent fee coercion to null (`actions.ts:28-32`) | Capability / polish | P2 | M | Editable handle + availability check; image upload; human copy; validation feedback |
| C-25 | `/me/offers` | Cards omit act/buyer/venue — raw `performance_date` as title (`page.tsx:74`); `formatMoney` drops currency (`page.tsx:78`); one-tap Accept on a binding 60%-deposit offer, no confirm/terms recap (`MyOfferActions.tsx:30-41`) | Trust | P2 | M | Join names; pass currency; confirm sheet restating fee/deposit/date |
| C-26 | `/me` home | `h1` is raw email (`page.tsx:70`); raw enums `member`/`pro` in cards (`page.tsx:85,93`) | Polish | P3 | S | Display name; humanized labels |
| C-27 | `/me` nav | Tabs never mark active route — no `aria-current`/active class (`(personal)/layout.tsx:76-80`) | A11y / wayfinding | P2 | S | Compute active from pathname |
| C-28 | `/me/organizations` | Rows inert — no switch/leave/manage despite "Memberships and switcher" promise (`me/page.tsx:190`); empty state points marketplace users to a console they can't access (`organizations/page.tsx:47`) | Capability gap | P2 | M | Set-active-workspace action; member-appropriate empty state |
| C-29 | `/me/security` | "Last changed when you signed up" hardcoded guess (`page.tsx:58`); token hint exposes internals ("Supabase service-role keys", `page.tsx:147`) | Microcopy | P3 | S | Real timestamp or drop; rewrite hint |
| C-30 | Forms a11y (`/me` + portal) | Unassociated labels: talent bio textarea (`talent/page.tsx:98-107`), availability Kind select (`availability/page.tsx:59-64`); matrix checkboxes no accessible name (`notifications/page.tsx:93`) | A11y (WCAG 1.3.1) | P2 | S | `htmlFor`+`id` or use `Input`/`Select` primitives; `aria-label` per checkbox |
| C-31 | Portal notifications | No email digest, no rail unread badge, no portal-side notification prefs surface (personas can't reach `/m/settings/notifications`) | Capability gap | P2 | L | Portal notification prefs bound to `notification_preferences` |
| C-32 | Guide unlock (positive + gap) | Access-code unlock, tier-gated `?as=` preview, PDF download are strong; unpublished state offers no notify-me/contact (`guide/page.tsx:153-171`) | States | P3 | S | "Message the team" link on unpublished state |

**Benchmarks (P1s):**
- **C-01** Stripe billing portal / Airbnb keep full nav reachable at every width; no surface is more than one tap from its section switcher.
- **C-02** Intercom/HoneyBook client portals render one persona-correct nav everywhere — a client never sees contractor tooling.
- **C-04** Airbnb resolves you straight into guest or host; role choice only appears when you genuinely hold both.
- **C-05** DICE/Eventbrite treat the ticket as a first-class scannable artifact — full-screen QR, brightness boost, wallet pass.
- **C-06** DICE shows only *your* tickets; no consumer ticketing product exposes other holders' identities or live entry codes.
- **C-07** Stripe invoicing puts "Pay now" as the primary action on every open invoice; saying "pay" without accepting payment erodes trust at the revenue moment.
- **C-08** HoneyBook/Bill.com vendor portals let vendors submit invoices against a PO with attachments in-portal; "use the API" is not an answer for SMB vendors.
- **C-09** Linear/Intercom threads paginate from newest backwards; a chat that silently stops showing new messages is a correctness failure.
- **C-22** Stripe's notification settings are contractually honest — every toggle maps 1:1 to a delivery gate; a placebo settings page is worse than none.

## Pass D — COMPVSS Field PWA (S172–S199) + LEG3ND (S200–S219)

**Assessment.** The "offline-first" claim is **half true and the wrong half works**: the service worker (`public/service-worker.js`) is genuinely sophisticated offline engineering — IndexedDB punch/scan queue, background-sync replay, FIFO-per-endpoint, 4xx-terminal/5xx-retry semantics, capture-time stamping — but it queues POSTs to four `/api/v1/*` endpoints that **no first-party UI ever calls**. Every real field write (clock in/out, gate scan, inventory scan, incident quick-file) goes through Next server actions, which the SW doesn't intercept, so an offline punch throws into the error boundary and is lost while the banner explicitly promises "clock punches and scans will queue." Reads are cache-first with no staleness indicator. Beyond offline, COMPVSS is far better than scaffold-grade — kit-consistent screens, enforced 44px targets, reduced-motion support, honest empty states, real optimistic+queued chat — but the flagship interactions have hollow cores: the primary gate scanner's camera never decodes (the real `CameraScanner` decoder is only wired to `/m/door`), `/m/scan` decodes but persists nothing, and the Rose credential's "QR" is a decorative hash matrix with a client-side `Math.random()` token no scanner can verify. LEG3ND, by contrast, is a coherent learning product — enroll → lesson progress → server-scored assessment (answers never shipped to the client) → cert wallet with recert-window states — with only P2/P3 polish gaps.

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|---|---|---|---|---|---|---|
| D-01 | /m offline layer | SW offline queue is dead code for its own targets: `QUEUEABLE_ENDPOINTS` (`public/service-worker.js:21-27`) has zero UI callers; clock/punch use server actions (`clock/actions.ts:14,44`), gate scan uses `scanCode` action (`check-in/actions.ts:23`). Offline, the action fetch throws inside `startTransition` (`PunchControls.tsx:48-56`) → error boundary, write lost | Offline | **P0** | M | Route field writes through the queueable API endpoints (checkin API already supports `at` replay + GPS) |
| D-02 | ConnectivityBanner / offline.html | Copy promises "Scans and clock punches will queue" (`GlobalBanner.tsx:107`, `offline.html:48`) — false for every current flow. Safety-adjacent trust failure | Offline | P1 | S | Fix D-01 or correct the copy immediately |
| D-03 | /m reads | SW is cache-FIRST for all same-origin GETs incl. RSC (`service-worker.js:324-348`): stale rosters/schedules with no "last synced" indicator | Offline | P1 | M | Stale-served signal (SW message + timestamp chip) or network-first RSC with cache fallback |
| D-04 | /m/check-in | Primary gate scanner's camera never decodes — `CameraReticle` is a `getUserMedia` preview only (`CheckInScanner.tsx:242-307`); all scans typed manually. Real decoder (`scanners/CameraScanner.tsx`, BarcodeDetector + zxing + torch) wired only to `/m/door` | Interaction | P1 | S | Swap `CameraReticle` for `CameraScanner` feeding `scanCode` |
| D-05 | /m/wallet Rose | Rose credential's flip-to-QR is fake: decorative FNV-hash matrix, not a QR symbology; "single-use token" is client `Math.random()`, never minted server-side (`RoseCard.tsx:11-14,34-50,96-113`) — no scanner can verify it | Interaction | P1 | L | Real QR of an `assignment_scan_codes` token; server-minted rotation |
| D-06 | /m/scan | "Quick Scan" decodes but persists nothing: `ScanCapture` mounted without `onCapture` (`scan/page.tsx:28-38`) — captures live in a 10-row session log | Interaction | P1 | S | Wire `onCapture` to `/api/v1/scan` (so the D-01 queue applies) |
| D-07 | /m/door | Single-flight guard drops scans during flight (`DoorScanner.tsx:80-81`); on throw, `inFlightRef` stays true → scanner bricked until reload (reset only on success path, `:86-99`) | Interaction | P2 | S | try/finally reset; buffer decodes during flight |
| D-08 | Scan/punch feedback | Zero non-visual feedback: `src/lib/haptics.ts` has no consumers, no audio cue at the door, `PullToRefresh.tsx` mounted nowhere | Field UX | P2 | S | Haptic + beep on scan result; mount PullToRefresh on lists |
| D-09 | /m/clock geofence | `time_clock_zones` + `classifyPunch` + API lat/lng path exist, but `clockIn` captures no GPS and does no zone classification (`clock/actions.ts:27-32`) | Capability | P2 | M | Capture position; record `geofence_state` on punch |
| D-10 | /m tab bar | Badge plumbing never fed: layout passes no `badges` (`(mobile)/layout.tsx:80` vs `MobileTabBarClient.tsx:73`); no `navigator.setAppBadge` anywhere | Capability | P2 | M | Pass unread counts (already computed for HomeShell) + App Badging API |
| D-11 | PWA install | No `beforeinstallprompt` handling / A2HS prompt anywhere | Capability | P2 | S | Dismissible install prompt + iOS coach mark |
| D-12 | manifest.json | `theme_color: "#E9A23B"` is retired amber (live accent `#FFC400`); manifest linked from ROOT layout (`layout.tsx:104`) so all shells advertise the COMPVSS manifest (`start_url: /m`) | Consistency | P2 | S | Update color; scope manifest to mobile shell |
| D-13 | Offline architecture | Two disjoint offline systems: SW IndexedDB queue (+`SyncBanner` polling a queue that can never fill) vs localStorage `useOfflineQueue` (chat + daily-log only), each with a different banner | Offline | P2 | M | Converge on one durable IndexedDB outbox |
| D-14 | /m navigation | One group-level `loading.tsx` for 54 `force-dynamic` routes — no skeleton on sibling navigation over slow venue networks | States | P2 | M | Per-route `loading.tsx` for tab roots + heavy lists |
| D-15 | /m typography | Sub-11px text: tab labels ≈9.9px (`MobileTabBarClient.tsx:79`); kit CSS ships 9–10.5px classes (`kit-mobile.css:8,19,44,57,374`) — sunlight legibility for the core audience | A11y | P2 | S | Raise to ≥11px per MONUMENT floor |
| D-16 | /m tab bar | 7 tabs vs the kit's documented 6-tab model (`nav.ts:1580-1590` vs KIT_CANON) ≈53px/tab at 375px | Consistency | P3 | S | Revise canon or fold Onsite |
| D-17 | /m/inventory/scan | Named "scan" but manual-entry only — no `CameraScanner` | Interaction | P2 | S | Same fix as D-04 |
| D-18 | /m/door results | Raw enums shown to operators ("not_found", "duplicate") untranslated (`DoorScanner.tsx:169-178,199`) | Polish | P3 | S | Label map, i18n'd |
| D-19 | KIT_CANON.md + offline.html | Canon still declares retired amber `#E9A23B` (`KIT_CANON.md:18-20`); `offline.html` hardcodes it and its retry button is ~37px (< 44px floor) | Consistency | P3 | S | Sweep stale amber; retoken offline.html |
| D-20 | /m/emergency | Fire/Evacuate/Shelter tiles all link to the same `/m/guide` top, no section anchors (`emergency/page.tsx:128-146`) | Interaction | P3 | S | Deep-link guide sections |
| D-21 | /m/more | Hub omits reachable surfaces (Wallet, Time Off, Alerts, Emergency, Handover, Daily Log, CoC in `mobileSurfaces` but not More groups) | IA | P3 | S | Add missing rows |
| D-22 | /m list screens | KIT_CANON mandates `ActionBar` on every list screen; adoption is 9 views — feed, gigs, market, incidents, alerts, time-off have no search/filter cluster | Consistency | P3 | M | Extend ActionBar |
| D-23 | /m strengths (baseline) | Enforced ≥44px targets (`kit-mobile.css:405-425`), reduced-motion kill switch, safe-area padding, honest empty states, optimistic + durable chat — the bar new /m work must meet | — | — | — |
| D-24 | (legend) signage | Layout doc declares signage part of the anon public funnel but the page calls `requireSession()` + org-scopes (`signage/page.tsx:28-33`) | Consistency | P2 | S | Anon published-sign view or fix the doc |
| D-25 | (legend) signage | Raw `<a>` instead of `next/link` → full reloads (`signage/page.tsx:59-63`); no category filter/search over 200 signs | Polish | P3 | S | `<Link>` + facet row |
| D-26 | (legend) home | Tiles hardcode `/studio/*` hrefs instead of `urlFor("platform", …)` (`legend/page.tsx:17,38,53`) — breaches cross-shell URL canon | Consistency | P3 | S | Route through `urlFor` |
| D-27 | (legend) lessons | Media resume is localStorage-only (`lesson/[id]/page.tsx:51,136`) — no cross-device resume; no auto-complete on media end | LMS depth | P3 | M | Persist position to `lesson_progress`; auto-complete ≥90% |
| D-28 | (legend) certifications | Cert wallet has no share/export artifact — no PDF, no verification URL/QR, no wallet pass | Capability | P3 | M | Public verify link + printable cert via documents engine |
| D-29 | (legend) strengths (baseline) | Real learning spine: enrollment + `lesson_progress`, server-scored assessments (no `correctIndex` client-side, `AssessmentRunner.tsx:12-16`), cert issuance, recert windows, manager-gated engine with AccessDenied | — | — | — |

**Benchmarks (P0/P1s):**
- **D-01** Connecteam/Workyard persist punches + GPS locally and replay transparently; ServiceTitan Mobile ships a full offline visit mode. An offline punch that produces an error screen and a lost entry fails the category's table-stakes test.
- **D-02** Field apps that surface sync state only earn trust because the promise is true; a false "your punch is queued" is worse than no offline support — the worker walks away believing they're on the clock.
- **D-03** Offline-first exemplars (Google Docs, Linear) always mark stale data ("Last updated 2h ago"); serving yesterday's crew schedule unmarked is how people show up to the wrong call time.
- **D-04** Every competitor gate/asset scanner decodes live camera frames in <500ms; a camera that films but never reads is slower than paper at a gate line.
- **D-05** Real credential wallets (Apple Wallet, Ticketmaster SafeTix) rotate server-verifiable tokens rendered as genuine scannable barcodes — SafeTix-style rotation is precisely what the Rose copy claims and the implementation cannot deliver.
- **D-06** Sortly/Workyard quick-scan flows always land captures somewhere durable; a scanner whose output evaporates trains crews to distrust the tool.

## Pass E — Marketing (S1–S34) + Auth (S35–S46) + Token flows (S65–S79) + Email system (S230)

**Assessment.** Marketing, auth, and token-gated surfaces are far more mature than a typical scaffold — 86/93 marketing pages carry `buildMetadata` with OG images, JSON-LD, canonical CTAs, and hreflang plumbing; the auth shell (OAuth, password strength, MFA + hashed recovery codes, magic-link fallback, safe-`next` handling, invite auto-claim in `/auth/resolve`) is near Clerk-grade. The failures concentrate at the *ends* of the funnels: the sitewide "Book a Walkthrough" CTA terminates in a `mailto:` form that silently drops leads; the anonymous e-signature page asks people to sign a document it never displays; token surfaces are crawlable with no `noindex`; and the email system is effectively three ad-hoc emails (invite, proposal share, automations) while a fully built CAN-SPAM-compliant email kit (`src/components/email/`) sits unused — so nearly every critical business event (proposal signed, assignment/ticket issued, offer decided, invoice sent) generates no email to anyone, and Supabase's default unbranded auth emails carry the entire signup funnel.

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|---|---|---|---|---|---|---|
| E-01 | `/contact` | Lead form posts via `action="mailto:sales@atlvs.pro"` (`contact/page.tsx:117`) — mailto POST silently drops data in modern browsers. The canonical sitewide CTA ("Book a Walkthrough" → `/contact`, `src/lib/seo.ts:20`) funnels every page here | Dead flow | **P0** | S | Server action → lead row + `sendEmail` to sales; success state |
| E-02 | `/sign/[token]` | E-sign page renders only the envelope *title* — signer draws a legally binding signature without the document ever being displayed (`sign/[token]/page.tsx:36-47`) | Legal UX | **P0** | M | Render document content above the pad; block signing until scrolled |
| E-03 | Token surfaces SEO | `/proposals` `/sign` `/msa` `/share` have no `robots: noindex` and `robots.ts:24` doesn't disallow them — confidential contracts indexable once a link leaks (offer + forms flows DO set noindex) | Privacy | P1 | S | noindex layouts + robots.ts disallow |
| E-04 | Proposal signing | `signProposalAction` sends no notification to the org and no receipt to the signer; `signer_email` captured then never used (`proposals/[token]/actions.ts:36-126`) | Lifecycle email | P1 | M | `notifyOrgAdmins` + emailed receipt (pattern exists in `offer/[token]/actions.ts:25-50`) |
| E-05 | /offer + /msa unlock | Multi-tenant flow hardcodes one client: "GHXSTSHIP × Five Senses Group" lockup + personal email `julian.clarkson@ghxstship.pro` shown to every org's recipients (`offer/[token]/UnlockForm.tsx:18,54`, `msa/[token]/UnlockForm.tsx:54`) | White-label | P1 | S | Derive org from letter row; support email from org branding |
| E-06 | Email coverage | Only 3 product emails exist (invite, proposal share, automations). No email for: assignment/ticket issued (external holders receive nothing), invoice issued, offer decided, time-off decisions, envelope completion, form submissions | Email system | P1 | L | Prioritize externally-facing events — recipients without app accounts have no other channel |
| E-07 | Auth emails | Signup/magic-link/reset ship Supabase default templates — every block in `supabase/config.toml:241-258` commented out; the highest-volume emails are unbranded | Email / brand | P1 | S | Author from the existing kit (`templates.ts` has `verifyEmail`) + wire into config |
| E-08 | `/share/[token]` | Every share link dead-ends: "interactive view … coming soon" for ALL resource types (`share/[token]/page.tsx:68-111,167-178`) while console RecordShare mints these links | Dead flow | P1 | L | Dispatch to existing public renderers; hide share UI for unwired types |
| E-09 | `/status` | Hardcoded all-"operational" array (`status/page.tsx:22-29`) — during a real outage it asserts health; no incident history, no subscribe | Trust | P1 | M | Real probe or third-party provider |
| E-10 | Email kit | Polished kit (`src/components/email/` — layout w/ preheader + MSO fixes, CAN-SPAM footer, 4 templates) has zero importers; live emails are hand-rolled inline HTML | Dead code | P2 | M | Route invites + proposal share through the kit |
| E-11 | Email quality | No plain-text alternative, no preheader, no unsubscribe/prefs link, no dark-mode handling (`email.ts:47-81,106-138`) | Email quality | P2 | M | Auto-derive `text`; prefs link in footer |
| E-12 | Invite email | "You're invited to join **a ATLVS** Technologies workspace" grammar bug; body skips `wrapEmailHtml`; send failure `void`-discarded (`invites/actions.ts:115-123`) | Copy | P2 | S | Fix grammar; wrap; surface failure |
| E-13 | i18n roots | `/es-ES` `/pt-BR` are single hardcoded homepages; every link exits to English — despite full 16k-key catalogs | i18n | P2 | L | Locale-prefix routing reusing catalogs, or drop hreflang promises |
| E-14 | Auth titles | No auth page except MFA exports metadata — login/signup/reset show the root default tab title | Meta | P2 | S | `generateMetadata` per page |
| E-15 | Marketing perf | Whole 93-page site renders per-request: `getRequestT()` reads cookies/headers; 33 pages `force-dynamic`; `compare/*` `revalidate = 300` defeated by the same call | Performance | P2 | M | Static/en path with ISR for anonymous traffic |
| E-16 | CookieConsent | Full-screen blocking modal with `hideCloseButton` (`CookieConsent.tsx:79-81`); ESC stores nothing so it re-opens every nav | Compliance UX | P2 | M | Non-blocking bottom banner (Linear/Stripe pattern) |
| E-17 | Pricing CTAs | Tiers advertise "14-day trial" but CTA is bare `/signup` with no plan param and no trial mechanics exist (`pricing/page.tsx:67-68,85-86`) | Pricing | P2 | M | Carry `?plan=` through signup, or relabel |
| E-18 | `/demo` funnel | "See it in action" contains no demo — text pages whose CTAs loop back to `/signup` and the broken E-01 form (`demo/[persona]/page.tsx:63-64`) | Dead flow | P2 | L | Product tour/video or real scheduler |
| E-19 | /sign lifecycle | No envelope voided/declined/expired handling, no token expiry, no post-sign download, no completion email (`sign/[token]/page.tsx:28-37`) | Token flow | P2 | M | State gating + expiry + signed-copy download + receipt |
| E-20 | E-sign consent | `/sign` + proposal SignatureBlock carry no e-signature consent/disclosure; offer flow has the right language (`ResponseForms.tsx:104`) but sign/proposal don't; proposal records no IP/UA | Legal UX | P2 | S | Port consent line + evidence capture |
| E-21 | Email transport | `sendEmail` silently no-ops `{ok:true}` when `RESEND_API_KEY` absent (`email.ts:107-110`) — no one can tell email is off | Observability | P2 | S | `{ok, skipped}` + settings banner |
| E-22 | Marketplace inquire | Inquiry inserts via RPC with no email/notify to the subject org — orgs must poll the console for inbound demand (`_inquire/actions.ts:45-63`) | Lifecycle | P2 | M | `notifyOrgAdmins` + email on insert |
| E-23 | Marketplace form pages | The 7 inquire/apply/submit pages are the only marketing routes without metadata | Meta | P3 | S | Explicit noindex |
| E-24 | `/msa/[token]` | No layout wrapper (unlike offer): toolbar renders full-viewport while document centers at `max-w-3xl`; no noindex/title | Layout | P3 | S | `msa/layout.tsx` mirroring offer shell |
| E-25 | Homepage | "Latest" rail hardcodes dates (`2026 · 05 · 12`) linking to generic indexes — guaranteed stale | Content | P3 | S | Drive from data source or drop dates |
| E-26 | Marketing imagery | Near-zero product visuals across 93 pages (hero is a CSS mock) — features/solutions 100% text | Content depth | P3 | L | Real console captures on top-5 pages |
| E-27 | MFA recovery | Recovery code consumed but session stays aal1 → redirected to re-enroll with no explanatory copy (`mfa/challenge/actions.ts:79-90`) | Auth UX | P3 | S | Interstitial copy |
| E-28 | Compare pages vs canon | Voice canon says "Never compare to competitors" yet 25 named-competitor compare/alternatives pages ship (`src/lib/compare.ts`) | Governance | P3 | S | Reconcile canon or surface |

**Benchmarks (P0/P1s):**
- **E-01** Stripe/Linear contact forms post to a backend with instant confirmation and CRM capture; neither uses `mailto:` in a conversion path.
- **E-02** DocuSign/Dropbox Sign never separate signature capture from document display — the signer scrolls the full document before Finish activates.
- **E-03** DocuSign signing URLs and Stripe invoice links are served `noindex` and robots-excluded; confidential-by-URL surfaces are never crawlable.
- **E-04** DocuSign/PandaDoc email both parties a completion certificate + executed copy within seconds.
- **E-05** Dropbox Sign white-labels every recipient-facing screen with the sending account's brand.
- **E-06** Stripe emails every externally-relevant event because counterparties can't be assumed to have dashboard access; Linear emails invite/assignment/mention with per-kind prefs.
- **E-07** Clerk/Vercel send fully branded verification emails from their own domain — the first email a user receives is the brand test.
- **E-08** Linear/Notion share links resolve to a real read-only render; a "coming soon" terminal state for a shipped share feature doesn't exist in any benchmark product.
- **E-09** Vercel/Stripe status pages show live probe data, incident history, and subscribe — a static "all operational" page is a trust liability the moment there's an incident.

## Pass F — Cross-cutting: design system, states, performance, keyboard, theming, i18n, API DX, notifications (S220–S238)

**Assessment.** A far stronger cross-cutting foundation than raw counts suggest: core interactive primitives are overwhelmingly Radix-backed with a hand-rolled tier that mostly follows correct ARIA patterns (Slider, Carousel, PinInput, Pagination all carry deliberate AX-annotated work); FormShell is genuinely excellent; reduced-motion/forced-colors/prefers-contrast/print/RTL are present and test-guarded; and 7 full 16k-key locale catalogs cover the console, not just marketing. The real gaps are systemic rather than component-level: a silent 100-row cap on 77 list surfaces with zero pagination UI (the data-scale blocker), a split-brain notification-preferences system where the desktop matrix writes a store nothing reads, ~124 date-format call sites bypassing the i18n formatter SSOT, three coexisting toast APIs (one an exported runtime trap), a 4-shortcut "keyboard-first" story, near-zero intra-page streaming, and a bimodal OpenAPI spec (a few exemplary paths, ~100 skeletal ones).

| ID | Surface | Finding | Category | Severity | Effort | Recommendation |
|---|---|---|---|---|---|---|
| F-01 | `src/lib/db/resource.ts:197` + 77 callers | `listOrgScoped` silently caps at 100 rows; list pages render the capped set with no truncation indicator; `ui/Pagination` used by **0** app pages; `DataTableInteractive` paginates client-side over already-truncated data. Orgs with >100 clients/vendors/invoices silently lose records | Data scale | **P0** | L | Migrate high-cardinality lists to `listOrgScopedPage` + mount `Pagination`; interim "showing first 100" banner when `rows.length === 100` |
| F-02 | `/me/notifications` vs `push/send.ts:310-323` | Split-brain prefs: desktop matrix writes `user_preferences.ui_state.notifications`; fan-out reads only `notification_preferences.matrix` (written solely by `/m/notifications`). Every desktop toggle is decorative | Notifications | P1 | M | One store + one kind taxonomy; `/me/notifications` becomes a second view of it |
| F-03 | Notification channels | Matrix offers Email (default ON) and Slack columns but no per-kind email/slack fan-out exists — `sendEmail` called only from invites, proposal-share, automations | Notifications | P1 | L | Build the email digest/fan-out gated on the matrix, or remove the columns |
| F-04 | `useHotkeys.ts` + ShortcutDialog | Entire global shortcut inventory is 4 (`mod+k`, `?`, `mod+b`, `/`). No g-navigation, no j/k, no x select, no c create; `ShortcutDialog.tsx:23` declares "Editor"/"Table" groups nothing registers into | Keyboard | P1 | M | g+letter chords for 11 rail groups; j/k/x/Enter on tables; `c` for CreateMenu |
| F-05 | 124 date call sites | 65 files `toLocaleDateString("en-US")` + 59 bare — despite `i18n/format.ts:1-3` ("use these everywhere"). Non-US locales (full catalogs shipped) see US dates across core surfaces | i18n | P1 | M | Sweep to `formatDate`/`useFormatters`; ESLint ban |
| F-06 | `ui/Toast.tsx` + barrel | Three toast APIs: dead `ToastProvider` (never mounted) whose `useToast` is exported from the ui barrel — **importing it throws at runtime**; the sanctioned sonner wrapper (9 files); 20+ files importing `sonner` directly | Design system | P1 | S | Delete `ui/Toast.tsx` + export; codemod direct imports |
| F-07 | 8 files with `<Suspense>` / 1,173 pages | Intra-page streaming nearly absent; heavy dashboards block full navigation on the slowest query behind one generic list skeleton | States | P2 | L | Suspense islands on top-20 slowest pages |
| F-08 | 8 shell-level `error.tsx` | One throwing widget blows away the entire console page; no segment-level error.tsx, no boundaries around streamed islands | States | P2 | M | error.tsx at the 6 sub-segments with loading.tsx; wrap islands |
| F-09 | `ui/RichTextEditor.tsx:43,96-101` | Deprecated `execCommand`; contentEditable has no `role="textbox"`/`aria-multiline`/name; toolbar has no `aria-pressed`; seeds via `dangerouslySetInnerHTML` with no visible sanitizer | Design system | P2 | M | ARIA + `queryCommandState`; converge on the Tiptap editor already in collaborate/docs |
| F-10 | `docs/api/openapi.yaml` | Bimodal: `/api/v1/projects` exemplary but only 20 operationIds, 2 documented 429s, 23 401s across 141 paths — most are 2-line stubs | API DX | P2 | M | Apply the /projects template mechanically; extend drift test to require it |
| F-11 | Webhooks settings | DX stops at endpoint CRUD + last-delivery denorms: no delivery log, no test event, no redelivery, no secret rotation | API DX | P2 | L | `webhook_deliveries` log + test-ping + redeliver |
| F-12 | 7 `next/image` files vs 47 raw `<img>` | Image optimization nearly unused — marketing/personal layouts, AuthShell, galleries ship raw `<img>` (no srcset/lazy/CLS sizing) | Performance | P2 | M | Convert layout/marketing/gallery instances |
| F-13 | `RealtimeRefresh` — 4 mounts | Realtime is chat-only + NotificationsBell + audit viewer; feed, My Work, approvals, dashboards, schedule are static; the CLAUDE.md-documented `/m/feed` mount no longer exists | Notifications | P2 | S | Re-mount on feed + approvals; document coverage |
| F-14 | Chart contrast | 46 contrast pairs cover text/CTA/focus only; `--chart-1..8` not contrast-certified; colorblind-safe palette + dash patterns exist (`[data-chart="safe"]`) but nothing sets them | Theming | P2 | S | Certify charts at 3:1; expose safe palette as preference |
| F-15 | `proxy.ts:164-171` | Rate-limit headers only on 429 — no proactive quota headers on success | API DX | P3 | S | Emit remaining/reset on all responses, Stripe-style |
| F-16 | `src/messages/*.json` | en = 16,270 keys; locales = 16,252 — 18-key drift, no CI parity guard | i18n | P3 | S | Parity test + backfill |
| F-17 | `ui/SignaturePad.tsx` | Canvas has no keyboard/AT alternative, no role/label (mitigated at form level by `SignatureField` typed mode) | Design system | P3 | S | role+label + documented pairing rule |
| F-18 | `DataTableInteractive.tsx:1334` | Row-select checkbox label is `Select row ${row.id}` — a raw UUID read aloud | Design system | P3 | S | Label with first visible cell value |
| F-19 | `components/charts/*` | Recharts (~100KB gz) statically imported by chart primitives; only report surfaces wrap in `next/dynamic`. (Bundle discipline otherwise exemplary: 3 client page.tsx in 1,173; tiptap/whiteboard/BIM/map all dynamic) | Performance | P3 | S | Dynamic re-export with Skeleton fallback |
| F-20 | `/api-docs` microsite | Static schema dump, drift-guarded but no curl/SDK examples, no deep links, no try-it. PAT page is good | API DX | P3 | M | Copyable curl per operation + anchors |
| F-21 | 13 loading.tsx / 1,173 pages | Navigation never blank, but 1,100+ pages share one list-variant skeleton regardless of shape | States | P3 | M | Matched skeleton variants at high-traffic segments |
| F-22 | UndoStack / LiveRegion | Both real and wired (LiveRegion in root layout; UndoStack backs inline editing only). Undo doesn't extend beyond inline edit + one-shot delete toasts | Design system | P3 | M | Extend `useEditHistory`; standardize delete-undo |
| F-23 | `ui/FilterBar.tsx` | Applying a filter gives no live-region announcement of the new result count | Design system | P3 | S | Announce "N results" via `useAnnounce` |
| F-24 | Tooltip/DatePicker/Combobox/Dialog/Sheet/Tabs | **Positive (no action):** Radix-grade a11y throughout — Tooltip WCAG 1.4.13 compliant, DatePicker keyboard-first + locale-aware, Dialog/Sheet focus trap + dirty-form veto. Meets Linear norms | — | — | — |

**Benchmarks (P0/P1s):**
- **F-01** Stripe lists are cursor-paginated end-to-end with exact counts; the server helper already returns `nextCursor`/`totalCount` (`listOrgScopedPage`) — it just never reaches the UI.
- **F-02** Linear/Slack keep one notification store consumed identically by every channel and surface; a settings page writing an unread store fails their "settings must be honest" bar.
- **F-03** Stripe/Linear only surface channels that actually deliver; Linear's email notifications are per-kind gated by the same matrix the web app edits.
- **F-04** Linear ships g+ two-key navigation to every major view, j/k/x/Enter on all lists, c to create, and a 50+ entry cheatsheet — the palette + `?` scaffolding here is already Linear-grade; it's the inventory that's missing.
- **F-05** Stripe formats every date/number through a single locale-aware layer; hardcoded "en-US" anywhere would fail their i18n lint.
- **F-06** Vercel/Linear ship exactly one toast system behind one import path; an exported provider-dependent hook with no mounted provider is an API landmine.

---

# PHASE 3 — FINDINGS REPORT

## Executive summary

**184 findings logged (181 actionable) across 238 surfaces: 5 P0 · 41 P1 · 87 P2 · 48 P3.**

The consistent shape across all six passes: **the platform's engineering foundation is category-leading, and its last mile is unfinished.** The primitives (DataTable engine, FormShell, Radix-backed dialogs, OKLCH token system, 16k-key × 7-locale i18n, the offline service worker, the email kit, `listOrgScopedPage`, `UndoStack`, `ConfirmDialog`, the CameraScanner decoder) are Linear/Stripe-class designs — but a striking number of them are **built and never wired**: the offline queue queues endpoints no UI calls, the email kit has zero importers, saved views ship on 1 of ~100 lists, inline edit on 0, `ui/Pagination` on 0, the desktop notification matrix writes a store nothing reads, and share links mint URLs that dead-end in "coming soon." The second systemic theme is **data honesty at scale**: a silent 100-row default cap flows through 77 list surfaces, calendars, FK pickers, aggregates, and CSV exports — the product quietly lies once an org outgrows the demo. The third is **trust at the money/legal/safety moments**: leads dropped by a `mailto:` form, signatures collected without showing the document, offline punches lost while the UI promises they're queued, other guests' gate codes visible.

The good news is unusually good: because the gaps are wiring rather than architecture, most P0/P1 items are S/M effort against infrastructure that already exists.

## Severity distribution by pass

| Pass | Scope | P0 | P1 | P2 | P3 | Total |
|---|---|--:|--:|--:|--:|--:|
| A | Console core + DataView engine | 0 | 6 | 20 | 11 | 37 |
| B | Console long tail + reports/documents | 1 | 9 | 17 | 7 | 34 |
| C | Portal + Personal | 0 | 9 | 18 | 5 | 32 |
| D | COMPVSS PWA + LEG3ND | 1 | 5 | 11 | 10 | 27 |
| E | Marketing + Auth + Tokens + Email | 2 | 7 | 13 | 6 | 28 |
| F | Cross-cutting systems | 1 | 5 | 8 | 9 | 23 |
| **Total** | | **5** | **41** | **87** | **48** | **181** |

## The five P0s

| ID | Finding | Why P0 |
|---|---|---|
| B-01 | `/studio/calendar` shows the 100 *oldest* events — current month empty for any org past 100 events | A core surface silently frozen in the past |
| F-01 | Silent 100-row cap on 77 list surfaces, zero pagination UI, client pagination over truncated data | Records silently invisible at production scale |
| D-01 | Offline punch/scan queue is dead code — real field writes throw and are lost offline while the banner promises queueing | Lost time-clock/gate data + false safety promise |
| E-01 | Sitewide "Book a Walkthrough" CTA ends in a `mailto:` POST that silently drops every lead | The revenue funnel terminates in a black hole |
| E-02 | `/sign/[token]` collects a legally binding signature without ever displaying the document | Legal defensibility + trust failure |

## P0/P1 themes — best-in-class benchmark and the leapfrog move

The 46 P0/P1 findings cluster into 12 themes. "Match" = reach the category leader; "Leapfrog" = the move that beats it, exploiting infrastructure this repo already has.

**1. Data honesty at scale** — F-01, B-01, A-05, A-07, B-06, A-24, A-06 (+P2 B-22, B-23)
Benchmark: Stripe never truncates silently — cursor pagination end-to-end, exact server counts, "Showing 100 of 2,341." Linear virtualizes full datasets.
Leapfrog: fix the **layer**, not the pages. `listOrgScopedPage` already returns `nextCursor`/`totalCount`; make honesty structural — a lint/test guard that fails any page rendering a capped list without `totalCount`, aggregates forced server-side via `count:"exact"`, exports offering "all N (server)" whenever truncated. Competitors audit pages; a guard makes dishonesty unshippable.

**2. Offline field truth** — D-01, D-02, D-03 (+P2 D-13)
Benchmark: Connecteam/Workyard persist punches + GPS locally and replay transparently; ServiceTitan Mobile has a full offline visit mode.
Leapfrog: the SW queue already stamps capture time and the advancing domain has an append-only `assignment_events` journal — surface **per-record sync receipts** ("recorded offline 14:02 · synced 14:31") as an auditable chain of custody for punches and scans. Field suites replay silently; none expose a verifiable offline audit trail.

**3. Scanning & credentials** — D-04, D-05, D-06 (+P2 D-07, D-08, D-17)
Benchmark: every competitor gate scanner decodes live camera frames in <500ms; Ticketmaster SafeTix rotates server-verifiable barcodes.
Leapfrog: `assignment_scan_codes` + the built CameraScanner make SafeTix-style rotation reachable; go further with **HMAC-signed QR payloads verifiable offline at the gate** (event-scoped key in the door device's SW cache) — offline-verifiable entry is something cloud-dependent ticketing products cannot do.

**4. E-signature trust** — E-02, E-03, E-04, E-19, E-20 (+P2)
Benchmark: DocuSign shows the full document, gates Finish on scroll, emails both parties an executed copy + completion certificate, serves signing URLs noindex.
Leapfrog: the documents engine already renders 29 doc types — inline the real document in `/sign`, then stamp the executed artifact with an evidence journal (IP/UA/timestamp/consent) rendered as a **self-hosted audit certificate page** per envelope. Match DocuSign's trust with zero per-envelope fees, white-labeled per org.

**5. Revenue funnel integrity** — E-01, E-09 (+P2 E-17, E-18)
Benchmark: Stripe/Linear contact forms hit a backend with instant confirmation and CRM capture; Vercel status pages show live probes + incident history.
Leapfrog: the product *contains a CRM* — land walkthrough requests in the repo's own `leads` table with an automation follow-up, and say so on the marketing site. Dogfooding the funnel is a story Linear can't tell about a form.

**6. Email system** — E-06, E-07, F-03, E-04 (+P2 E-10, E-11, E-12, E-21, E-22)
Benchmark: Stripe emails every externally-relevant event because counterparties lack dashboard access; Clerk sends fully branded auth emails; Linear gates email per-kind on the same matrix the web app edits.
Leapfrog: `notification_kind_catalog` + `renderOrgEmailTemplate` already exist — one preference matrix driving push + email + in-app from one store, with **per-tenant white-label transactional email**. Multi-brand transactional identity is beyond what single-brand SaaS leaders offer.

**7. Notification preference honesty** — F-02, C-22 (+P2 C-31, F-13)
Benchmark: Linear/Slack keep one store consumed identically by every channel and client; settings must be honest.
Leapfrog: unify on `notification_preferences.matrix`, then expose the same matrix to portal personas (no benchmark client-portal product offers per-kind notification control to external parties).

**8. Portal consumer-grade** — C-01, C-02, C-04, C-05, C-06, C-07, C-08, C-09
Benchmark: Stripe billing portal (nav at every width, Pay now on every open invoice), DICE (first-class scannable tickets, only *yours*), HoneyBook (in-portal vendor invoice submission, persona-correct chrome).
Leapfrog: 15 personas over one production graph is already differentiated — add live "needs your attention" strips fed by the same queries the console uses, AM messaging is already built. A white-label, persona-aware production portal with payments has no direct equal; the blockers are the eight wiring gaps above.

**9. Console command surface** — A-01, F-04
Benchmark: Linear — ⌘K returns records; g+ two-key nav; j/k/x/Enter on every list; 50+ shortcut cheatsheet.
Leapfrog: the palette scaffolding is already Linear-grade; add record search, then ground it with the existing Copilot so ⌘K accepts natural language ("open the MMW26 lighting PO") — command-palette-as-agent, which Linear doesn't have.

**10. Destructive-action safety** — A-03/B-02, B-03, B-04 (+P2 A-21)
Benchmark: Linear count-bearing confirm dialogs + undo toasts; Gmail one-click bulk undo; Vercel/Notion inline invite revoke/resend.
Leapfrog: trash + soft-delete + `restoreOrgScoped` + `UndoStack` all exist — make **undo, not confirm, the default recovery model** across all 90 delete sites and bulk ops. Undo-first beats dialog-first (Gmail proved it); most B2B tools still only confirm.

**11. Table engine defects** — A-02, A-04
Benchmark: Airtable/Linear export from the field model keyed by field ID; virtualized lists keep a true-height scroll canvas.
Leapfrog: none needed — these are straight bugs in an otherwise best-in-class engine; fix restores parity.

**12. Truth in reporting & records** — B-05, B-07, B-08, B-09, B-10
Benchmark: Vercel Analytics explains every empty metric with a reason + setup link; ServiceTitan/Rippling person records are tabbed hubs; Stripe separates billing-provider invoices from product data; Stripe enforces terminology canon in CI.
Leapfrog: report tiles that explain *how to make the metric light up* ("connect time entries to compute utilization") turn dead dashes into activation loops — analytics-as-onboarding.

## Top-20 roadmap (sorted by impact-to-effort)

Ranking = (severity × breadth × trust-damage) ÷ effort. S efforts with P0/P1 severity lead; L efforts appear only where impact is platform-defining.

| # | Item | Findings | Sev | Effort | Why this rank |
|--:|---|---|---|---|---|
| 1 | Calendar date-window query | B-01 | P0 | S | One-line-class fix un-freezes a core surface for every scaled org |
| 2 | Real lead capture on /contact (server action → leads table + email + success state) | E-01 | P0 | S | Every marketing CTA converges here; currently 100% lead loss |
| 3 | `noindex` + robots disallow on all token surfaces | E-03, E-23, E-24 | P1 | S | Confidential contracts crawlable; hours of work |
| 4 | Confirm + undo on danger bulk actions (wire `useConfirm` into the bulk bar) | A-03/B-02 | P1 | S | Unrecoverable mass-void/delete, one shared component to fix |
| 5 | Invite management repair: Copy Link actually copies, Revoke/Resend UI, grammar | B-03, B-04, E-12 | P1 | S | Team-formation funnel is broken at three points |
| 6 | CSV export integrity (`colIndexByKey`) + truncation-aware export | A-02, A-24 | P1 | S | Silent wrong data leaving the product |
| 7 | Offline truth: fix the banner copy today; route punch/scan writes through the queueable endpoints | D-02 (S), D-01 (M) | P0 | M | Lost field data + false safety promise; SW infra already built |
| 8 | Wire `CameraScanner` into check-in + inventory; persist quick scans; haptic/beep feedback | D-04, D-06, D-17, D-08 | P1 | S | Flagship field flows go from decorative to functional with existing components |
| 9 | Portal messages: newest-first pagination + unread/preview | C-09, C-10 | P1 | S | Chat silently stops working at 200 messages |
| 10 | Persona-correct portal nav + gateway auto-route + active state | C-02, C-04, C-03 | P1 | S | Every external user currently sees someone else's product |
| 11 | Data-honesty interim: "showing first 100" banners + server-side aggregate tiles | F-01 (interim), A-05, A-07, B-06, B-22 | P1 | M | Stops the product lying at scale while the full pagination rollout (#next-tier) proceeds |
| 12 | Toast consolidation: delete the trap `ui/Toast` export, codemod direct sonner imports | F-06 | P1 | S | Removes a runtime landmine + API drift |
| 13 | Guest-ticket privacy (viewer-scoping) + real QR passes | C-06, C-05 | P1 | M | Fraud/privacy vector and a headline guest experience, one surface |
| 14 | One notification store: rebind `/me/notifications` to `notification_preferences.matrix` | F-02, C-22 | P1 | M | Placebo settings are a trust breach; single-store refactor |
| 15 | E-sign trust pack: render the document, state gating + expiry, consent + evidence capture | E-02, E-19, E-20 | P0 | M | Legal defensibility of every signature collected |
| 16 | Branded transactional email: wire Supabase auth templates + route existing emails through the dead kit | E-07, E-10, E-11 | P1 | M | Highest-volume user touchpoint; kit already written |
| 17 | Lifecycle email wave 1: proposal-signed receipts + org notify, marketplace inquiries | E-04, E-22 | P1 | M | Money-moment notifications; patterns exist in offer flow |
| 18 | Locale-aware date sweep (~124 call sites) + ESLint ban | F-05 | P1 | M | 6 shipped locales see US dates; mechanical fix + guard |
| 19 | Keyboard inventory: g+ nav chords, j/k/x/Enter on tables, `c` create | F-04 | P1 | M | The gap between "has a palette" and "keyboard-first"; scaffolding exists |
| 20 | Portal mobile nav (drawer + breadcrumbs) | C-01 | P1 | M | Unblocks the phone-first external audience across all 150 portal routes |

**Next tier (L-effort, platform-defining — schedule after the top 20):** full cursor-pagination rollout (F-01), ⌘K record search → Copilot-grounded palette (A-01), full external-event email fan-out (E-06/F-03), share-link real renderers (E-08), server-minted Rose credential QR (D-05), person-record tabs (B-09), pipeline drag kanban (A-23), report null-UX activation loops (B-07), em-dash + sub-11px canon sweeps with CI guards (B-10, B-25, D-15), real status page (E-09), stale-data indicators for offline reads (D-03), i18n locale routing (E-13), saved-views/inline-edit rollout (A-13, A-14).

---

*Audit complete. No fixes were applied. Full per-finding evidence (file:line) is in the Phase 2 pass tables above; Phase 1 inventory maps every finding back to a numbered surface.*
