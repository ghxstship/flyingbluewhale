# ADR-0010 — Unified notifications matrix + `/me` three-area reshape

**Status:** Proposed
**Date:** 2026-06-04
**Owner:** Platform engineering
**Relates to:** ADR-0007 (cross-shell chrome — defines the bell + messages affordances that read from this matrix), CLAUDE.md §"Push fan-out" + §"Workforce parity loop-closure (0050–0051)" — `notification_kind_catalog` view already partly there.

## Context

Two unresolved gaps from the original ecosystem optimization plan:

**Gap A — Notification surface duplication.** Today there are eight distinct UI homes for "things that happened":

| Shell  | Surface                   | Backing                            |
| ------ | ------------------------- | ---------------------------------- |
| ATLVS  | `/me/notifications/inbox` | `public.notifications`             |
| ATLVS  | `/console/inbox`          | `chat_messages` for org threads    |
| Portal | `/p/[slug]/inbox`         | `notifications` filtered by slug   |
| Portal | `/p/[slug]/messages`      | `chat_messages` with AM            |
| Portal | `/p/[slug]/announcements` | `announcements`                    |
| Mobile | `/m/alerts`               | `notifications` filtered to caller |
| Mobile | `/m/notifications`        | push history                       |
| Mobile | `/m/feed`                 | `announcements`                    |

Notifications, messages, announcements, and push history are conceptually one thing — **events that happened to or for the user**. Today they're four data sources rendered eight different ways with three different preference matrices. The chrome bell from ADR-0007 needs one canonical "what notifies me" source to read from; without it, the bell can only show ATLVS notifications and silently mis-represent the other shells.

**Gap B — `/me` is a flat 17-leaf list with no layout.** Today `/me` has no shared layout — only `(personal)/layout.tsx` at the route-group root. The 17 sub-pages (applications, availability, crew, notifications, offers, organizations, preferences, privacy, profile, reviews, saved-searches, security, settings, submissions, talent, tickets, page.tsx) sit as siblings with no organizing structure. Users can't tell "where do I check my marketplace applications" vs "where do I manage my account" because the answer is "the same flat menu, scroll until you find it."

These two gaps are joined because (a) the bell surface lives in `/me/notifications`, and (b) the `/me` reshape is the right moment to consolidate the notifications matrix into one canonical home.

## Decision

Three moves, one ADR. Land them in sequence — Move 1 (data) before Move 2 (layout) before Move 3 (boundary).

### Move 1 — `notifications` becomes the single inbox table

Promote `public.notifications` from "ATLVS in-app inbox" to **the canonical user event log across all three shells**. Today's table already supports:

- `user_id` — receiver scope
- `kind: PushKind` — categorization (matched to `notification_kind_catalog` from migration 0051)
- `title`, `body`, `href` — render payload
- `read_at`, `created_at` — state

Schema additions (migration 0065):

- `scope: text` — `"platform" | "portal" | "mobile" | "all"`. Default `"all"`. Lets a notification target a specific shell's bell when relevant (e.g., a portal-only announcement doesn't surface in ATLVS).
- `project_id: uuid nullable` — when set, the notification is scoped to the project (portal bell filters here).
- `org_id: uuid nullable` — when set, scoped to org (ATLVS bell filters here).
- Index on `(user_id, read_at, created_at desc)` — bell popover query pattern.

Existing producers (push fan-out from `src/lib/push/send.ts`) are extended to write a `notifications` row alongside the push send, so the matrix sees every event regardless of the user's push opt-in.

### Move 2 — `/me` gets a layout with three areas

Build `src/app/(personal)/me/layout.tsx` with a section-grouped horizontal tab nav. Three areas:

| Area            | Leaves                                                                              | Why grouped                |
| --------------- | ----------------------------------------------------------------------------------- | -------------------------- |
| **Account**     | Profile · Preferences · Privacy · Security · Organizations                          | Identity, settings, access |
| **Activity**    | Dashboard (`/me`) · Notifications · Tickets · Reviews                               | "Things happening to me"   |
| **Marketplace** | Talent · Applications · Submissions · Offers · Availability · Saved Searches · Crew | Discovery + participation  |

Same horizontal tab pattern the previous flat list used (per existing `(personal)/layout.tsx`), but tabs render in three groups separated by quiet dividers — Linear / Notion section pattern. No URL changes; the existing 17 routes survive verbatim.

### Move 3 — `/me` vs `/p/[slug]` boundary clarified

Rule, written into `src/lib/urls.ts` JSDoc and CLAUDE.md:

| Surface concern                                                                  | Home                                  |
| -------------------------------------------------------------------------------- | ------------------------------------- |
| Cross-project identity (resume, talent EPK, ratings rollup)                      | `/me/marketplace/*`                   |
| Project-scoped engagement (specific project's offer, applying to this open call) | `/p/[slug]/<persona>/*`               |
| Inbox of events from any source                                                  | `/me/notifications` (always)          |
| Conversation with the project's account manager                                  | `/p/[slug]/messages` (project-scoped) |

Where today's `/me/applications` is ambiguous (could be "applications I've made anywhere" or "applications for this project"), it becomes `/me/marketplace/applications` (cross-project). Project-scoped application detail uses `/p/[slug]/apply/[applicationId]`. **URL renames are deferred to a follow-up PR** — this ADR documents the rule; rename + redirect comes after.

## Migration rules

1. **Move 1 first** — without the consolidated `notifications` table, Move 2's bell rendering can't work. Migration 0065 + push-sender extension are a single commit.
2. **Move 2 is layout-only** — no URL changes, no schema. Adds `src/app/(personal)/me/layout.tsx` with three-area nav rendering. Existing pages unchanged.
3. **Move 3 is documentation-only** — JSDoc + CLAUDE.md update. The URL renames + `urlFor("personal", "/marketplace/applications")` follow-ups are tracked as a separate ADR-0010-followup if needed.
4. **ADR-0007's NotificationsBell auto-benefits.** Once Move 1 lands, the bell on every shell reads from the same `notifications` table with shell-scope filtering (`scope IN ('all', :currentShell)`). Operator sees the same matrix everywhere.
5. **Per-kind preferences honor `notification_kind_catalog`.** `/m/settings/notifications` matrix UI already exists (per CLAUDE.md). Extend it to `/me/notifications/preferences` so the matrix lives in the canonical identity home and the mobile UI re-mounts the same component.

## Acceptance checks

- [ ] `notifications` table has `scope`, `project_id`, `org_id` columns + index. RLS unchanged (still `user_id = auth.uid()`).
- [ ] Every `sendPushTo` / `sendPushBulk` call in `src/lib/push/send.ts` writes a `notifications` row.
- [ ] `<NotificationsBell />` reads from `notifications` filtered to `scope IN ('all', :shell)` AND (`project_id IS NULL OR project_id = :currentProject` for portal).
- [ ] `/me/layout.tsx` renders three-area nav; active route highlights correct group.
- [ ] `/me/notifications` is the canonical preference matrix surface; `/m/settings/notifications` re-mounts the same component, no drift.
- [ ] Typecheck + lint + build clean.

## Open questions

1. **Marketplace area URLs** — fold under `/me/marketplace/<slug>` (cleaner namespace) or keep flat under `/me/<slug>`? Recommend: fold, with redirects. Capture in ADR-0010-followup.
2. **`/console/inbox` retention** — once the bell surfaces messages org-wide, does the dedicated /console/inbox page still earn its keep? Recommend: yes — it's the threaded chat view, not the event log. Two different surfaces.
3. **Anon portal visitors** — portal `/p/[slug]` is anon-readable. The chrome from ADR-0007 hides itself for anon visitors, so the notifications matrix doesn't need anon handling. Confirm with security review.

## Out of scope

- `urlFor()` API changes — keep current shape.
- Push-notification taxonomy expansion — handled by `notification_kind_catalog` already.
- Cross-org notification aggregation (multi-org users) — separate concern; rolls up via `last_org_id` for now.

## Forward look

Once Moves 1–3 land, the bell in ADR-0007's WorkspaceChrome surfaces the right notifications in the right shell for the right user without needing any per-shell special-casing. `/me/notifications` becomes the system-of-record; the bell and `/m/settings/notifications` are alternate UIs over the same source.

The follow-up `urlFor("personal", "/marketplace/...")` rename is straightforward once the three-area nav lands — it's the same kind of "demote, redirect, document" pattern ADR-0006 used for Pipeline.

## Decision needed

Approve the three moves. Execute Move 2 (layout, this commit) and Move 3 (docs); defer Move 1 (schema + push wiring) to a separate dedicated PR because it touches every push-fan-out call site in `src/lib/push/send.ts` and warrants its own validation pass.
