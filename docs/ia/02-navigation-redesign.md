# Navigation + IA Redesign — Specification

**Scope.** Every navigational surface across the three branded shells
(`atlvs` / `gvteway` / `compvss`) plus the marketing shell. Benchmarks:
Linear, Notion, Figma, Vercel, Stripe Dashboard, Supabase, Attio,
Airtable, Height, Monday, Asana, Retool.

**Operating principles.**
1. **Familiar outperforms clever.** Default to the pattern a user
   already knows from a peer product in the same quadrant.
2. **Every decision cites a precedent or a law.** Fitts's Law for
   touch targets + corners. Hick's Law for nav breadth. Miller's 7±2
   for group size. Recognition > recall. Progressive disclosure.
3. **Discoverability per tier.** An owner and a contractor may see
   different items, never different *mental models*. No hidden
   keyboard shortcuts as the sole path to a feature.
4. **Restraint > ornamentation.** Visual quality = rhythm + hierarchy
   + contrast. Ornament only where it signals importance.

---

## 1. Current-State Audit

### A. Surface inventory

| Surface | Shell(s) | Component | Source | Verdict |
|---|---|---|---|---|
| Primary sidebar | platform | `PlatformSidebar` (`src/components/PlatformSidebar.tsx`) | `platformNav` (10 groups, 47 items, `src/lib/nav.ts`) | Rich; keyboard + pin + search + resize. Benchmark-class for Linear/Supabase |
| Portal rail | portal | `PortalRail` (`src/components/Shell.tsx`) | `portalNav(slug, persona)` | Fixed width; no collapse; adequate for ≤ 8 items |
| Mobile tab bar | mobile | `MobileTabBar` | `mobileTabs` (5 tabs) | Correct for phone. Tabs cap at 5 per Hick's — good |
| Glass nav top bar | platform | inline in `(platform)/layout.tsx` | — | Carries static "Console" label + command palette trigger + theme toggle. **No notifications bell, no breadcrumbs, no search** |
| `ModuleHeader` | all shells | `src/components/Shell.tsx` | — | Has breadcrumb slot but uses manual `/` separators — inconsistent with marketing `<Breadcrumbs>` |
| Breadcrumbs | marketing only | `src/components/marketing/Breadcrumbs.tsx` | — | Emits schema.org JSON-LD. **Not reused in console / portal / mobile** |
| Tabs primitive | any | `src/components/ui/Tabs.tsx` + Radix | — | No URL-state persistence by default |
| Command palette | all 3 branded shells | `src/components/CommandPalette.tsx` | in-file registry | Platform scope = rich, portal + mobile = minimal |
| Dialog / Sheet / Dropdown | all | `src/components/ui/{Dialog,Sheet,DropdownMenu}.tsx` | Radix | Solid primitives; usage inconsistent |
| Toasts | all | `sonner` via `src/app/layout.tsx` | — | Global, single-channel. No banner system |
| Offline banner | mobile | `src/components/mobile/OfflineBanner.tsx` | — | Mobile-only today. Good model for a more general banner system |
| Context menus | none | Primitive exists (Radix `DropdownMenu`); no row-level kebab usage found | — | **Dead zone** — violates Attio / Airtable row-action conventions |
| Notifications bell | none | schema exists (`notifications` table) | — | **Dead zone** |

### B. Redundancy + dead ends

| Symptom | Evidence | Recommended fix |
|---|---|---|
| Two breadcrumb implementations | `<Breadcrumbs>` (marketing, JSON-LD) vs `ModuleHeader.breadcrumbs: Crumb[]` (inline slashes) | Unify; have `ModuleHeader` delegate to `<Breadcrumbs>` |
| Active-state detection forked three ways | `PlatformSidebar:268-269` (pathname compare), `PortalRail:34` (prop), `CommandPalette` (pathname) | Extract single `useActiveRoute()` hook |
| "Console" label in glass nav adds zero value | `(platform)/layout.tsx:15` | Replace with breadcrumb trail or the actual module name |
| `notifications` table has no surface | `CLAUDE.md:31` | Ship a `<NotificationsBell>` in the glass nav |
| Row-level actions (kebab menus) absent | 0 uses found | Ship a `<RowActions>` primitive + apply to project / proposal / invoice tables |
| Mobile offline banner is bespoke | `OfflineBanner.tsx` | Generalize to a `<GlobalBanner>` with `kind: offline\|maintenance\|announcement` |

### C. Depth violations

`/console/projects/[projectId]/guides/[persona]` is depth 5 (counting
the `/console` prefix as depth 1). Linear bottoms out at 4; Stripe
Dashboard at 4. Going deeper forces the breadcrumb bar to truncate
or scroll — hurts orientation.

**Rule adopted** (see §2): 5 is the hard ceiling. Anything deeper
is a symptom of a missing module split.

### D. Benchmarks — what to steal, what to reject

| Product | Steal | Reject |
|---|---|---|
| **Linear** | Cmd-K completeness; tight typography; collapsed sidebar icons | Its issue-only mental model; our domain is broader |
| **Notion** | Sidebar search + pinning | Infinite nested-page tree (our breadth is finite; wasted on us) |
| **Figma** | Contextual top-bar actions; zero chrome when editing | Icon-only top bar (not scannable) |
| **Vercel** | Workspace / team switcher pinned top-left | Over-reliance on dropdown hubs |
| **Stripe Dashboard** | Structured tabs on detail pages; breadcrumb persistence | Cramped left sidebar at default density |
| **Supabase** | Per-module sub-sidebar expansion | Its "table → row detail" mental model is narrow |
| **Attio** | Row-level kebab menus; inline edit | Narrow record-centric model |
| **Airtable** | Dense grid + overflow menu | Its primary nav is weak — underwhelming even for power users |
| **Height** | Beautiful command palette composition | Small market; patterns not yet industry-standard |
| **Monday** | Clear sidebar grouping with color hints | Aggressive onboarding drawers |
| **Asana** | Tabs-over-sub-nav on detail pages | Notification bell that's almost always full |
| **Retool** | Explicit role-aware chrome swaps | Admin-centric overall tone |

Net takeaways baked into this redesign:
- **Cmd-K as first-class** (Linear, Height): every item in nav is also a command.
- **Breadcrumb is always present on detail** (Stripe).
- **Row kebab as the default action vocabulary** (Attio, Airtable).
- **Notifications bell, not drawer-based inbox** (Asana anti-pattern).
- **Tabs on detail page, not sub-sidebar** (Stripe, Asana).
- **Density toggle** (Notion, Airtable): compact ↔ comfortable.

---

## 2. Information Architecture Hierarchy

Six canonical levels. If a feature would exceed level 5, restructure.

```
GLOBAL    — brand / workspace / session context       (always visible)
MODULE    — top of a product area                      (sidebar item)
HUB       — landing page with KPIs + entry tiles       (optional)
PAGE      — list / board / calendar / table            (primary work surface)
DETAIL    — single entity view                         (right-hand pane or full page)
OVERLAY   — modal / drawer / sheet                     (ephemeral, stateless)
```

### Level rules

| Level | Anchors | Nav affordance | Can spawn |
|---|---|---|---|
| Global | Logo; command palette; notifications; account | Clicking logo returns to Module of the last active shell | Theme sheet, locale sheet, account sheet |
| Module | Top item in sidebar group | Pathname becomes `/console/<module>` | Hub OR Page |
| Hub | Single page per module, optional | Pathname = `/console/<module>` | N Pages |
| Page | The primary index for a resource | Pathname = `/console/<module>/<resource>` | Detail page |
| Detail | One entity at a resource. Tabs for sub-views | Pathname = `/console/<module>/<resource>/[id]` | Overlay |
| Overlay | Transient — modal, drawer, sheet | No pathname | Closes on outside-click / `esc` |

### Hard ceilings

- **Sidebar breadth**: 10 groups × ≤ 8 items per group (Miller's 7±2 compatible, leaves a buffer).
- **Route depth**: 5 segments (`/console/projects/[id]/guides/[persona]` is the current max and is the ceiling, not the floor).
- **Tabs per detail page**: 6. More than 6 = split into sub-pages or collapse secondary tabs behind a "More" overflow menu.
- **Breadcrumbs**: max 4 links + current. On narrow viewports, truncate middle entries to an ellipsis dropdown.

---

## 3. Component Specifications

### 3.1 Sidebar (platform)

**Structure.**
```
┌──────────────────────────────┐
│ [workspace switcher]         │  20px, pinned-top
├──────────────────────────────┤
│ ┌─ search                  ─┐ │  key "/" focuses
├──────────────────────────────┤
│ ★ Pinned (max 5)             │  user-picked, persisted
├──────────────────────────────┤
│ ▾ Group label                │  uppercase 10px, clickable to collapse group
│   · Item 1                   │  pathname active → accent bar + bold
│   · Item 2                   │
│ ▾ Next group                 │
├──────────────────────────────┤
│ [collapse ≪]                 │  bottom-left, cmd+b shortcut
└──────────────────────────────┘
```

**States.**
- Default: 240 px.
- Collapsed: 64 px; icon-only; group labels hidden; tooltip on hover (Fitts's Law — tooltip matches the icon hit area at the edge).
- Resizing: drag handle on right edge, clamp to [200, 400]. Persists via `user_preferences.sidebar_width`.

**Active-state rule.** Exactly-one match. `/console/projects/123` activates `Projects`, NOT both `Projects` and `Dashboard`. Extract `useActiveRoute(itemHref)` so every shell agrees.

**Badges.** Numeric pill to the right of the item when `notifications` or a module-specific unread count is non-zero. 99+ truncation.

**Precedent.** Linear (collapse + pin), Supabase (group collapse), Notion (search).

### 3.2 Sidebar (portal) + tab bar (mobile)

Portal rail stays as-is — it's persona-scoped and rarely exceeds 7 items, which is the right breadth for a fixed rail. No collapse needed; persona switch already lives in the URL.

Mobile: five bottom tabs is already correct (iOS HIG limit for bottom tab bars). Keep.

### 3.3 Top bar (global)

```
┌───────────────────────────────────────────────────────────────┐
│ [◀] Breadcrumb / Breadcrumb / Current    ⌘K    🔔 5   theme   │
└───────────────────────────────────────────────────────────────┘
```

- **Left**: back button when history depth > 1 (opt-in per page); breadcrumbs.
- **Center**: command palette trigger as a pill that displays the current ⌘K shortcut (Linear / Height pattern). Click opens palette.
- **Right**: `<NotificationsBell>` (new); theme toggle (already there). Account avatar on far right.

The static "Console" label in `(platform)/layout.tsx:15` is removed — the breadcrumb tells the user where they are, not chrome.

### 3.4 Tabs — page-level vs detail-level

- **Detail-level tabs** are the default on any `/console/<module>/<resource>/[id]` page. Overview / Activity / Files / Comments — the Stripe pattern.
- **Page-level tabs** are reserved for filter switches inside a single PAGE (e.g. `All / Mine / Archived`). Never exceed 4 at page level; use `SegmentedControl` instead of full tabs above 4.
- **Overflow rule**: if more than 6 tabs on a detail page, the last one becomes a `More ▾` menu with the remainder. Never let tabs wrap to a second row.
- **State persistence**: active tab lives in a URL query param `?tab=<slug>` so the page is shareable. Extract `useTabParam('tab', defaultSlug)` helper.

### 3.5 Modals vs drawers vs full pages — decision tree

```
Does the task take > 30s OR require 4+ fields OR reference data
outside this record?
├── YES ───► Full page (/new or /edit) — keeps focus, allows deep work
└── NO
    ├── Is the task SELECTING / CONFIRMING (not authoring)?
    │   ├── YES ───► Dialog (modal) — small, centered, ≤ 3 actions
    │   └── NO     ───► Drawer / Sheet — right-side, 560 px, preserves
    │                   parent context while editing
    └── Is it a preview / side-by-side ?
        └──────► Drawer (right-side 560 px)
```

- **Modals**: never more than one open. Never a modal from a modal.
- **Drawers**: right-side on desktop, bottom-up on mobile. Not a substitute for pages.

### 3.6 Forms — inline / stepped / modal / full-page

| Shape | When | Example |
|---|---|---|
| **Inline edit** | 1 field, known type, result visible immediately | Rename project |
| **Stepped (wizard)** | ≥ 3 logical phases; each needs validation before next | Stripe Connect onboarding |
| **Modal form** | ≤ 4 fields, single-purpose | "Invite teammate" |
| **Drawer form** | 4–8 fields, user needs to see the surrounding context | "Edit task" |
| **Full-page form** | 8+ fields OR rich-text body OR file attachments | "Create proposal" |

### 3.7 Breadcrumbs

- **Required** on any page deeper than `/console/<module>`. 
- **Not required** at Module or Hub level.
- **Truncation**: if total links > 4, collapse middle links into an overflow dropdown (`Folder ▸ … ▸ File ▸ Current`).
- **Schema.org**: always emit `BreadcrumbList` JSON-LD (already done in the marketing `<Breadcrumbs>` — unify on this component).

### 3.8 Command palette

- **Global shortcut**: ⌘K / Ctrl+K.
- **Scoped commands**: every nav item is also a command. Cross-shell: palette from /console can still jump to `/p/{slug}` and `/m` — discovery without switching.
- **Groups** (in order): Recent (up to 10), Jump to (nav), Create, Switch (theme, locale, workspace), Settings, Help.
- **Fuzzy match**: matchSorter (already shipped).
- **Alt action**: ⌘+Enter opens in a new tab.
- **Keyboard hints**: every item shows its shortcut when one exists (right-aligned).

---

## 4. Interaction & State System

### 4.1 Interactive states

| State | Visual | Notes |
|---|---|---|
| Default | base token | — |
| Hover | bg-secondary; cursor-pointer | no elevation change on nav items — reserves elevation for surfaces |
| Focus (keyboard) | 2 px outline in `--accent`; offset 2 px | WCAG 2.2 focus-not-obscured |
| Active | accent bar on left edge + bold text (sidebar); `aria-current="page"` | — |
| Disabled | opacity 0.4; cursor-not-allowed; NOT greyed-out — legibility preserved | — |
| Loading | skeleton (content area), spinner (inline button) | Skeleton rhythm matches the eventual layout |
| Empty | `<EmptyState>` with icon + title + CTA | CTA text: verb + noun (e.g. "New project") |
| Error | red banner inline; never a toast for recoverable errors | Toast for out-of-context events only |

### 4.2 Keyboard map

Global:
- `⌘K` / `Ctrl+K` — command palette
- `⌘/` — shortcut dialog
- `⌘B` — collapse / expand sidebar
- `/` — focus sidebar search (when palette closed)
- `g p` — go to Projects; `g t` — Tasks; `g i` — Invoices (`g` then letter, Vim-flavor — Linear/Height)
- `c` on a resource page — create (e.g. `c` on `/console/projects` → new project)
- `esc` — close topmost overlay; if none, de-focus current input

Navigation:
- Arrow keys navigate sidebar list; `enter` activates
- `j / k` navigate rows in any data table
- `space` selects row; `⌘A` selects all visible

Accessibility:
- Skip link as the first focusable element on every page (already in `layout.tsx:76`)
- All interactive elements pass `axe-core` at WCAG 2.2 AA minimum
- No keyboard trap anywhere (already enforced by Radix primitives)

### 4.3 Responsive breakpoints

`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280 / `2xl` 1536 (Tailwind defaults — already in use).

- `< md`: sidebar collapses to off-canvas sheet; top bar shows a hamburger.
- `≥ md`: sidebar expanded; top bar compacts.
- `≥ xl`: sidebar + page content + optional right-hand detail pane side-by-side.

---

## 5. Visual System

### 5.1 Spacing scale

Base 4 px. Tokens: `space-1` (4) / `space-2` (8) / `space-3` (12) / `space-4` (16) / `space-5` (20) / `space-6` (24) / `space-8` (32) / `space-12` (48) / `space-16` (64).

Nav rhythm:
- Item vertical padding: `space-2` (8 px) in default density; `space-1` (4 px) in compact.
- Group gap: `space-4` (16 px) default; `space-3` (12 px) compact.
- Sidebar outer padding: `space-3` (12 px) default.

### 5.2 Type hierarchy

| Role | Default | Compact |
|---|---|---|
| H1 (page title) | 24 px / 1.2 / 600 | 20 px |
| H2 (section) | 18 px / 1.3 / 600 | 16 px |
| Body | 14 px / 1.5 / 400 | 13 px |
| Nav item | 14 px / 1.3 / 500 | 13 px |
| Caption / eyebrow | 10 px / 1 / 700 / uppercase +1.5 letter-spacing | same |

Font stack already set: Inter (sans) + JetBrains Mono. No new fonts.

### 5.3 Iconography rules

- `lucide-react` is the only icon library. No mixing.
- 16 px inside nav items, 14 px inside buttons, 12 px inside inline badges.
- `aria-hidden="true"` unless the icon is the only label (e.g. chevron buttons — then `aria-label="Next"`).

### 5.4 Density modes

Three modes: `compact` / `comfortable` (default) / `spacious`. Wired via `data-density` on `<html>` (already scaffolded by the CHROMA BEACON provider). All nav, tables, and forms respect the active mode.

Precedent: Notion (compact vs comfortable), Airtable (row height picker).

### 5.5 Motion

- Hover / focus transitions: 120 ms ease-out.
- Sheet / drawer in: 200 ms ease-out; out: 150 ms ease-in.
- Dialog: 150 ms fade + scale from 0.98 → 1.
- Honor `prefers-reduced-motion` (already respected by our existing CSS).

### 5.6 Color tokens in nav

- Sidebar bg: `--bg-secondary`
- Active item bg: transparent (only the left accent bar shows state)
- Accent bar: 3 px × full height, `--accent` (currently `--org-primary`)
- Active item text: `--foreground` at 600 weight

---

## 6. Decision Matrix

| Question | Choose | Don't choose |
|---|---|---|
| Fixed list of 2–4 primary filter switches inside one page | `SegmentedControl` | Tabs (over-chromed for 2–4) |
| 4–8 switches on a detail page | Tabs (URL-persisted) | Sub-sidebar (pulls attention away from the record) |
| 9+ switches on one page | Split into sub-pages OR collapse to `More ▾` | Stacked tab rows (never) |
| Small confirm (≤ 3 actions) | Modal | Drawer (too heavy) |
| Edit while keeping context | Drawer (560 px right) | Modal (steals focus) |
| Author a new multi-field record | Full page (`/new`) | Modal (not enough room) |
| Bulk action on selected rows | Overflow menu pinned at top of table | Modal per action |
| Edit a single field | Inline edit | Drawer (over-kill) |
| Switch between org / workspace | Top-left workspace switcher (dropdown) | Settings page (too many clicks) |
| Jump to any resource | Command palette | New nav item for every resource (breaks Hick's Law) |
| Report a fleeting success | Toast | Banner (doesn't self-dismiss — noisy) |
| Persistent warning / downtime | Banner | Toast (invisible on reload) |
| Irreversible destructive action | Modal w/ confirm + typed phrase | Toast confirmation (never) |
| Detail page section organization | Tabs on the detail page | Accordion (hides state; harder to scan) |
| Resource index | Table with row kebab | Cards (lower density) unless the resource has rich visual content (projects) |
| Nested routes vs query params | Routes when you want a shareable URL + back-button; query params when it's a filter | Mix of both for the same dimension |

---

## 7. Anti-Patterns to Eliminate

| # | Anti-pattern | Where | Fix |
|---|---|---|---|
| 1 | Two breadcrumb implementations (marketing `<Breadcrumbs>` vs manual slashes in `ModuleHeader`) | `src/components/Shell.tsx:74-89` | Ship unified `<Breadcrumbs>` at `src/components/ui/Breadcrumbs.tsx`; `ModuleHeader` delegates |
| 2 | Active-state detection forked 3 ways | `PlatformSidebar`, `PortalRail`, `CommandPalette` | New `src/lib/hooks/useActiveRoute.ts` |
| 3 | Dead "Console" label in glass nav | `(platform)/layout.tsx:15` | Replace with breadcrumb trail |
| 4 | `notifications` table has no UI | — | Ship `<NotificationsBell>` |
| 5 | Zero row-level kebab menus | every data table | Ship `<RowActions>` primitive; apply to 2 flagship tables |
| 6 | Mobile `OfflineBanner` is shape-specific | `src/components/mobile/OfflineBanner.tsx` | Generalize to `<GlobalBanner kind="offline">` usable anywhere |
| 7 | Tabs don't persist in the URL | `src/components/ui/Tabs.tsx` | `useTabParam()` hook |
| 8 | No global keyboard shortcut help | `ShortcutDialog.tsx` (bare) | Rebuild to enumerate every shortcut |
| 9 | Empty-states inconsistent | various | Force use of `<EmptyState>` primitive; eslint rule forbids hand-rolled empty divs |
| 10 | Mix of icon sizes in nav | various | Normalize to 16 px nav / 14 px button / 12 px badge |
| 11 | Depth-5 route `/console/projects/[id]/guides/[persona]` is at the ceiling; any future addition trips it | — | Adopt rule: no new depth-6 routes. Split by module instead. |
| 12 | No workspace switcher in sidebar | — | Add `<WorkspaceSwitcher>` at top-left (Vercel pattern) |

---

## 8. Implementation roadmap

**P0 — this commit (unblocks everything else):**
- Unified `<Breadcrumbs>` (§7 #1)
- `useActiveRoute()` hook (§7 #2)
- Glass-nav redesign: breadcrumbs + notifications bell + palette pill (§7 #3, #4)
- `<RowActions>` primitive (§7 #5)
- `<NotificationsBell>` component reading the `notifications` table (§7 #4)

**P1 — next iteration:**
- `useTabParam()` + migrate any existing tabs (§7 #7)
- `<GlobalBanner>` refactor of OfflineBanner (§7 #6)
- Enhanced shortcut dialog (§7 #8)
- Density toggle wired through the console shell (§5.4)
- Workspace switcher (§7 #12)

**P2 — later:**
- ESLint rule to forbid hand-rolled empty divs without `<EmptyState>` (§7 #9)
- Depth-6 route lint guard (§7 #11)
- Visual tests: Playwright traces for sidebar collapse, keyboard nav path, command palette completeness

Nothing in this spec requires new architecture. Everything composes
from existing primitives (Radix, sonner, lucide-react, CHROMA BEACON
tokens) and existing data surfaces (the `notifications` table, the
nav registries in `src/lib/nav.ts`).
