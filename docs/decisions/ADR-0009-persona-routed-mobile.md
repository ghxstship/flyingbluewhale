# ADR-0009 — Persona-routed mobile: `/m` → `/m/[role]/…`

**Status:** Proposed
**Date:** 2026-06-04
**Owner:** Platform engineering
**Relates to:** ADR-0001 (three-shell topology), ADR-0006 (generic mobile tab bar default), ADR-0008 (portal persona depth)

## Context

COMPVSS today is **role-blind at the route level**. The same 58 surfaces are reachable by every authenticated user with the same 5-tab bar (Home · Inbox · Shift · Alerts · Me after ADR-0006). Phase-aware reordering exists; role-aware doesn't.

This is the inverse of the GVTEWAY portal, where every URL is persona-scoped (`/p/[slug]/<persona>/...`). The mismatch shows up in three ways:

1. **First-screen value is low for specialists.** A medic on `/m` sees Gate Scan, Shift, Punch List, Driver Run Sheet, Inventory Scan — none of which are theirs. Their tool (`/m/medic`) is buried in the Tools drawer.
2. **The 5-tab bar can't fit every role's primary needs.** Security's primary is Gate Scan; medic's is patient log; driver's is run sheet; performer's is schedule. Generic defaults leave specialists one tap deeper than they should be.
3. **Smoke testing scales poorly.** `scripts/compvss-smoke.mjs` runs 47 routes × 4 roles = 188 page-render checks, but the routes don't change per role — so the role dimension is mostly trivial. Persona-routing would make smoke tests targeted (only routes that belong to a role are checked for that role).

Connecteam, When I Work, and Sling all persona-route. Salesforce Lightning's per-cloud app model is the same idea at a different scale.

## Decision

Route `/m` through `/m/[role]/...` where `[role]` is a known mobile persona. Default role resolved from session at first visit; user can switch via the Me tab.

### Role enum

```ts
export type MobileRole =
  | "performer" // talent — primary need: schedule, advancing, comms
  | "crew" // production crew — primary: shift, ros, punch, daily log
  | "driver" // logistics — primary: driver run sheet, dispatch, wayfind
  | "medic" // medical — primary: patient log, medic queue, alerts
  | "guard" // security — primary: gate, incident, patrol log
  | "admin"; // ops admin — primary: ROS, dispatch, full surface drawer
```

Six roles. Maps from `session.persona` and `session.platformRole` via `mapSessionToMobileRole()`. Users with ambiguous role (e.g., an admin who is also a performer on this project) get a chooser on first visit, stored in `user_preferences.ui_state.mobile_role`.

### URL structure

| Today      | After ADR-0009                                                                                       |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| `/m`       | `/m/[role]` (role-specific home)                                                                     |
| `/m/gate`  | `/m/guard/gate` (canonical) + `/m/gate` (alias → resolves to current role's gate page or 404 if N/A) |
| `/m/medic` | `/m/medic/log`                                                                                       |
| `/m/clock` | `/m/<role>/clock` (every role gets it)                                                               |
| `/m/inbox` | `/m/<role>/inbox` (every role gets it)                                                               |

Routes that are universally needed (Clock, Inbox, Feed, Settings, Guide) stay accessible under every role's namespace. Routes that are role-specific (Gate, Medic Log, Driver Run Sheet) live only under their owner's namespace.

### Tab bar per role

```ts
const ROLE_TABS: Record<MobileRole, NavItem[]> = {
  performer: [
    { label: "Home", href: "/m/performer" },
    { label: "Schedule", href: "/m/performer/schedule" },
    { label: "Inbox", href: "/m/performer/inbox" },
    { label: "Alerts", href: "/m/performer/alerts" },
    { label: "Me", href: "/m/performer/settings" },
  ],
  crew: [
    { label: "Home", href: "/m/crew" },
    { label: "Shift", href: "/m/crew/shift" },
    { label: "Inbox", href: "/m/crew/inbox" },
    { label: "Alerts", href: "/m/crew/alerts" },
    { label: "Me", href: "/m/crew/settings" },
  ],
  driver: [
    { label: "Home", href: "/m/driver" },
    { label: "Run", href: "/m/driver/run" },
    { label: "Wayfind", href: "/m/driver/wayfind" },
    { label: "Alerts", href: "/m/driver/alerts" },
    { label: "Me", href: "/m/driver/settings" },
  ],
  medic: [
    { label: "Home", href: "/m/medic" },
    { label: "Log", href: "/m/medic/log" },
    { label: "Queue", href: "/m/medic/queue" },
    { label: "Alerts", href: "/m/medic/alerts" },
    { label: "Me", href: "/m/medic/settings" },
  ],
  guard: [
    { label: "Home", href: "/m/guard" },
    { label: "Gate", href: "/m/guard/gate" },
    { label: "Incident", href: "/m/guard/incident" },
    { label: "Alerts", href: "/m/guard/alerts" },
    { label: "Me", href: "/m/guard/settings" },
  ],
  admin: [
    // Admin keeps the ADR-0006 generic default — they touch everything.
    { label: "Home", href: "/m/admin" },
    { label: "Inbox", href: "/m/admin/inbox" },
    { label: "Shift", href: "/m/admin/shift" },
    { label: "Alerts", href: "/m/admin/alerts" },
    { label: "Me", href: "/m/admin/settings" },
  ],
};
```

Tools drawer (`mobileSurfaces`) survives but is filtered per role — guard sees Gate/Wallet/Incident first; medic sees Medic Log/Alerts/Safeguarding first. `mobileSurfacesForRole(role, phase)` extends `mobileSurfacesForPhase()`.

## Migration rules

1. **Three-month dual-route grace.** Old `/m/<surface>` URLs continue to resolve via middleware rewrite into `/m/<currentRole>/<surface>`. The current role is read from `user_preferences.ui_state.mobile_role` or inferred from session. Existing bookmarks, deep links, and the cmd-K palette work unchanged during grace.
2. **One PR per role.** Move 1: scaffold `/m/[role]/...` route group + role enum + `mapSessionToMobileRole()`. Move 2–7: per-role page implementations (mostly thin wrappers re-exporting existing `/m/*` pages). Move 8: middleware rewrite + remove old `/m/<surface>` routes. Move 9: smoke harness updates.
3. **Service worker scope unchanged** — `compvss.*` SW still owns the full `/m/*` tree. Persona-routing is an internal organization.
4. **Smoke harness updates** — `scripts/compvss-smoke.mjs` adopts a role × surface matrix instead of role × all-routes. Total checks drop from 188 to ~80 (6 roles × ~13 role-relevant routes).
5. **Role switching** — `/m/[role]/settings/role` shows a role chooser; switching persists to `ui_state.mobile_role` and redirects to `/m/[newrole]`.

## Acceptance checks

- [ ] A guard signing into `/m` lands on `/m/guard` with the gate-first tab bar.
- [ ] A medic signing into `/m` lands on `/m/medic` with the log-first tab bar.
- [ ] An admin sees the generic tab bar + full surface drawer.
- [ ] Old `/m/<surface>` URLs resolve correctly during the grace window.
- [ ] Role chooser surfaces for ambiguous-persona users (e.g., admin + performer).
- [ ] Smoke harness passes for all 6 roles × their relevant surfaces.
- [ ] Cmd-K palette finds role-specific surfaces from the user's current role.

## Open questions

1. **Phase × role interaction** — both shift the surface order. Which wins? Recommend: role determines the tab bar; phase reorders the Tools drawer beneath it.
2. **Volunteer role** — should there be a 7th role for volunteers, or do they fold into `crew`? Recommend: fold for v1; promote to own role if volunteers report friction.
3. **Role inheritance for owners/admins** — should an owner who's also acting as a guard for a shift have a one-tap "switch to guard mode" affordance? Yes — surface in the AvatarMenu role-chooser.
4. **Persona-rail vs role-tabbar parity with GVTEWAY** — should `mobile_role` and portal `persona` always match for the same user? Mostly yes, but there are edge cases (a crew member who's also a vendor on the same project). Initial rule: independent; user can pick differently per shell.

## Out of scope

- Any portal or console changes.
- Schema changes (purely UI/routing).
- Native mobile (PWA only, as per ADR-0001).
- WorkspaceChrome / app switcher — ADR-0007.

## Forward look

Once persona-routed, COMPVSS is the closest peer to Connecteam: a role-first deskless app where every operator sees their tools first. The role enum becomes the dominant axis for telemetry, smoke testing, and feature gating. Future roles (e.g., `floor_manager`, `dispatcher`, `runner`) get added by extending the enum + adding the route group; no architectural change required.

This ADR is the highest-cost of the three P1 items because every page under `/m/*` gets a routing change. Mitigated by the three-month grace window and the fact that most page bodies are unchanged (the role gates the tab bar + drawer, not the page contents).

## Decision needed

Approve the 6-role enum, URL structure, and tab bars. On approval, execute in 9 sequential PRs over ~2 weeks.
