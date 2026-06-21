# COMPVSS Web App — strategy: extend the mobile kit to the desktop/web venue-ops surface

**Goal:** upgrade the COMPVSS *web* experience as a true **extension of the rebuilt mobile kit**,
not a separate app. Same codebase, same Supabase data layer + server actions, same kit
primitives and design language — adapted to large screens (tablet → desktop) for on-site venue
operations centers, ops desks, and back-of-house workstations.

This pairs with [`KIT_CANON.md`](./KIT_CANON.md) (the SSOT). The kit is canon; the web app is a
**responsive + chrome** layer over it, not a fork.

---

## 1. What "COMPVSS web app" is (and isn't)

COMPVSS already spans two form factors (CLAUDE.md): the **`/m` field PWA** (phones, Capacitor)
and the **venue-ops surface** (the ops desk / command-post web view). Today `/m` is phone-first.
The web app is the **same `/m` routes rendered for a desktop browser** at `compvss.atlvs.pro` —
a wider, denser, multi-pane, keyboard-first venue-ops console.

- It is **not** the ATLVS operator console (`/console` — that's the pink superset ERP/CRM/PM).
- It is **not** a new repo or route tree. It is `(mobile)/m/**` made breakpoint-adaptive.
- The native iOS/Android wrapper (Capacitor over `compvss.atlvs.pro/m`) is **unaffected** — it
  loads the same PWA; phone widths keep the phone layout.

## 2. Why this is mostly layout, not rebuild

The rebuild already did the hard part:
- **Kit primitives are view-polymorphic.** `ActionBar` + `ViewToggle` + `DataTable` already do
  list / board / **table** / calendar / gallery. Desktop just *defaults differently* (table/board)
  and gets more room.
- **Data + actions are screen-agnostic.** Every screen is a server component fetching Supabase +
  `"use client"` leaves; nothing is phone-coupled at the data layer.
- **Tokens carry breakpoints.** `--bp-sm…2xl` + `--p-content-max` + the density axis
  (`compact/cozy/spacious`) already exist. The kit CSS is scoped under `.mobile-shell`.

So the web app = (a) a **desktop chrome** at wider breakpoints, (b) **density/multi-pane**
defaults, (c) a handful of **desktop-only affordances**. No new data model, no new auth.

## 3. Recommended architecture — breakpoint-adaptive single shell

Keep one route tree (`(mobile)/m/**`) and one shell. Branch on width, not on a separate app.

- **`< --bp-lg` (phone/tablet portrait):** today's experience — bottom `MobileTabBar`, single
  column, full-screen forms/sheets. Unchanged.
- **`≥ --bp-lg` (desktop):** the layout swaps the bottom tab bar for a **persistent left rail**
  (the 6 tabs + the More-hub surfaces grouped Tools/People/Network/Account), a top utility bar
  (org/project switcher + search/cmd-K + bell + avatar — `WorkspaceChrome` already hosts these),
  and a **wider content max**. Lists default to **table/board**; detail routes render as a
  **master-detail two-pane** (list left, record right) instead of push-navigation.

Implementation seam: a `data-viewport` (or CSS container query) on `.mobile-shell` +
desktop-only branches in the shell chrome. The page bodies stay identical — the kit primitives
already accept a `view` and render denser variants.

Why adaptive-single-shell over a parallel `(compvss-web)` group: zero route duplication, zero
data re-wiring, automatic parity (a new `/m` screen is instantly available on web), and the
Capacitor build keeps working untouched.

## 4. Phased roadmap

Each phase is independently shippable and additive (no URL breaks, mobile unaffected).

**Phase 0 — Foundation rename (optional, SSOT clarity).** Alias/relocate
`src/components/mobile/kit` → `src/components/compvss` (the kit is the COMPVSS DS, not
mobile-only). Keep a re-export shim so nothing breaks. Lands the vocabulary the web app will use.

**Phase 1 — Desktop chrome.** At `≥ --bp-lg`: render `CompvssDesktopRail` (left nav from
`mobileTabs` + `mobileSurfaces`, grouped) instead of `MobileTabBar`; widen `--p-content-max`;
keep `WorkspaceChrome` top bar. Pure layout in `(mobile)/layout.tsx` + new CSS. **Highest
value, lowest risk** — the whole app becomes usable on desktop in one PR.

**Phase 2 — Density + master-detail.** Desktop defaults lists to `table`/`board`; convert the
big detail flows (Tasks, Inbox, Advances, Requests, Directory, Documents) to two-pane
master-detail via a shared `<SplitPane>` that reuses the existing list + `RecordDetail` without
new data. Forms open as right-side sheets/modals instead of full-screen.

**Phase 3 — Desktop affordances.** Multi-select + bulk actions on tables (reuse `assignments`/
`tasks` state actions), drag-drop on boards (status/lifecycle transitions), keyboard shortcuts
(cmd-K exists; add j/k/enter list nav), column show/hide on `DataTable`. Persist view prefs to
`user_preferences.ui_state`.

**Phase 4 — Venue-ops command surfaces.** A desktop **ops dashboard** (the kit widget grid →
multi-column command view: live headcount, gate throughput, open incidents, asset status),
the **ToolSheet** calculators as a docked panel, and a **map/wayfinding** pane. These are the
genuinely desktop-first venue-ops views; they consume the same metrics/resolvers as the mobile
widgets.

**Phase 5 — Hardening.** Responsive Playwright passes at phone/tablet/desktop widths; a11y
(keyboard, focus order) on the desktop chrome; perf (table virtualization for large rosters);
confirm Capacitor build still green (`cap sync`).

## 5. Reuse model + guardrails

- **One kit, two form factors.** Web composes the *same* `@/components/compvss/*` primitives.
  No duplicate components; differences are props (`view`, `density`) + CSS (`@container` /
  breakpoint), never forks. A new guard test can assert no COMPVSS UI imports outside the kit.
- **Data layer untouched.** No new tables, no new server actions for layout work; bulk/drag
  actions reuse existing lifecycle transition actions (`fulfillment_state`, `task_state`, …).
- **Canon holds at every width.** ActionBar everywhere, Title Case + middot, amber CTA, Rose,
  the 6-tab IA (rail on desktop, bar on phone). Desktop adds density, not a different IA.
- **Subdomain unchanged.** `compvss.atlvs.pro` already rewrites to `/m`; desktop browsers hit the
  same routes. SW/PWA registration stays compvss-only.

## 6. Key decisions to confirm before Phase 1
1. **Adaptive single shell (recommended)** vs a parallel desktop route group — recommend adaptive.
2. **Breakpoint for the desktop switch** — propose `--bp-lg` (≈1024px); tablets land on the
   denser-but-still-single-column tier.
3. **Phase 0 rename** of `mobile/kit` → `compvss` now (clean vocabulary) vs defer (less churn).
4. **Scope of the ops dashboard (Phase 4)** — which venue-ops metrics are first-class (headcount,
   throughput, incidents, assets) and whether it reuses the v6.3 reports engine.

## 7. First PR (proposed)
`feat(compvss-web): desktop chrome (Phase 1)` — breakpoint-adaptive `(mobile)/layout.tsx` that
renders a left rail + wide content at `≥ --bp-lg`, falling back to the bottom tab bar below it;
new `CompvssDesktopRail` from the existing nav SSOT; `kit-mobile.css` desktop media block. No new
routes, no data changes, mobile + Capacitor untouched. Verifiable via `preview_resize` at phone
vs desktop widths.
