# ADR-0008 — GVTEWAY portal: crew + vendor persona depth backfill

**Status:** Accepted, amended 2026-07-15 (see §Amendments — 4 of them, all implemented). Superseded in part: Kudos is out. **The COMPVSS-handoff question is closed (Amendment 4).** §Open questions 1 (vendor rail size) and 2 (volunteer/media timing) are untouched by the amendments and remain open; question 3 was answered "no" by Amendment 2.
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

## Amendment 5 (2026-07-15) — chat is not project-scoped, on purpose

Resolves the `ChatSurface` item flagged in Amendment 4 §Consequences. **Chat stays
unscoped by project. Membership is the boundary** — and this amendment makes that
true in the database, where it was not.

This is the third pass over the same surface, and the ADR has been arguing with
itself. Amendment 1 audited `ChatSurface` and concluded "already user-scoped
(… room membership). **No change**." Amendment 4 then called it "the last unscoped
shared surface" and flagged it as a probable Amendment 1 omission. Amendment 1 was
right. Writing down *why* is the point of this amendment.

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
`memberships` lacks. So the boundary *can* live in RLS, which means it *should*: a
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
requirement for adding *other* people silently became "any member may add anyone", and
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
  covers every legitimate insert path in the app, including the two that add *other*
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
  surface whose boundary is enforced a layer *below* the props, which is better.
  Amendment 4 §Consequences is superseded on this point.
- The Amendment 1 rule is now stated with its precondition: **put scope in the props
  only when there is no per-row grant for RLS to key on.** Directory and Feed qualify;
  chat does not. Applied without that precondition the rule is cargo cult, and here it
  would have shipped a `projectId` prop over a live read-any-DM hole.
- The four surfaces Amendment 1 waved through as "already user-scoped" were audited for
  *scope* but not for *whether the DB agreed*. `ScheduleSurface`, `TimeOffSurface` and
  `DocsSurface` all rest on `.eq("user_id", session.userId)`. That is an app-level
  filter with the same question underneath it — does RLS hold the line if someone skips
  the app? Not audited here; worth its own pass.
