# ADR-0008 — GVTEWAY portal: crew + vendor persona depth backfill

**Status:** Accepted, amended 2026-07-15 (see §Amendments — 4 of them, all implemented). Superseded in part: Kudos is out. **No open questions remain.**
**Date:** 2026-06-04
**Owner:** Platform engineering
**Relates to:** ADR-0005 (super-persona collapse), CLAUDE.md §"Workforce parity (0046–0048)"

> **Status note (2026-07-15).** This ADR sat at `Proposed` with a "Decision needed"
> footer for six weeks while all three PRs shipped anyway. The 2026-07-15
> COMPVSS↔GVTEWAY leakage audit found the implementation had drifted from the
> spec below in three ways, all now fixed or dispositioned. The core decision
> — that the portal/mobile boundary is **your job, not your device** — is
> ratified. The amendments are the guardrails it shipped without.

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

~~Approve the surface list + URL pattern. On approval, execute in 3 PRs (component extraction, crew, vendor).~~
**Resolved 2026-07-15** — approved as amended below. All 3 PRs had already shipped.

## Amendments (2026-07-15)

Findings from the COMPVSS↔GVTEWAY leakage audit. Each is implemented, not aspirational.

### 1. Project scope is normative, and enforced by the compiler

The spec above says "shifts view of crew **on this project**", "`recognition_posts`
**scoped to project**", "**project-scoped** roster". The implementation filtered on
`session.orgId` and ignored `[slug]` entirely — `/p/alpha/crew/directory` and
`/p/beta/crew/directory` rendered identical org-wide content. The slug is supposed to
BE the authorization boundary (CLAUDE.md §Conventions).

Worst case: `DirectorySurface` served every org member's name + email to the `vendor`
persona. Portal personas are ordinary `memberships` rows in the org, and `contractor`
maps to `vendor` — so an external contractor read the whole company. **RLS does not
and will not catch this**: `memberships_select` permits any org member, and
`users_select_self` permits any co-member. Co-member visibility is the intended DB
model; the app is the only place the boundary can exist.

Fixed: `DirectorySurface` (via `project_members`) and `FeedSurface` (via
`announcements.project_id`) now take `projectId`, **required on the `variant: "portal"`
branch of a discriminated union** — a new portal page that forgets it fails to compile.
Org-wide announcements (`project_id IS NULL`) are excluded from the portal: they're
internal comms. Feed's realtime subscription is scoped to match, so it can't stream
other projects' row payloads.

`ScheduleSurface`, `ChatSurface`, `TimeOffSurface`, `DocsSurface` were audited and are
already user-scoped (`.eq("user_id", session.userId)` / room membership). No change.

### 2. Kudos is removed from the portal (resolves Open question 3: **no**)

Open question 3 asked whether a vendor should see kudos across personas and said
"probably yes — recognition is a team thing. Confirm policy with org admin." It was
never confirmed, and the implementation silently answered "yes, org-wide, and writable."

Decision: peer recognition is **org-internal COMPVSS/crew tooling**. It is not a
counterparty surface. `recognition_posts` has no `project_id` column, so it could not
be project-scoped without a migration — and the right fix isn't a migration, it's
deleting the surface. Removed from both persona rails; `crew/kudos` + `vendor/kudos`
routes, `KudosSurface.tsx`, and `kudos-actions.ts` are deleted (the last two had no
other consumer). Kudos lives on in COMPVSS at `/m/feed`, which reads `recognition_posts`
directly, and in the console at `/studio/workforce/recognition`.

Consequence: `recognition_reactions` now has **no UI writer** — the portal surface was
the only one. The table and its RLS remain; reinstate reactions in `/m/feed` if wanted.

Drop the "some vendors don't need Kudos" line from §Forward look's capability matrix —
no vendor needs Kudos.

### 3. Resolved (Amendment 4): the portal advertised COMPVSS and handed users off to it

The ADR's goal is desktop parity "without installing the PWA". But the shipped portal
renders CTAs that eject users straight into `/m/**`:

| Portal surface | CTA | Target |
| --- | --- | --- |
| `{crew,vendor}/schedule` | Clock in · Swap | `/m/clock` · `/m/requests` |
| `{crew,vendor}/time-off` | New request | `/m/time-off/new` |
| `{crew,vendor}/docs` | Upload | `/m/docs/new` |
| `{crew,vendor}/chat` | Open room | `/m/inbox/[id]` |
| `[slug]/tasks` | Onboarding | `/m/onboarding/[id]` |

So the read is on desktop and every write is in the PWA — the exact friction this ADR
set out to remove. Worse for `vendor`: the `partner` entitlement band is
`{gvteway: full, cvrgo: ro}` (`src/lib/entitlements.json`) — **no COMPVSS reach at
all**. The portal invites a vendor into an app they aren't entitled to enter. That is
the same defect class as the GVTEWAY Onsite tab in the COMPVSS bar (rehomed to
`/p/onsite` the same day): a surface pointing at a product its audience can't reach.

Three ways out were tabled: (1) build portal-native write flows, (2) drop the
CTAs and go read-only, (3) keep the handoff for `crew` and drop it for `vendor`.

**Resolved 2026-07-15 — see Amendment 4.** Approved as (1), with one carve-out
that none of the three options had the shape to express: the clock punch.

## Amendment 4 (2026-07-15) — the boundary is capability, not device

Amendment 3's three options all asked "which personas get the handoff?" The
investigation that closed it found that was the wrong axis. Sorting the five
handoffs by *what they actually need* separates them cleanly, and the split
does not fall along persona lines at all:

| Handoff | Needs a field capability? | Disposition |
| --- | --- | --- |
| Chat room (`/m/inbox/[id]`) | No | **Already existed portal-side.** `/p/[slug]/messages/[roomId]` is a complete room — and richer than the mobile one (cursor pagination, author-name hydration, inbox fan-out on send). The portal was ejecting users into COMPVSS to render a room it already had; the only thing missing was the `slug` to build the URL. |
| Time off (`/m/time-off/new`) | No | Portal-native form. It's a date range and a reason. |
| Docs upload (`/m/docs/new`) | No | Portal-native form. Reads as camera-bound, isn't: the mobile input carries **no `capture` attribute** on purpose, so it's an OS file picker — which every desktop has. |
| Onboarding (`/m/onboarding/[id]`) | No | Portal-native. Ticking a step is a form; the page was already built on portal-neutral primitives. |
| Swap (`/m/requests`) | No | Portal-native, filed inline on the shift card. **This CTA was also broken** — see below. |
| **Clock in (`/m/clock`)** | **Yes** | **Stays in COMPVSS.** |

So the rule, which decides future cases instead of just these five:

> **The portal/mobile boundary is capability, not device.** A write belongs in
> the portal unless it *requires* a field capability the browser cannot
> honestly provide: geofence truth, offline durability, or the camera as a
> sensor (not as a file picker).

Exactly one write in the codebase qualifies. The punch needs `navigator.geolocation`
for `geofence_state` **and** the service-worker/IndexedDB outbox for durability —
`POST /api/v1/time/clock` is a route handler rather than a server action
*specifically* so the SW can intercept it (`src/lib/offline/outbox.ts`,
`QUEUEABLE_ENDPOINTS`). A desktop punch would have neither. Porting it would not
be parity; it would be buddy-punching with a nicer layout. Saying "punches happen
in COMPVSS, and here's why" is more useful to a crew lead than a button that
silently records a worse punch.

This does not reopen the "your job, not your device" principle — it sharpens it.
COMPVSS is the field-optimized view; the one thing that is *genuinely* about the
field stays there, and nothing else hides behind it.

### What shipped

- **`src/components/workforce/shell-contract.ts`** — the contract as types.
  `PortalHref = ` `` `/p/${string}` `` makes `/m/clock` **unassignable** on a
  portal arm: the regression fails `tsc` instead of shipping. This is Amendment
  1's move for Amendment 1's reason — that rule was prose for six weeks and the
  implementation ignored it, so the fix was `projectId?: never`. Prose did not
  hold; it wasn't going to hold here either.
- **`ClockInDisposition`** (`"compvss" | "none"`) — required on `ScheduleSurface`'s
  portal arm. A new portal persona page must **state** whether its audience can
  reach COMPVSS. There is no default that quietly advertises an app the reader
  can't open. Crew pass `"compvss"` and get a labeled signpost; vendor passes
  `"none"` and gets silence.
- **Four surfaces converted to discriminated unions** — `ScheduleSurface`,
  `TimeOffSurface`, `DocsSurface`, `ChatSurface`. Only `DirectorySurface` and
  `FeedSurface` had them before (from Amendment 1); the other four were flat prop
  objects where `variant` did nothing but pick a CSS class, which is precisely why
  they couldn't enforce anything.
- **Shared actions** — `time-off-action.ts`, `docs-action.ts`, `swap-action.ts`
  join the existing `feed-action.ts` in `src/components/workforce/`, each taking a
  `revalidate` field so one action serves both shells and the guards can't drift
  per shell. Mobile call sites are behaviourally unchanged.
- **`shell-contract.test.ts`** — canon guard. `PortalHref` can't see a `<Link href="/m/...">`
  hardcoded into a portal page, and hardcoded deep links are how the drift got in
  the first time. The guard also asserts the *premise*: if a future kit revision
  grants the `partner` band COMPVSS reach, it fails loudly so `clockIn: "none"`
  gets revisited on purpose rather than quietly staying wrong.

### A live defect this surfaced

The "Swap shift" CTA pointed at `/m/requests` **for both personas — including
crew**. `/m/requests` is the *manager approvals queue*; for the crew member being
shown the button it is a read-only list of their own asks with **no create
affordance**. The swap *create* only ever existed on the shift card at
`/m/schedule`. So the portal's swap button did nothing but land people on an
empty page — an entitlement-independent bug that the persona framing of
Amendment 3 would not have caught. Filing now happens on the card in both shells,
which is where the mobile action's own docblock always said it belonged: "A crew
member finding out they can't make Thursday is looking at Thursday, not hunting a
separate form."

### Consequences

- `recognition_reactions` still has no UI writer (Amendment 2, unchanged).
- The `/p/[slug]/tasks` onboarding row is now the only cross-shell link that was
  *removed* without a portal-side rebuild being needed — the page was already
  shell-neutral.
- `ChatSurface` remains the **last unscoped shared surface**: it lists rooms for
  the caller's whole `session.orgId`, so a room from a different project in the
  same org renders for a vendor. `DirectorySurface` and `FeedSurface` were both
  narrowed to project scope in Amendment 1 for a reason that appears to apply
  here too. Out of scope for this amendment (it needs a look at whether portal
  rooms are project-scopeable at all) and **tracked separately** — flagging it
  here so it isn't rediscovered as a surprise.
