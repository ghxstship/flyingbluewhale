# ADR-0008 — GVTEWAY portal: crew + vendor persona depth backfill

**Status:** Accepted, amended 2026-07-15 (see §Amendments — 6 of them, all implemented). Superseded in part: Kudos is out. **All three §Open questions are closed and every acceptance check is verified and guarded.** The one deliberate carve-out is the shift punch, which stays in COMPVSS by rule, not by omission (Amendment 4).
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

Meanwhile `decideTimeOffRequest` carries the comment *"Re-checked here rather than
trusted from the caller so neither shell can skip the gate by hiding a button."*
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
closed. One of them was only safe to close because a *concurrent* session found
the fact I was missing.

### Chat reads are pinned to live org membership

Part 2 left `chat_messages` gating on room membership alone, with no org check.
That made the offboard cascade the **only** thing revoking a departed user's
chat: soft-delete their `memberships` row and the `chat_room_members` rows they
still held *were* read access. Fixing the cascade (part 2) made it correct; it
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

What part 2 got wrong was calling it *only* a product question. It was also a
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
  policy's apparent intent. `shifts_select_consolidated` *read* as "staff, or org
  members, or the owner". It *meant* "any org member", and its staff band did not
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
