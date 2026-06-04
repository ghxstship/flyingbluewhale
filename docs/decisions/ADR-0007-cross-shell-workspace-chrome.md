# ADR-0007 — Cross-shell workspace chrome + app switcher

**Status:** Proposed
**Date:** 2026-06-04
**Owner:** Platform engineering
**Relates to:** ADR-0001 (three-shell topology), ADR-0006 (domain-noun nav — adds Help affordance + Dashboards menu hooks)

## Context

The three shells (ATLVS console, GVTEWAY portal, COMPVSS mobile) each invented their own top-bar chrome. Today:

| Surface       | ATLVS top-bar                | GVTEWAY rail top                     | COMPVSS chrome                |
| ------------- | ---------------------------- | ------------------------------------ | ----------------------------- |
| Logo / org    | WorkspaceSwitcher in sidebar | PortalRail header (project name)     | none (status bar only)        |
| ⌘K search     | `<CommandPaletteTrigger />`  | absent                               | absent                        |
| Notifications | `<NotificationsBell />`      | absent (`/p/[slug]/inbox` page only) | tab-bar Alerts                |
| Messages      | sidebar Threads link         | sidebar Messages link                | tab-bar Inbox (post ADR-0006) |
| Help (`?`)    | absent                       | absent                               | absent                        |
| App switcher  | absent                       | absent                               | absent                        |
| Avatar        | `<AvatarMenu />`             | absent (logout in `/me`)             | tab-bar Me                    |

Five distinct silos, three different positional conventions, and no way to move between apps from inside any of them. The optimization plan (item #1 — shared workspace chrome) and item #2 — app switcher with capability filtering) are the highest-leverage cross-cutting fix because they remove cognitive friction at every interaction, not just on first contact.

ADR-0006 already booked the Dashboards menu and `?` Help affordance into "workspace chrome" — this ADR specifies that chrome.

## Decision

Extract `<WorkspaceChrome>` as the single top-bar contract used identically by all three shells, with a per-shell theme skin. Standard order, left-to-right:

```
[App Switcher] [Workspace name]        ─spacer─        [⌘K] [Dashboards] [?] [Bell] [Messages] [Avatar]
```

Components and their behaviors:

| Slot           | Component                   | Behavior                                                                                                                                                |
| -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| App Switcher   | `<AppSwitcher />`           | Waffle icon. Click opens a popover listing **only shells the user has access to**. Current shell shown selected. Click jumps via `urlFor(target, "/")`. |
| Workspace name | `<WorkspaceLabel />`        | Tenant org name (ATLVS), project name + slug (GVTEWAY), org or project (COMPVSS depending on context).                                                  |
| ⌘K             | `<CommandPaletteTrigger />` | Existing; reused in all three shells. Scope: `platform` / `portal` / `mobile`.                                                                          |
| Dashboards     | `<DashboardsMenu />`        | New. Top-bar dropdown listing user's saved dashboards + "All Dashboards" → `/console/dashboards`. ATLVS only.                                           |
| `?` Help       | `<HelpButton />`            | New. Opens side panel routing to `/console/knowledge` (Articles) + external docs links. All shells.                                                     |
| Bell           | `<NotificationsBell />`     | Existing; lifted to all shells, reads from `notifications` table filtered to caller.                                                                    |
| Messages       | `<MessagesButton />`        | New. Click opens panel → recent threads. ATLVS: `/console/inbox`. GVTEWAY: `/p/[slug]/messages`. COMPVSS: `/m/inbox`.                                   |
| Avatar         | `<AvatarMenu />`            | Existing; lifted to all shells. Menu: Account · Preferences · Sign out · App-switcher fallback.                                                         |

### App switcher capability rules

`<AppSwitcher />` reads from the current session and shows entries for shells the user can reach:

```ts
type AppEntry = { shell: "platform" | "portal" | "mobile"; label: string; href: string; available: boolean };

function appSwitcherEntries(session: Session): AppEntry[] {
  const platformOK = session.platformRole !== null; // any org membership
  const portalOK = session.portalProjects.length > 0; // any project membership w/ portal access
  const mobileOK = session.platformRole === "crew" || session.flags.mobileEnabled; // crew or opt-in
  return [
    { shell: "platform", label: "ATLVS", href: urlFor("platform", "/console"), available: platformOK },
    {
      shell: "portal",
      label: "GVTEWAY",
      href: urlFor("portal", `/p/${session.lastPortalSlug ?? "select"}`),
      available: portalOK,
    },
    { shell: "mobile", label: "COMPVSS", href: urlFor("mobile", "/m"), available: mobileOK },
  ].filter((e) => e.available);
}
```

When a user has access to only one shell, the switcher renders disabled (single-app users see no switcher chrome). When they have access to multiple, the active shell is marked with the brand accent (red/blue/yellow per CLAUDE.md).

### Position rules

- Chrome is a single horizontal band, height 56px (matches today's ATLVS `.glass-nav`).
- Sticky to top of viewport on desktop; on COMPVSS (mobile) it's a slim 44px band — the 5-tab bar at the bottom still owns primary nav.
- Order is invariant. No shell may reorder.

## Migration rules

1. **One package, three skins.** `<WorkspaceChrome />` lives in `src/components/workspace-chrome/`. Per-shell skin is a CSS data attribute (`data-shell="platform" | "portal" | "mobile"`) — same DOM, different accents.
2. **Each shell's existing top-bar is replaced** with `<WorkspaceChrome shell="…" session={session} />`. ATLVS `(platform)/layout.tsx`, portal `(portal)/p/[slug]/layout.tsx`, mobile `(mobile)/layout.tsx`.
3. **No URL changes.** Every existing destination still resolves.
4. **Session shape extended** if needed — `session.portalProjects: string[]` (slugs) and `session.lastPortalSlug: string | null` are likely already there or trivially derivable from `memberships`.
5. **Backwards compatible.** Existing `<NotificationsBell />` / `<AvatarMenu />` / `<CommandPaletteTrigger />` are reused (not replaced) — the chrome is a layout component that hosts them.
6. **One PR per shell** (per project trunk-based convention) — Move 1: build `<WorkspaceChrome />` + `<AppSwitcher />` + `<HelpButton />` + `<MessagesButton />` + `<DashboardsMenu />` as standalone components. Move 2: rewire ATLVS layout. Move 3: portal. Move 4: mobile.

## Acceptance checks

- [ ] `<WorkspaceChrome />` renders identically across all three shells (DOM diff: only `data-shell` and accent variables differ).
- [ ] App switcher opens from any shell; shows only shells the user has access to; click navigates via `urlFor()`.
- [ ] `?` Help button opens a panel and routes to `/console/knowledge` for KB articles + external docs.
- [ ] Dashboards menu shows on ATLVS chrome only; lists saved dashboards from `/console/dashboards`.
- [ ] Messages button opens correct shell-specific destination (portal: `/p/[slug]/messages`; mobile: `/m/inbox`; ATLVS: `/console/inbox`).
- [ ] All three shells pass typecheck + lint + build.

## Open questions

1. **`<WorkspaceLabel />` ergonomics on GVTEWAY** — multi-slug users need a project switcher. Reuse `<WorkspaceSwitcher />` from ATLVS or build a portal-specific one? Recommend: reuse with portal slug fetch.
2. **Mobile chrome visibility** — 44px band consumes valuable phone real estate. Hide chrome on scroll-down, show on scroll-up (iOS pattern). Or fix at top always? Recommend: scroll-aware on mobile only.
3. **App-switcher branding** — three sub-product accents (ATLVS red, GVTEWAY blue, COMPVSS yellow) per CLAUDE.md. Use small color dots next to each label so the switcher itself surfaces the brand system.

## Out of scope

- Cross-shell URL routing changes (handled by `urlFor()` / `src/proxy.ts`).
- Cross-shell notification matrix consolidation — separate ADR (foundation item #3).
- The portal-vs-personal `/me` boundary cleanup (foundation item #4) — separate ADR.

## Forward look

This ADR is the foundation for items 1 and 2 of the optimization plan. Once `<WorkspaceChrome />` ships, items 3 (notification matrix) and 4 (`/me` boundary) become straightforward — both reduce to "what data does the bell / messages button surface?" and can be threaded through one place.

## Decision needed

Approve the WorkspaceChrome contract and app-switcher capability rules. On approval, execute in 4 PRs (component-build, then per-shell rewire).
