# ADR-0008 — GVTEWAY portal: crew + vendor persona depth backfill

**Status:** Proposed
**Date:** 2026-06-04
**Owner:** Platform engineering
**Relates to:** ADR-0005 (super-persona collapse), CLAUDE.md §"Workforce parity (0046–0048)"

## Context

The portal `crew` persona has 3 sidebar items (Call Sheet · Time · Advances — plus the shared Workspace 6). The `vendor` persona has 6 (Submissions · Equipment Pull List · Purchase Orders · Invoices · Credentials · Training). Both are populous **deskless** personas — a fabrication contractor or production-crew tech is the most common external user we have.

Meanwhile, the COMPVSS mobile shell has 32+ surfaces, many of which (Schedule, Inbox, Feed, Learning, Time Off, Kudos, Surveys, Docs, Directory, Onboarding) are exactly the surfaces a crew member or vendor uses **on desktop too**. Today they can't reach those without installing the PWA. That's the wrong boundary.

> **The portal vs mobile boundary should not be "are you on a phone." It should be "what's your job."**

A crew lead reviewing tomorrow's schedule from a laptop should not have to install a mobile-first PWA to do it. A vendor approving a time-off request shouldn't have to either.

## Decision

Promote 8 Workforce-parity surfaces from COMPVSS into the portal `crew` and `vendor` personas. Reuse the same underlying tables and components — only the route, layout, and persona-rail entry are new. Mobile surfaces are unchanged (they remain the field-optimized version).

### Surfaces to backfill (crew + vendor)

| Surface   | New portal URL                  | Backing data                                       | Mobile equivalent |
| --------- | ------------------------------- | -------------------------------------------------- | ----------------- |
| Schedule  | `/p/[slug]/[persona]/schedule`  | `shifts` view of crew on this project              | `/m/shift`        |
| Feed      | `/p/[slug]/[persona]/feed`      | `announcements` filtered to portal audience        | `/m/feed`         |
| Inbox     | `/p/[slug]/[persona]/chat`      | `chat_rooms` + `chat_messages` for this assignment | `/m/inbox`        |
| Learning  | `/p/[slug]/[persona]/learning`  | `course_assignments` for the user                  | `/m/learning`     |
| Time Off  | `/p/[slug]/[persona]/time-off`  | `time_off_requests` + balances                     | `/m/time-off`     |
| Kudos     | `/p/[slug]/[persona]/kudos`     | `recognition_posts` scoped to project              | `/m/kudos`        |
| Docs      | `/p/[slug]/[persona]/docs`      | `personal_documents` for the user                  | `/m/docs`         |
| Directory | `/p/[slug]/[persona]/directory` | project-scoped roster                              | `/m/directory`    |

### Persona rail composition after backfill

```
crew persona rail:
  Workspace: Overview · Guide · Updates · Inbox · Tasks · Messages
  Crew:      Call Sheet · Schedule · Time · Time Off · Advancing ·
             Feed · Chat · Kudos · Learning · Docs · Directory · Privacy

vendor persona rail:
  Workspace: Overview · Guide · Updates · Inbox · Tasks · Messages
  Vendor:    Submissions · Equipment Pull List · POs · Invoices ·
             Schedule · Credentials · Training · Time Off · Feed ·
             Chat · Kudos · Docs · Directory · Privacy
```

Both stay within Miller's band per section (12 + 6 for crew; 14 + 6 for vendor — vendor borderline, captured in §Open questions).

### What about the other 13 personas?

Most other personas don't need Workforce-parity surfaces because they don't engage in ongoing operational rhythms (`client` reviews proposals episodically; `sponsor` checks fulfillment quarterly; `guest` is one-trip-only). The personas that benefit:

- **`crew`** — primary target, deskless-workforce
- **`vendor`** — primary target, recurring engagement
- **`volunteer`** — secondary (gets Feed + Learning + Schedule only)
- **`media`** — secondary (gets Feed + Directory only)
- **`delegation`** — out of scope (governance persona, not workforce)

Volunteer + media additions are a follow-up Move 3 — execute crew + vendor first.

## Migration rules

1. **No schema changes.** Every backing table exists. Portal pages are alternate read surfaces over the same data.
2. **Shared components reused.** `<RealtimeRefresh />`, `<PortalDocVault />`, the same chat / feed / learning page components from `(mobile)/m/*` are factored into `src/components/workforce/` and imported by both shells.
3. **Page-level wrappers per shell** — portal pages wrap the shared component with `<PortalShellPage>` (ModuleHeader + breadcrumbs); mobile pages wrap with `<MobilePage>` (no breadcrumbs, larger touch targets). Same data, different chrome.
4. **Realtime parity.** The Realtime channel filter (project + user) is identical between shells, so a kudos posted from mobile shows up instantly in the portal and vice versa.
5. **Three PRs.** Move 1: extract shared components into `src/components/workforce/`. Move 2: build crew portal pages (8 routes). Move 3: build vendor portal pages (8 routes + persona-specific filters).

### URL design choice

Backfilled pages use the persona-scoped path (`/p/[slug]/crew/schedule`) rather than a shared `/p/[slug]/schedule`. Rationale: the same surface filters differently by persona (a crew schedule = `shifts.assignee_id = me`; a vendor schedule = `shifts` linked to vendor's POs). Separate URLs make the filter explicit at the layout level instead of hidden inside the page.

## Acceptance checks

- [ ] Crew on desktop can do everything COMPVSS lets them do without installing the PWA.
- [ ] Vendor on desktop can do everything their workflow requires (review POs, submit invoices, check schedule, post kudos) without leaving the portal.
- [ ] Realtime updates flow between portal and mobile within 1s (no second polling layer).
- [ ] Persona rails respect Miller's band per section (max 10 items).
- [ ] `npm run gen:types` + typecheck + build clean after each Move.

## Open questions

1. **Vendor persona at 14 items is over Miller's ceiling.** Split into `Vendor / Engagement` (Submissions, POs, Invoices, Credentials, Training, Time Off) and `Vendor / Operations` (Schedule, Equipment Pull List, Feed, Chat, Kudos, Docs, Directory)? Recommend: split.
2. **Volunteer + media backfill timing** — defer to Move 4 or do as part of Move 2/3? Recommend: defer; they're lower-leverage and the crew/vendor wins prove the pattern first.
3. **Cross-persona kudos visibility** — should a vendor see kudos posted to crew (and vice versa) on the same project? Probably yes — recognition is a team thing. Confirm policy with org admin.

## Out of scope

- Mobile shell surface changes. COMPVSS keeps its 58 routes; the backfill adds _new_ portal routes, doesn't move mobile ones.
- Persona-routed mobile (`/m/[role]`) — ADR-0009.
- Cross-shell chrome — ADR-0007.

## Forward look

Once crew + vendor reach desktop parity, COMPVSS becomes correctly positioned as the **field-optimized** view (offline-first, camera-first, geo-aware) rather than the **only** view. Persona-routed mobile (ADR-0009) further tunes it per role; this ADR removes the install-the-PWA-or-be-blocked friction from the desktop side.

Schema-touching follow-ups that this ADR enables but doesn't require:

- A `portal_persona × surface` capability matrix in `account_manager_assignments` so an admin can choose which surfaces a vendor sees (some vendors don't need Kudos; some crews need extras).
- Per-persona dashboard skinning so the persona landing page shows different metrics (crew: hours logged + next shift; vendor: outstanding POs + invoice status).

## Decision needed

Approve the surface list + URL pattern. On approval, execute in 3 PRs (component extraction, crew, vendor).
