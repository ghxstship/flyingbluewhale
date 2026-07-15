# ADR-0008 — GVTEWAY portal: crew + vendor persona depth backfill

**Status:** Accepted, amended 2026-07-15 (see §Amendments — 7 of them, all implemented; Amendment 7 has three parts). Superseded in part: Kudos is out. **All three §Open questions are closed and every acceptance check is verified and guarded.** The one deliberate carve-out is the shift punch, which stays in COMPVSS by rule, not by omission (Amendment 4). Amendment 7 generalises Amendment 5's question — "does RLS agree, if you skip the app?" — across all 65 identity-filtered tables; four more live escalations, all fixed and guarded.
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

> **Superseded — this composition is the June 2026 plan, kept for the record.**
> Two things about it were wrong. Kudos is not in either rail (Amendment 2
> deleted the surface). And "both stay within Miller's band (12 + 6 for crew;
> 14 + 6 for vendor — vendor borderline)" was simply false: the band is max 10
> per section, so crew at 12 was already over it and vendor at 14 was not
> "borderline" but well past. That sentence is why the acceptance check went
> unenforced for weeks — the document asserted the property it was supposed to
> be testing. Both rails are split now, and `portal-rail-canon.test.ts` counts
> them rather than trusting this paragraph. See Amendment 6.

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

Verified 2026-07-15 (Amendment 6). Each line names what actually checks it —
a checkbox nobody runs is an intention, not an acceptance check, and check 4
proves the point: it sat unticked and **failing in production for weeks**.

- [x] **Crew on desktop can do everything COMPVSS lets them do without installing the PWA** — with one deliberate exception, the shift punch (Amendment 4: it needs geofence truth + offline durability, so a desktop punch would be a worse punch, not parity). Every other write is portal-native. Guarded by `src/components/workforce/shell-contract.test.ts`.
- [x] **Vendor on desktop can do everything their workflow requires without leaving the portal** — and this one was the sharpest failure: the `partner` band has no COMPVSS reach at all, so the portal was linking vendors into a locked door (Amendment 4). "post kudos" is struck from the requirement — Amendment 2 removed the surface. Guarded by the rendered-DOM assertions in `e2e/portal-workforce-parity.spec.ts`.
- [x] **Realtime updates flow between portal and mobile within 1s (no second polling layer)** — `<RealtimeRefresh />` subscribes to the same filtered table in both shells; Amendment 1 narrowed the Feed channel to the project so it can't stream other projects' payloads. No polling layer was added.
- [x] **Persona rails respect Miller's band per section (max 10 items)** — **was failing.** Vendor was split at 14; crew was left at 11 behind a comment promising a "future cut" and drifted to 12. Both are split now, and `src/lib/portal-rail-canon.test.ts` counts every section so the next persona to outgrow the band fails CI instead of shipping.
- [x] **Typecheck + build clean** — `gen:types` is not an npm script in this repo (types are regenerated via the Supabase MCP); the schema is untouched by this ADR anyway, per Migration rule 1.

## Open questions

_All three are resolved. Kept with their answers rather than deleted — the
reasoning is why the code looks the way it does._

1. ~~**Vendor persona at 14 items is over Miller's ceiling.** Split into `Vendor / Engagement` and `Vendor / Operations`? Recommend: split.~~
   **Resolved 2026-07-15 (Amendment 6): split, and the ceiling is now enforced rather than intended.**
2. ~~**Volunteer + media backfill timing** — defer to Move 4 or do as part of Move 2/3? Recommend: defer.~~
   **Resolved 2026-07-15 (Amendment 6): still deferred, but the stated precondition has now been met — see below.**
3. ~~**Cross-persona kudos visibility** — should a vendor see kudos posted to crew? Probably yes.~~
   **Resolved 2026-07-15 (Amendment 2): no. The surface is deleted.**

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

> **⚠ This paragraph is wrong, and it is the most expensive sentence in this
> document — see Amendment 5 and 5.2 before relying on it.** The audit behind it
> checked the APP's filter and never asked whether the DB agreed. Three of the four
> were hiding live escalations reachable by the `vendor` persona: chat (self-join any
> room), time-off (read everyone's requests, approve your own leave, write anyone's
> balance), and shifts (every persona read every shift). Only `DocsSurface` was
> genuinely self-scoped at the DB. Left in place rather than rewritten because the
> claim is the finding: "the app filters it" was never evidence about the database,
> and reading it as a clearance is what let the holes sit.

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

| Portal surface           | CTA             | Target                     |
| ------------------------ | --------------- | -------------------------- |
| `{crew,vendor}/schedule` | Clock in · Swap | `/m/clock` · `/m/requests` |
| `{crew,vendor}/time-off` | New request     | `/m/time-off/new`          |
| `{crew,vendor}/docs`     | Upload          | `/m/docs/new`              |
| `{crew,vendor}/chat`     | Open room       | `/m/inbox/[id]`            |
| `[slug]/tasks`           | Onboarding      | `/m/onboarding/[id]`       |

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
handoffs by _what they actually need_ separates them cleanly, and the split
does not fall along persona lines at all:

| Handoff                           | Needs a field capability? | Disposition                                                                                                                                                                                                                                                                                                               |
| --------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat room (`/m/inbox/[id]`)       | No                        | **Already existed portal-side.** `/p/[slug]/messages/[roomId]` is a complete room — and richer than the mobile one (cursor pagination, author-name hydration, inbox fan-out on send). The portal was ejecting users into COMPVSS to render a room it already had; the only thing missing was the `slug` to build the URL. |
| Time off (`/m/time-off/new`)      | No                        | Portal-native form. It's a date range and a reason.                                                                                                                                                                                                                                                                       |
| Docs upload (`/m/docs/new`)       | No                        | Portal-native form. Reads as camera-bound, isn't: the mobile input carries **no `capture` attribute** on purpose, so it's an OS file picker — which every desktop has.                                                                                                                                                    |
| Onboarding (`/m/onboarding/[id]`) | No                        | Portal-native. Ticking a step is a form; the page was already built on portal-neutral primitives.                                                                                                                                                                                                                         |
| Swap (`/m/requests`)              | No                        | Portal-native, filed inline on the shift card. **This CTA was also broken** — see below.                                                                                                                                                                                                                                  |
| **Clock in (`/m/clock`)**         | **Yes**                   | **Stays in COMPVSS.**                                                                                                                                                                                                                                                                                                     |

So the rule, which decides future cases instead of just these five:

> **The portal/mobile boundary is capability, not device.** A write belongs in
> the portal unless it _requires_ a field capability the browser cannot
> honestly provide: geofence truth, offline durability, or the camera as a
> sensor (not as a file picker).

Exactly one write in the codebase qualifies. The punch needs `navigator.geolocation`
for `geofence_state` **and** the service-worker/IndexedDB outbox for durability —
`POST /api/v1/time/clock` is a route handler rather than a server action
_specifically_ so the SW can intercept it (`src/lib/offline/outbox.ts`,
`QUEUEABLE_ENDPOINTS`). A desktop punch would have neither. Porting it would not
be parity; it would be buddy-punching with a nicer layout. Saying "punches happen
in COMPVSS, and here's why" is more useful to a crew lead than a button that
silently records a worse punch.

This does not reopen the "your job, not your device" principle — it sharpens it.
COMPVSS is the field-optimized view; the one thing that is _genuinely_ about the
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
  the first time. The guard also asserts the _premise_: if a future kit revision
  grants the `partner` band COMPVSS reach, it fails loudly so `clockIn: "none"`
  gets revisited on purpose rather than quietly staying wrong.

### A live defect this surfaced

The "Swap shift" CTA pointed at `/m/requests` **for both personas — including
crew**. `/m/requests` is the _manager approvals queue_; for the crew member being
shown the button it is a read-only list of their own asks with **no create
affordance**. The swap _create_ only ever existed on the shift card at
`/m/schedule`. So the portal's swap button did nothing but land people on an
empty page — an entitlement-independent bug that the persona framing of
Amendment 3 would not have caught. Filing now happens on the card in both shells,
which is where the mobile action's own docblock always said it belonged: "A crew
member finding out they can't make Thursday is looking at Thursday, not hunting a
separate form."

### Consequences

- `recognition_reactions` still has no UI writer (Amendment 2, unchanged).
- The `/p/[slug]/tasks` onboarding row is now the only cross-shell link that was
  _removed_ without a portal-side rebuild being needed — the page was already
  shell-neutral.
- `ChatSurface` was flagged here as "the last unscoped shared surface" that
  probably needed `projectId` like Directory/Feed. **Amendment 5 investigated
  and the flag was wrong** — see it for why (membership is a per-row grant and
  is strictly _finer_ than project scope; scoping by project would leak and
  over-hide at the same time). It found a real RLS hole instead.
- **One instance of this defect is knowingly still open**: `/p/[slug]/crew/timesheets`
  is read-only and its empty state promises a pipeline ("once a pay period is
  compiled and submitted…") that no portal or `/m` surface can reach.
  `POST /api/v1/timesheets/{id}/submit` exists and works, so the promise is keepable
  and submitting a timesheet is a form — which under this amendment's rule puts it in
  the portal. Not built here only because it landed from a concurrent session after
  this amendment shipped; tracked as P2 item 7 in `docs/compvss/TIME_LIFECYCLE_BACKLOG.md`.
  Naming it because "the surface promises a write the reader cannot perform" is exactly
  the defect class Amendment 4 exists to close, and an unclosed instance inside the
  amendment's own lane should not have to be rediscovered.

### Correction: the `/p/community` "router-init race" was not real

The Amendment 4 session reported that the new `portalConsumerNav` sweep caught a
`Router action dispatched before initialization` error on `/p/community` on its
first run, and filed it as a defect. **It does not reproduce** — ~14 runs and
100+ route loads later (warm and cold `.next`, authed and anonymous, `retries=0`)
produced zero page errors, and every lead in the original report was disproven:
`TasteOnboarding`'s only `router.push` is behind an onClick and it mounts solely
at `/p/welcome`, which sorts _after_ `/p/community` and cannot precede it;
`ActivityTimeline` does have `Date.now()`-in-render but is a pure server
component, so it never hydrates and no mismatch is possible.

The error was **mis-attributed by the spec itself**: `probe()` attached and
detached its `pageerror` listener per route while `waitUntil: "domcontentloaded"`
returns before hydration finishes, so a late error from route N fired during
route N+1's `goto` and was charged to N+1. `probe()` is hardened now (errors are
tagged with `page.url()` at fire time and reconciled per group).

Recorded here because the claim also went into `99fc4e99`'s commit message,
which can't be reworded — other sessions have built on it, and rewriting shared
history in a tree with live concurrent sessions is worse than a wrong sentence.
The lesson is the cheap one: one red run plus one green retry is a hypothesis,
not a defect, and this repo already had a memory note warning that e2e
`pageerror` gates mis-attribute to neighbouring routes.

## Amendment 5 (2026-07-15) — chat is not project-scoped, on purpose

Resolves the `ChatSurface` item flagged in Amendment 4 §Consequences. **Chat stays
unscoped by project. Membership is the boundary** — and this amendment makes that
true in the database, where it was not.

This is the third pass over the same surface, and the ADR has been arguing with
itself. Amendment 1 audited `ChatSurface` and concluded "already user-scoped
(… room membership). **No change**." Amendment 4 then called it "the last unscoped
shared surface" and flagged it as a probable Amendment 1 omission. Amendment 1 was
right. Writing down _why_ is the point of this amendment.

### Why the Amendment 1 reasoning does not transfer

Amendment 1's rule reads like it should apply here, and doesn't, for a reason worth
stating precisely:

> **RLS does not and will not catch this**: `memberships_select` permits any org
> member […] the app is the only place the boundary can exist.

That sentence is the whole justification for putting scope in a React component's
props. It is true of `memberships` and `announcements`: those are org-wide reads with
**no per-row grant**, so every org member sees every row by default and the DB has
nothing to key a policy on. Project scope was the nearest available boundary, and the
compiler was the only place left to enforce it.

Chat is the opposite shape. A `chat_rooms` row is reachable only through an explicit
`chat_room_members` row — a **positive, per-row, deliberate grant**, exactly the thing
`memberships` lacks. So the boundary _can_ live in RLS, which means it _should_: a
props-level filter would be a worse version of a constraint the database can hold.

Membership is also **strictly finer than project scope**, not a weaker substitute for
it. Being on a project does not entitle you to a DM between two other people on that
project. Project-scoping the room list would simultaneously leak (rooms in your project
you were never added to) and over-hide (a room you were deliberately added to that
spans projects — which is most of them). It would be a worse boundary wearing the
right-looking union.

And `chat_rooms` has **no `project_id`** (`org_id`, `name`, `room_kind`, `created_by`,
`last_message_at`, timestamps — see the baseline). Adding one would mean answering
"which project does a DM belong to?", which has no honest answer. That is the same
schema fact that decided Amendment 2, but it lands somewhere different: Kudos was
deleted because `recognition_posts` had no `project_id` **and** no membership grant, so
there was no boundary available at any layer. Chat has the better boundary already.

### The precondition: membership was not actually a boundary

The argument above is only sound if you cannot grant yourself membership. **You could.**
Confirmed against the live DB with nothing but a normal login — `crew@gvteway.test`,
`member` band, a member of zero rooms:

1. `chat_rooms_org_rw` USING `is_org_member(org_id)` → SELECT every room in the org,
   pick "Festival Ops".
2. `chat_room_members_self_rw` WITH CHECK `user_id = auth.uid() OR …` → INSERT a
   self-issued membership row for it.
3. `chat_messages_member_rw` USING `is_room_member(room_id)` → read the entire thread
   and the 6-person roster.

Nobody intended step 2. The baseline spelled the roster rule as "owner/admin may add
members"; the `user_id = auth.uid()` disjunct beside it existed so a room's **creator**
could seed their own first membership row. But a WITH CHECK cannot distinguish "adding
myself to the room I just made" from "adding myself to your DM" — both are
`user_id = auth.uid()`. The bootstrap clause was load-bearing and, read literally,
universal.

`20260611055842_chat_rls_recursion_fix` then widened it, despite its header saying "no
new access is introduced". It recreated both policies with `USING` and **no
`WITH CHECK`**; they are `FOR ALL` policies, and Postgres reuses `USING` as the write
check when `WITH CHECK` is omitted. So the baseline's `member_role IN ('owner','admin')`
requirement for adding _other_ people silently became "any member may add anyone", and
`chat_messages` lost its `is_org_member(org_id)` write pin. That migration was fixing a
real BLOCKER (policy recursion) and its stated semantics were correct — it just wrote
them into `USING` only and let the `FOR ALL` fallback do the rest quietly.

Note what project-scoping `ChatSurface` would have done about any of this: **nothing**.
The attack is a PostgREST call. It never renders a React component. Amendment 1's move
was the right tool for `memberships`, where the app is genuinely the only available
boundary; reaching for it here would have added a `projectId` prop, closed no hole, and
left the ADR feeling finished.

### What shipped

`20260715180000_chat_membership_boundary.sql` replaces the implicit `FOR ALL` fallbacks
with explicit per-command policies, so a write check can never again be inherited from a
read check by accident:

- **`chat_room_members` INSERT** — the room's **creator** (bootstrap) or an
  **owner/admin**. `user_id = auth.uid()` is gone; that was the hole. Creator-bootstrap
  covers every legitimate insert path in the app, including the two that add _other_
  people (`startDmAction` adds the DM partner, the portal AM route adds the manager) —
  all three create the room first, so `created_by` is already the caller.
- **`chat_rooms` SELECT** — members, or the creator (the latter keeps
  `INSERT … RETURNING` working, since PostgREST re-reads the new row before any
  membership row exists). Closes the enumeration in step 1. Every real reader is already
  membership-scoped (`.in("id", roomIds)`, or `.eq("id", roomId)` + an explicit
  membership check + `notFound()`), so no supported behaviour changes.
- **`chat_rooms` INSERT** — `created_by` must be the caller. `is_room_creator` is only a
  safe bootstrap key if `created_by` can't be forged.
- **`chat_messages` INSERT** — restores the `is_org_member(org_id)` pin.
- **`tg_chat_member_role_guard`** — a member may write their own row (that is how
  pin/mute/`last_read_at` work), and "their own row" includes `member_role`. Without the
  trigger a plain member could self-promote to owner and then add outsiders — narrower
  than the self-join, but it would hollow out the admin-only roster rule this migration
  just established. It needs a trigger because `WITH CHECK` sees only `NEW` and cannot
  say "`member_role` is unchanged".

`ChatSurface` itself is **unchanged apart from its docblock**, which now carries this
reasoning so the next audit finds the answer at the call site instead of re-deriving it.
`chat-membership-boundary.test.ts` guards the two facts that would silently un-decide
this: that no chat policy reintroduces a self-service join, and that `chat_rooms` still
has no `project_id` (if a future migration adds one, the "not scopeable" half of this
rationale expires and should be reconsidered on purpose).

### Consequences

- `ChatSurface` is no longer "the last unscoped shared surface" — it is the one shared
  surface whose boundary is enforced a layer _below_ the props, which is better.
  Amendment 4 §Consequences is superseded on this point.
- The Amendment 1 rule is now stated with its precondition: **put scope in the props
  only when there is no per-row grant for RLS to key on.** Directory and Feed qualify;
  chat does not. Applied without that precondition the rule is cargo cult, and here it
  would have shipped a `projectId` prop over a live read-any-DM hole.
- The four surfaces Amendment 1 waved through as "already user-scoped" were audited for
  _scope_ but not for _whether the DB agreed_. `ScheduleSurface`, `TimeOffSurface` and
  `DocsSurface` all rest on `.eq("user_id", session.userId)`. That is an app-level
  filter with the same question underneath it — does RLS hold the line if someone skips
  the app? Not audited here; worth its own pass.

## Amendment 5, part 2 (2026-07-15) — the three flags, resolved

Amendment 5 shipped with three loose ends. Closing them turned up a second live
cluster of the same defect and one regression Amendment 5 itself introduced.

### Flag 1 — "a no-op write returns no error" is not trivia

Noted as probe hygiene: an RLS `DELETE`/`UPDATE` that matches zero rows is not an
error. PostgREST returns success. It bit three times in one day:

1. the chat probe's cleanup reported "delete ok" and left orphan rooms;
2. the time-off verification probe reported `*** VULNERABLE ***` for two vectors
   that were in fact **refused** — the UPDATE matched nothing and returned no
   error, and the probe read that as success. The fix was to assert on the row's
   state afterwards (`rows_returned=0`, `request_state` still `pending`) rather
   than on the absence of an error object;
3. and, not as a probe artifact at all, in `offboardMembershipInOrg` — below.

The rule this leaves behind: **a security check that reads an error object is
not a check.** Read the row back. Both directions of every probe in this
amendment now assert on observed state.

### Flag 2 — chat_rooms DELETE

`chat_rooms_delete` requires `is_room_admin(id)`, so a creator who has left their
own room can no longer delete it. Resolved as **intentional, and inert**: no app
path deletes a `chat_rooms` row (the table has a `deleted_at` column and nothing
writes it either). Room deletion is a latent admin capability, not a user-facing
feature, and `created_by` is deliberately NOT a DELETE key — "I made this room a
year ago" should not confer the power to destroy a conversation and cascade its
messages after leaving it. Kept admin-only.

### Flag 3 — the three surfaces Amendment 1 waved through

Amendment 1 audited `ScheduleSurface` / `TimeOffSurface` / `DocsSurface` and said
"already user-scoped (`.eq("user_id", session.userId)`)". That audited the APP
filter. Asking whether RLS agreed produced:

- **`DocsSurface` → `personal_documents`: clean.** `personal_documents_self_rw` is
  `user_id = auth.uid()` in both USING and WITH CHECK. The DB genuinely agrees.
- **`TimeOffSurface` → a second live hole.** Fixed in
  `20260715152918_time_off_self_approval_boundary.sql`; see below.
- **`ScheduleSurface` → `shifts` / `workforce_members`: org-member-readable,
  left alone deliberately.** Both are `is_org_member(org_id)` on SELECT, so the
  app filter is the only thing narrowing them to the caller. Unlike time-off this
  is not obviously wrong: it matches the co-member visibility model the ADR
  already documents for `memberships`, and it is load-bearing — `shifts` is read
  org-wide by shift-swap browsing, the volunteer surfaces, call sheets, and the
  ops schedule board. Narrowing it is a product decision about whether a
  **vendor** should see the org's shift pattern (both surfaces are mounted at
  `/p/[slug]/vendor/*`), not a bug fix, and it is not one to make on a guess
  inside a security migration. **Flagged, not fixed** — and flagged with the
  reason, which is what Amendment 4 should have done for chat.

### The second cluster: you could approve your own time off

Confirmed as `crew@gvteway.test` (`member` band) over PostgREST, with a normal
login: read 10 other people's `time_off_requests` **including the free-text
`reason`**, read 4 others' balances, file a request and flip it to `approved`
with a plain UPDATE, approve it again through the RPC, set my own `balance_hours`
to 9999, and write **another user's** balance row. Both surfaces are mounted on
the `vendor` persona, so an external contractor could do all of it.

Two independent causes, both the Amendment 5 shape — the gate is in the app:

1. `time_off_requests_org_rw` / `time_off_balances_self_or_org` were FOR ALL with
   `is_org_member(org_id)` as the WITH CHECK. Any org member could write any row.
2. `approve_time_off_request` is SECURITY DEFINER, `EXECUTE` granted to
   `authenticated`, and checked only `private.is_org_member`. Its own comment said
   so. Being in the org is not authority to decide leave.

Meanwhile `decideTimeOffRequest` carries the comment _"Re-checked here rather than
trusted from the caller so neither shell can skip the gate by hiding a button."_
True of both shells. A PostgREST call is not a shell.

Fixed: per-command policies with the manager band (`owner|admin|manager`, matching
`MANAGER_BAND_ROLES` exactly) in the database; self-filed rows pinned to
`request_state='pending'` so a member cannot INSERT a row that is born approved;
balances writable only by managers (the RPC is SECURITY DEFINER and does its own
decrement); and the RPC taught the same band **plus an explicit self-approval
refusal** — managers file leave too, and their own request is the one they must
not be able to sign off. Verified both ways: every vector refused, and a manager
can still see the 15-request queue, approve, and deny.

### The regression Amendment 5 introduced

Narrowing `chat_rooms` SELECT to members broke `offboardMembershipInOrg`. Step ④
enumerates `chat_rooms` by org to drop a departing user's room memberships; under
the new policy an org admin sees only rooms they are IN — typically none — so
`roomIds` came back empty, the `if (roomIds.length > 0)` guard skipped the delete,
and the user was removed from **zero** rooms. Silently. Measured on the live DB:
the org has 2 rooms and 6 memberships; the admin's offboard path enumerated 0.

That is not cosmetic. `chat_messages` gates on room membership alone with **no org
check**, so a soft-deleted `memberships` row does not revoke chat. A user
offboarded through the console kept reading org threads — the exact "alternate
channel" step ④ exists to close.

Root cause is worth naming, because it is not really about chat: **every step of
that cascade sweeps by org and then filters by what the caller can see.** Under
RLS it clears the intersection and reports success. `leaveOrg` already passed a
service client and said why ("this only elevates the teardown, not the decision");
`removePerson` passed the admin's user client, and nothing in the type system or
the diff distinguished them.

Fixed by removing the choice: `offboardMembershipInOrg(userId, orgId)` now builds
its own service client and throws if the key is absent. A parameter that is only
ever correct with one argument is a footgun. Callers still own the decision.

This is also the honest lesson of Amendment 5's own audit: the sweep that
concluded "every `chat_rooms` consumer is already membership-scoped" was
truncated (`head -30`) and missed `offboard.ts`. Re-run exhaustively, there was
exactly one offender, and it was the one that mattered.

### The mechanism, closed repo-wide

A live sweep after both fixes found 3 policies still relying on the FOR ALL
write-check inheritance, out of 357: `ai_proposal_drafts`, `ai_risk_reports`,
`ai_schedule_suggestions`, all `org_members_all` USING `is_org_member(org_id)`.
None is a vulnerability — for org-scoped data with no per-user distinction the
inherited check is the one you would write. `20260715153252_explicit_write_checks.sql`
sets `with check` to that identical expression anyway: a no-op, spent so the
invariant can be absolute rather than carrying three exceptions.

    select count(*) from pg_policies
     where schemaname='public' and cmd='ALL'
       and with_check is null and qual is not null;   -- now 0, was 5

Worth re-running after any RLS migration. `chat-membership-boundary.test.ts`
guards the static half over the tables involved.

### Consequences

- Amendment 1's "audited and already user-scoped" verdict covered four surfaces.
  Two of them (chat, time-off) were hiding live escalations, one (docs) was
  genuinely fine, and one (schedule) is an open product question. **"The app
  filters it" was never evidence about the database**, and this ADR asserted it
  four times.
- ~~The remaining known gap is `shifts` / `workforce_members` org-wide read on the
  vendor portal. Deliberate, documented, unresolved.~~ **`shifts` closed in part 3**
  below, once the concurrent `controller` finding supplied the fact that made
  narrowing safe rather than an outage. `workforce_members` stands.
- `chat_messages` gating on room membership with no org check is now load-bearing
  in a way it was not designed to be: it is why offboarding must clear room
  memberships. An `is_org_member(org_id)` conjunct on the SELECT policy would make
  the offboard cascade a defence-in-depth measure rather than the only lock.
  ~~Deferred, and worth its own look.~~ **Done in part 3 below.**

## Amendment 5, part 3 (2026-07-15) — the last two flags

`20260715210000_amendment5_remaining_flags.sql`. Both flags part 2 deferred are
closed. One of them was only safe to close because a _concurrent_ session found
the fact I was missing.

### Chat reads are pinned to live org membership

Part 2 left `chat_messages` gating on room membership alone, with no org check.
That made the offboard cascade the **only** thing revoking a departed user's
chat: soft-delete their `memberships` row and the `chat_room_members` rows they
still held _were_ read access. Fixing the cascade (part 2) made it correct; it
did not stop it being the single point of failure. A teardown that has never yet
been skipped is not a boundary — it is a to-do list.

The pin lives inside `private.is_room_member`, not in each policy, because that
helper is the one predicate every chat policy already routes through
(`chat_rooms`, `chat_messages`, `chat_room_members`, `chat_message_reactions`).
One edit; every chat read inherits it, including reads a future table adds.
`is_room_admin` / `is_room_creator` got the same treatment so an offboarded
room-admin cannot keep managing a roster in an org they have left, and
`chat_rooms_select`'s `created_by` disjunct is pinned explicitly since it does not
route through the helper.

Verified by simulation: soft-delete a live member's `memberships` row while
leaving their `chat_room_members` row in place → room visible 1 → **0**, messages
1 → **0**, all chat → **0**. Membership restored, and every ordinary chat flow
(create room + `RETURNING`, creator bootstrap, post, read back, list) still works.

### shifts: the leak was real, and the obvious fix was an outage

Part 2 called this a product decision and deferred it. It was half right. The leak
was real and measured — **every persona, including `crew`, could read all 16
shifts** via PostgREST; ScheduleSurface is mounted at `/p/[slug]/vendor/schedule`,
and its `.eq("workforce_member_id", …)` app filter was the only thing narrowing
it. Same shape as everything else in this ADR: the app filters, the database
does not.

What part 2 got wrong was calling it _only_ a product question. It was also a
question I could not safely answer yet, and the missing fact arrived from another
session's `controller` finding (956b29c4): `shifts_select_consolidated`'s staff
band is `['owner','admin','controller','collaborator']`, where **`controller` is
neither a role nor a persona and can never match**, and **`manager` is absent**.
The policy's three disjuncts also collapse — `is_org_member` subsumes both others
— so it is exactly `is_org_member(org_id)` wearing three clauses.

Which means the obvious fix, "drop the `is_org_member` disjunct so the narrow ones
matter", would have left the band as `{owner, admin, collaborator}` and **cut every
manager off from every shift**. A real outage, shipped as a security fix, and the
reasoning would have looked impeccable in review. Deferring on a vague product
worry turned out to be right for a reason I had not identified.

The new policy is staff (`owner|admin|manager` roles + `collaborator` persona —
`manager` is new, and the dead string is not carried forward) **or** the person the
shift belongs to, by **either** linkage: `shifts` currently has both
`workforce_member_id` and `crew_member_id`, NULL on all 16 rows, because a
concurrent session is mid-merge. Keying on one would break when that lands or is
reverted.

Verified: owner/admin/**manager** still see 16; `crew` 16 → **0**. Nothing
observable changes for crew or vendor today — no shift has a person, so their app
queries already returned zero — but the enumeration closes, and the policy is
correct for the day the merge assigns people.

Incidentally this closes a second hole: `POST /api/v1/shifts/checkin` gates on the
`time:write` capability but **never checks the shift is the caller's**, so any org
member could punch any shift. The read now refuses first. That is a side effect,
not a substitute for the ownership check the route still ought to make.

### What stands, deliberately

`workforce_members` keeps its org-wide read. It is the store being retired by that
merge; all 105 rows are e2e debris with **no login** (so `user_id = auth.uid()`
matches nothing — self-scoping it would break the volunteer surfaces rather than
protect anything) and they live in orgs disjoint from every shift. Narrowing a
table mid-retirement is churn against a moving target. It stays flagged.

### Consequences

- Every flag this ADR opened is now closed or explicitly standing with a reason.
  The count for the record: Amendment 1 audited four shared surfaces and cleared
  them; **three of the four were hiding live escalations** (chat self-join,
  time-off self-approval, shifts enumeration) and one (`personal_documents`) was
  genuinely fine.
- The pattern behind all three is one sentence: **"the app filters it" was never
  evidence about the database.** Every instance was found by asking the same
  question — what does a normal login see through PostgREST? — and none needed
  anything more exotic than that.
- The `controller` string is why a security fix should not be written from a
  policy's apparent intent. `shifts_select_consolidated` _read_ as "staff, or org
  members, or the owner". It _meant_ "any org member", and its staff band did not
  include managers. Read what a predicate does, not what its argument list
  suggests.

## Amendment 6 (2026-07-15) — the open questions, closed

### 1. Miller's band is now enforced, not intended

Question 1 asked whether to split the 14-item vendor rail; the recommendation was
"split", and vendor duly got `Vendor / Engagement` + `Vendor / Operations`. Crew
did not. It was left at 11 items behind a code comment promising a "future cut",
and drifted to 12 as the backfill landed — so the acceptance check "persona rails
respect Miller's band per section (max 10 items)" was **failing in production for
weeks** while its checkbox sat unticked in this document.

Nothing caught it because nothing counted. Both personas are split now via a
single data-driven `SPLITS` map in `nav.ts` (the vendor branch was bespoke), on
one consistent cut:

- **`<Title> / Engagement`** — the paperwork you have _with_ the org: terms,
  money, compliance, training.
- **`<Title> / Operations`** — the day-to-day of doing the work: where to be, who
  with, what changed.

`src/lib/portal-rail-canon.test.ts` counts every section of every persona rail,
so the next persona to outgrow the band fails CI. It also guards the split
mechanics: `pick()` drops unresolved slugs silently, so a renamed route would
otherwise vanish from the rail without a word.

Note the ceiling is **per section, not per rail** — a 13-item rail in two
labelled halves is fine; a 12-item undivided one is not. The point is what a
reader scans at once.

### 2. Volunteer + media stay deferred, but the reason has changed

Question 2 deferred the volunteer + media backfill on the grounds that "the
crew/vendor wins prove the pattern first." **That precondition is now met** —
Amendment 4 finished the pattern, and the surfaces are shared, typed, and
guarded, so the work is now small and mechanical:

- `volunteer` (5 items today: Application · Training · Schedule · Uniform · Privacy) → add Feed + Learning.
- `media` (6 items today: Services · Accommodation · Transport · Press Conferences · Info-On-Demand · Privacy) → add Feed + Directory.

Both land well inside Miller's band, so neither needs a split. It is deferred
only because it is net-new persona surface area rather than remediation of a
defect, and this amendment's job was to close flags. Tracked separately; the
`FeedSurface`/`DirectorySurface` portal arms already require `projectId`, so
whoever builds it cannot repeat Amendment 1's mistake.

## Amendment 7 (2026-07-15) — the same question, asked of the whole app

`20260715230000_identity_boundary_sweep.sql`. Amendment 5 asked one question of
four surfaces and found three live escalations. This amendment asks it of
everything: **does RLS agree, if you skip the app and call PostgREST directly?**

### Method, and the thing that makes it tractable

An app-level identity filter is a claim. Enumerating them mechanically gives the
candidate list: 253 server-side reads narrow by identity in application code
(`.eq("user_id", session.userId)` and 18 sibling columns — `submitted_by`,
`requester_id`, `assigned_to`, `party_user_id`, `reviewer_user_id`, …) across
**65 tables**. Each was mapped to its backing table, checked against the live
policy, and — where the policy looked permissive — **proven over PostgREST** as
`crew@gvteway.test` (`member` role / `crew` persona). Nothing below is inferred
from a predicate.

The triage that matters, and the reason this is not "ban `is_org_member`":

> An app-level identity filter is sometimes a **view** and sometimes a
> **boundary**.

`tasks`, `invoices`, `requisitions`, `crew_members` are org-readable on purpose —
an operator console is the point, and `.eq("assigned_to", me)` there means "my
work", not "only I may see this". Narrowing them would be an outage dressed as a
fix. **21 tables** had no self-scoped read policy at all; most are that shape and
were deliberately left alone. Four were different — each carried a privacy or
authority claim the database was not holding.

`mfa_recovery_codes` is worth naming as the false positive that proves the
method: it has no `auth.uid()` in its policy, so a mechanical scan flags it. Its
predicate is `USING false`. Reading the predicate is not optional.

### 1. time_entries — payroll was writable by anyone, for anyone

The sharpest, and the exact Amendment 5 shape one layer down. Proven as crew:

- **UPDATE another user's entry**, setting `rate_cents = 123456` — read back,
  confirmed landed. (`duration_minutes` bounced back: a trigger recomputes it
  from the timestamps. A real defence — it just does not cover the pay rate.)
- **INSERT an 8-hour entry attributed to another user** at rate 99999 —
  fabricated payroll for a third party.
- **SELECT** another user's entry (`rate_cents`, punch GPS, `pulse_note`).

`time_entries_update` granted `['owner','admin','manager','controller',
'collaborator','crew']` with **no `user_id` pin at all**. The band is why it
worked: `private.has_org_role` matches `role::text = any(required) OR persona =
any(required)`, so the **`crew` persona** matched on a plain `member` role.
`/p/[slug]/crew/time` is portal-mounted, so this was reachable by portal
personas — the Amendment 5 audience.

The fix was not invented. `mileage_logs` and `expenses` — the two sibling tables
of the same shape — **already carry the correct predicate**
(`has_org_role(staff) OR (is_org_member AND <self> = auth.uid())`).
`time_entries` was the outlier; it now matches its own neighbours. `controller`
is dropped (dead text), `collaborator` is **kept** (removing a band on a guess is
how a security fix becomes an outage), and `crew` moves from the staff band to
the self clause — which is the entire hole. Every persona that punches its own
time still matches the self clause, so the band question is moot for own-row
writes.

SELECT narrows to staff-or-self on the `shifts` precedent, and more safely:
every `time_entries` row **has** a `user_id`, where all 16 shifts had NULL. One
honest consequence, stated rather than discovered later: the `/studio` home strip
counts open entries org-wide, so a non-staff persona on the operator Home now
sees only their own count. Cosmetic, and limited to a persona that is not that
tile's audience.

### 2. reviews — any member could rewrite or delete reputation

Every `reviews` policy led with `is_org_member(org_id)`, which **subsumes** the
narrow `reviewer_user_id = auth.uid()` disjunct beside it — the same
collapsing-disjuncts shape as `shifts_select_consolidated`. Proven as crew:
rewrote another person's review **4 stars to 1**, body replaced (restored), and
read an **unreleased** review as a third party who was neither its reviewer nor
its subject. DELETE was equally open: remove the bad review about yourself.
`tg_reviews_aggregate` rolls `rating_avg` onto the subject, so this is public
reputation, not private notes.

The blind is a documented invariant, and **the app already enforces it** —
`/me/reviews` reads received reviews with `.not("released_at","is",null)`. The
database now says the same thing. Moderation moves from "any member" to the staff
band: being in the org is not authority to moderate, exactly as being in the org
was not authority to decide leave.

**The fact that made this safe:** both `tg_reviews_release_pair` and
`tg_reviews_aggregate` are SECURITY DEFINER. The release trigger UPDATEs the
_counterpart_ row, whose reviewer is someone else — under a narrowed UPDATE
policy that write would have been refused had the trigger run as the invoker, and
mutual release would have silently stopped working. Checked before writing the
migration, then verified after: crew files the counterpart, and both rows flip to
released. A non-DEFINER trigger here would have made the obvious fix an outage —
the `controller` lesson in a different costume.

### 3. redeem_voucher — SECURITY DEFINER that checked nothing

The `approve_time_off_request` shape, found by auditing the 66 SECURITY DEFINER
functions (37 executable by `authenticated`). `redeem_voucher(p_org_id,
p_user_id, p_code)` verified neither that `auth.uid() = p_user_id` nor that the
caller belonged to `p_org_id`. The app passes `session.userId`; a PostgREST
caller passes whatever it likes. Proven: as crew, redeemed a voucher **crediting
a different user's ledger** and burning its only redemption. The code is the
credential (gift-card model) — but who it credits is not the caller's choice.

`verify_certification` is the counter-example that kept this honest: it _sounds_
like a mutation and has no role check, but its body is a read keyed on an
unguessable UUID — a capability-URL verification lookup, working as designed. Read
the body, not the name.

### 4. badge_awards / achievement_awards — self-grant

`badge_awards_org_rw` was FOR ALL `is_org_member` both ways. Proven: awarded
myself a badge as a plain member. Low severity — recognition, not money — but the
entire meaning of an award is that **someone else gave it to you**. Awarding is
now the staff band; reads stay org-wide, because the wall is meant to be seen.
That is a view, not a boundary.

### The trap, one more time

Every refusal in this amendment's verification returned **HTTP 204**. Narrowing
`time_entries`, then re-running the write vector: `http=204`, clean success — and
`rate_cents` still `null` on read-back. Same for the review tamper and the review
delete. An RLS write matching zero rows is not an error, so a probe that reads the
error object reports the fix didn't work — or, worse in the other direction,
reports a hole that isn't there. **A security check that reads an error object is
not a check.** Both directions of every vector here assert on observed state.

### Verified

Both directions, after applying:

| vector (as `member`/`crew`)                 | before      | after                                 |
| ------------------------------------------- | ----------- | ------------------------------------- |
| read others' time entries                   | 1           | **0**                                 |
| write another's `rate_cents`                | landed      | refused (204, unchanged on read-back) |
| forge entry as another user                 | inserted    | refused                               |
| **file own** time entry                     | ok          | **ok**                                |
| read unreleased review                      | visible     | **0**                                 |
| rewrite another's review                    | 4→1 landed  | refused (204, still 4)                |
| delete a review                             | —           | refused (204, row still there)        |
| forge review authorship                     | —           | refused                               |
| **mutual release** (crew files counterpart) | ok          | **both rows released**                |
| voucher: credit another user                | `{ok:true}` | `{ok:false, forbidden}`               |
| **voucher: credit self**                    | ok          | **ok**                                |
| self-grant a badge                          | landed      | refused                               |
| **manager awards a badge**                  | ok          | **ok**                                |
| read the badge wall                         | 5           | **5**                                 |

And the band that Amendment 5 part 3 warned about: owner / admin / **manager**
all still read `time_entries`; only non-staff narrowed. The `is_org_member`
disjunct was not blindly removed anywhere.

Live invariant re-run after the migration:
`cmd='ALL' and with_check is null and qual is not null` = **0** (of 357).

### Consequences

- Amendment 5's sentence generalises: **"the app filters it" was never evidence
  about the database** — seven confirmed escalations now, across three
  amendments, and every one found by asking a normal login what it can see.
- The rule needs its companion, or it becomes the cargo cult Amendment 5 warned
  about in the other direction: **an app-level identity filter is a boundary only
  when the data carries a privacy or authority claim.** `tasks` and `invoices`
  are org-readable on purpose. Ask what the filter is _for_ before narrowing it.
- `src/lib/identity-boundary-canon.test.ts` (11 invariants) pins all four fixes
  using the established replay-the-migrations idiom, including the
  SECURITY-DEFINER-trigger precondition that makes the reviews narrowing safe.
- **Standing, deliberately:** ~50 UPDATE policies declare USING with no WITH
  CHECK. This is NOT the FOR ALL trap and was not treated as one: for UPDATE the
  inherited check means the row must still satisfy USING afterwards, which is a
  sane default that prevents moving a row out of your own scope. Named here so
  the next sweep does not re-derive it, or "fix" it into churn.
- **Standing, flagged:** `workforce_members` keeps its org-wide read (unchanged
  from part 3 — still mid-retirement). `api_keys` is org-readable, exposing
  `prefix`/`scopes`/`hashed_secret`; the secret is a hash, so it is a disclosure
  worth noting rather than a key leak. `expenses`/`mileage_logs`/`crew_members`
  are org-readable with correct self-pinned writes; whether an external `vendor`
  persona should read the org's expense log is the same product question
  `shifts` was, and is not one to answer inside a security migration.

## Amendment 7, part 2 (2026-07-15) — the same root cause, opposite sign

`20260715234500_for_all_admin_read_lockout.sql`. Handed over from the concurrent
approvals-RLS session, which found the class and filed it; the three live cases
below were re-confirmed here rather than inherited.

Every other finding in this ADR is a leak. This one is the mirror image: **the
database refuses a read the app fully expects, and nothing errors.** Same
sentence underneath — the app and the DB disagree — so it belongs in the same
amendment.

A policy written `FOR ALL USING private.is_org_admin(org_id)` (no cmd ⇒ ALL)
gates SELECT as well as writes. `private.is_org_admin` is
`role in ('owner','admin')` — no persona branch and, decisively, **no
`manager`**. The 2026-06-25 `rls_manager_grant_sweep` only rewrote
INSERT/UPDATE/ALL _bands_, so it never looked at these; and the whole thing is
masked for owner/admin personas, which is why it survived. Confirmed live:

|                               | owner | admin | manager | crew |
| ----------------------------- | ----- | ----- | ------- | ---- |
| `pipeline_definitions`        | 5     | 5     | **0**   | 0    |
| `pipeline_stages`             | 30    | 30    | **0**   | 0    |
| `asset_depreciation_schedule` | 12    | —     | **0**   | 0    |

A manager opening `/studio/pipeline` got the page's own **"No Pipelines"** empty
state. Not an error — the same screen an org with no pipelines would see. That is
what makes this class survive: it looks like data, not like a bug.

### Intent first, because "the DB is wrong" is only half the answer

The other half is "the app is missing a gate", and picking wrong ships the
opposite defect. The evidence says the surface is for any operator:
`/studio/pipeline` gates on `requireSession()` only; `nav.ts` lists it under
Sales as **Deals** with no role gate, so a manager sees the link;
`asset_depreciation_schedule` is read at `studio/assets/[id]/page.tsx:89`, whose
page uses `isManagerPlus` **only to decide whether to render the write
affordance** — which is affirmative evidence that managers are meant to see the
panel. Nav and gate agree; the DB is the outlier, so the DB changed.

### The band is staff, and deliberately NOT `is_org_member`

The handoff proposed `FOR SELECT USING is_org_member(org_id)`, mirroring the
`approval_policies` fix in `20260714120000`. Declined, for the reason this ADR
has spent seven amendments on: **portal personas are ordinary `memberships`
rows**, so `is_org_member` includes `client`, `contractor`, `guest`, `viewer` and
`community` — and the `(platform)` shell has no role gate of its own. That fix
would hand external contractors and guests the org's CRM deal pipeline and its
asset depreciation schedules. The exposure this document exists to close,
re-opened as a remediation.

The proven defect is narrow — the manager band is locked out of an operator
console — so the fix is narrow: the same staff band established for
`time_entries` SELECT (`owner|admin|manager` roles + `collaborator` persona).
Nobody who was not demonstrably locked out gains a row. Permissive policies OR,
so the additive `FOR SELECT` widens reads while the untouched `FOR ALL` keeps
every write admin-only.

Verified: manager **0 → 5/30** pipelines and **0 → 12** depreciation rows; crew
stays at **0** (the band did its job — `is_org_member` would have given them the
board); manager INSERT refused, manager UPDATE refused (HTTP 204, name unchanged
on read-back — the trap, one more time).

### Triage, and what was left alone

13 policies match `cmd='ALL' AND qual LIKE '%is_org_admin%'` with no sibling
SELECT. Only three are defects. The rest divide cleanly:

- **Legitimately admin-only** (`integration_credentials`,
  `integration_webhook_endpoints`, `audit_redaction_log`,
  `sync_conflict_log`, `notification_suppression_list`) — secrets and audit
  trails; the lockout is the feature.
- **Already carry a self OR-branch** (`uas_del_self`, `uwz_inst_self`,
  `ulc_tz_self`) — fine.
- **No app reader at all** (`policy_rules`, `overtime_rules`) — nothing is
  silently empty, because nothing reads them. Not a defect until something does.

The rule the count illustrates: a raw structural query is a _candidate list_, not
a finding list. 13 hits, 3 defects — the difference is entirely "does a real app
surface read this, and who is meant to open it".

### Consequences

- The sweep question has two directions, and only one had been asked. "Does RLS
  agree?" catches leaks; **"does RLS agree the other way?"** catches silent
  empties. The second is harder to notice precisely because it degrades into an
  empty state instead of an error, and empty states are designed to look calm.
- `is_org_admin` (role-only, owner/admin) and `has_org_role` (role **or**
  persona) are not interchangeable, and the difference is invisible at the call
  site. Every `is_org_admin` policy silently excludes `manager`.
- Guarded by three more invariants in `identity-boundary-canon.test.ts`,
  including the one that matters most: the read policy must **not** widen to
  `is_org_member`.

## Amendment 7, part 3 (2026-07-15) — the table the sweep could not see

`20260716000500_announcements_publish_authority.sql`. Handed over by the
volunteer/media backfill session (ADR Q2), which probed `announcements` and
`project_members` and found this while widening the _audience_ of surfaces that
sit on the same table. Re-confirmed here rather than inherited.

### Why part 1's method was structurally blind to it

Part 1 enumerated tables where **the app asserts an identity boundary** — 253
`.eq("user_id", session.userId)`-class filters across 65 tables — and asked
whether RLS agreed. `announcements` was never a candidate, and correctly so: the
app does not narrow it by identity, because org-wide reads are the documented
design (Amendment 1).

That is the blind spot, stated plainly: **the sweep looked for broken promises,
and this table never made one.** A table whose reads are deliberately wide, but
whose _writes_ carry authority, cannot be found by asking "is the app's filter
real?" — there is no filter to check. It has to be found by asking a different
question: _who is allowed to write this, and does the DB know?_

The live invariant missed it too, and that half generalises further:

```
select count(*) from pg_policies
 where cmd='ALL' and with_check is null and qual is not null;   -- 0, and still 0
```

`announcements_org_rw` was FOR ALL with a WITH CHECK **present** — just
`is_org_member(org_id)`, identical to its USING. Same outcome as the chat
self-join, different mechanism: not an inherited write check, but a write check
that is **no stricter than the read check**. A `with_check IS NULL` audit cannot
see that, and this ADR has now been caught twice by trusting one structural
query. The predicate that actually matters:

> **Is the write check stronger than the read check, on a table where writing is
> an authority act?**

### The defect

Confirmed live as `crew@gvteway.test` (`member` role / `crew` persona), and
independently by the backfill session against a `vendor`-persona contractor in a
different org:

- **INSERT** `publish_state='published'`, `project_id=NULL` — an org-wide
  broadcast to the entire company, authored by a member-band account.
- **DELETE** an announcement they did not author — a **hard** delete. Row gone.

Every app writer disagrees, in literal user-facing copy:

```
new/actions.ts        if (!isManagerPlus(session)) return { error: "Only manager+ can publish announcements" }
[id]/edit/actions.ts  if (!isManagerPlus(session)) return { error: "Only manager+ can edit announcements" }
[id]/actions.ts       if (!isManagerPlus(session)) return;   // delete + archive
```

This is the time-off shape exactly, down to the reasoning: `decideTimeOffRequest`
carried the comment _"Re-checked here rather than trusted from the caller so
neither shell can skip the gate by hiding a button."_ True of both shells. **A
PostgREST call is not a shell, and a string in a server action is not a
boundary.** `/m/feed` and `/p/[slug]/announcements` only ever READ; no shell has
offered these personas a compose box. The database did.

Blast radius is every org member, so it predates the volunteer/media backfill
entirely — the shipped crew and vendor feeds sit on the same table. That session
widened the _audience of a surface_; the write hole was already under it.

### The fix, and the one deliberate asymmetry

Reads are **unchanged** — org-wide `is_org_member` is the documented model and
narrowing it would break the very feeds this table exists to serve. Only writes
move, to the band the app already claims: INSERT/UPDATE = `owner|admin|manager`
(matching `isManagerPlus` exactly).

DELETE is the **admin** band — narrower than the app's own gate — because
`deleteAnnouncement` is a _soft_ delete (`update … set deleted_at`). **No app
path hard-deletes an announcement, ever.** The hard DELETE is a capability the
product does not use, kept as a latent admin capability rather than dropped, the
same disposition `chat_rooms` DELETE got in Amendment 5 part 2 and for the same
reason: destroying a company-wide communication and its read receipts should not
be reachable from a surface that only ever meant to hide it.

Verified both directions: crew broadcast **refused**; crew hard-delete
**refused** (HTTP 204, row survives on read-back); crew edit **refused** (204,
title unchanged); crew and manager both still read the feed (6 rows); **a manager
can still publish**.

### A probe destroyed a row, and that is part of the finding

Demonstrating the DELETE vector hard-deleted a real seed row in the demo org —
`"EDC LV — Inbox Roundtrip Test"` — and it is **not recoverable**: no audit trail
covers `announcements`, no orphaned `announcement_reads` survived it, and no repo
seed or fixture defines it (its sibling `"EDC LV — Inbox Roundtrip v3"` remains,
which suggests it was ad-hoc test debris, but that is an inference, not a fact).
It was not reconstructed, because inventing an author and body would put fabricated
data in the database wearing the costume of real data.

The backfill session's method was better and is the standard going forward: it
**seeded its own rows** for both directions and restored exact pre-seed baselines
(announcements 8, project_members 16, projects 118). Read-only vectors can be
proven against existing data; **destructive vectors must be proven against rows
the probe created.** The irony is not lost — the row died to a capability that
this migration establishes nothing in the product ever needed.

### Also confirmed, and NOT a defect

The backfill session re-probed the reads behind `FeedSurface`/`DirectorySurface`:
3 of 3 announcements readable including an org-wide internal one, and the roster
of a project the user is not on. **This is Amendment 1 working as designed**, not
a false clearance — Amendment 1 said explicitly that `memberships`/`announcements`
have no per-row grant for RLS to key on, so the app is the only place the boundary
can exist, which is why `projectId` went into the props.

Worth stating once, plainly, since it is easy to misread: the project-scoped
roster is a **UI property, not a security property**. `projectId` compiling is not
evidence of scoping. That is the precondition Amendment 5 attached to the rule,
and it still holds.
