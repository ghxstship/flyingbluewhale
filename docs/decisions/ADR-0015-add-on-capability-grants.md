# ADR-0015 — Add-on capability grants (per-feature RBAC, by role, by person, for a window)

**Date**: 2026-07-15 · **Status**: Accepted, partially implemented
**Supersedes**: nothing. **Related**: `docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md` (the first consumer) · **What's left**: `docs/compvss/SCANNING_RBAC_BACKLOG.md`

## Context

Capabilities were entirely static code: `CAPABILITIES` (by `PlatformRole`) and
`CAPABILITIES_BY_PERSONA` in `src/lib/auth.ts`. That can answer *"what does a
manager get"*. It cannot answer:

> May Bob, who works logistics, scan assets tonight because he is covering
> Dana's warehouse shift?

Three reasons it can't, and each one independently rules the static map out:

1. **Roles are tenant data, not code.** "Logistics" and "warehouse" are an org's
   job functions. They differ per tenant and change without a deploy.
2. **`check-in:*` is far too coarse.** `member` (`auth.ts:373`) and the `crew`
   persona (`auth.ts:403`) hold it, so **every crew member could scan
   everything — credentials at a gate included.** Not every role should verify
   passes.
3. **No time dimension.** Cover shifts are inherently temporary.

## Decision

**One general grant layer keyed by capability string, additive over the static
floor.** Scanning is its first consumer, not its owner — the next add-on feature
reuses this rather than growing a second RBAC system.

### Two sources, unioned

| Source | Where | Answers |
|---|---|---|
| **Base** | static maps, `auth.ts`. Code. | the floor |
| **Grants** | `role_capability_grants` + `user_capability_grants`. Data. | the add-ons |

`can()` returns `base ∪ grants`. `matchCapability` already understands
`domain:*`, so `scan:*` and owner/admin's `*` work with no new code.

### Additive only — no denies

Deliberate. A deny-list forces a precedence rule ("does an individual deny beat
a role grant?") and is how RBAC becomes unauditable. *"Not every role should
scan credentials"* is expressed by **not granting** `scan:credential`. If a deny
ever seems necessary, the base is too wide — narrow the base.

### The four grant paths

- **Role** — `role_capability_grants(org_id, crew_role_id, capability, shift_derivable)`.
- **Individual** — `user_capability_grants(..., valid_from, valid_until, granted_by, reason, revoked_at)`.
- **Temporary** — the same table. `valid_from`/`valid_until` **is** the cover-shift answer.
- **Shift-derived** — deferred; see Consequences.

### Resolution: per request, never in the JWT

`public.effective_capabilities(p_org_id)` returns the union in one round trip and
is unioned onto the base at session build. `getSession` is already `cache()`d
(`auth.ts:203`), so it costs **one indexed query per request**, not per call.

**Not a JWT claim, on purpose**: a claim goes stale, so a time-boxed grant would
not expire and a revoke would not bite until the token refreshed — which defeats
the entire feature. Freshness is the product here.

The function **takes no `user_id`**: it reads `auth.uid()` internally. That is
what makes `SECURITY DEFINER` safe — it must read `crew_members` and the grant
tables regardless of the caller's row visibility, but it can never answer for
anyone else, so it is not an enumeration primitive.

Time windows are evaluated against server `now()`. A client clock never decides
whether a grant is live.

### `crew_roles` — a catalog, because the free text had already drifted

Role grants **cannot** key on `crew_members.role`. Live data mixes slugs
(`production-manager`, `credentials-travel-logistics`) with prose (`A1 /
Programmer`, `Stage Manager`, `Stage Manager — cosmicMEADOW`). The last two are
the same job and different strings; grants keyed on that are broken on day one.

`slugify_role()` normalizes case/punctuation only — **never fuzzy**. It will not
merge `Stage Manager` with `Stage Manager — cosmicMEADOW`, because deciding they
are one role is a judgement about an org's operations, and **silently merging two
roles silently merges their permissions**. Operators merge them explicitly.

### Rollout: grandfathered

`orgs.capability_grants_enforced` defaults **FALSE**. While false, the legacy
`check-in:*` blanket is synthesized as `scan:*` grants and **nothing in the field
changes**. An org flips it to true *after* configuring grants. Flipping first
locks the field out — which is why the default is off and the flip is per-org.

### Enforcement shape

`mode` **is** the capability: `access`→`scan:credential`, `asset`→`scan:asset`,
`pos`→`scan:product`. `any` (Quick Scan) is deliberately **not** a capability —
it requires *at least one* scan capability, and the resolver **narrows the chain
to what the caller holds**, so an asset-only user never has a credential resolved
for them. A single `scan:any` would either over-grant or lock those users out.

## Consequences

**Good**: per-feature, per-role, per-person and time-boxed, all four. One layer,
reusable. No deploy to change an org's permissions. Grants are an audit trail
(`granted_by`, `reason`, soft `revoked_at` — never deleted). Nothing breaks on
deploy day.

**Costs and open risks**, stated plainly:

- **One extra query per request.** Indexed and request-cached; measure before
  optimizing. Do not "fix" it with a JWT claim (see above).
- **The scheduler becomes an authorization surface** *if/when* shift-derived
  grants ship: whoever can roster Bob onto a warehouse shift can hand him that
  role's capabilities. That is the intended ergonomics for gear and stock, and
  unacceptable for gate access — hence `shift_derivable` per (role, capability),
  and `scan:credential` excluded from `SHIFT_DERIVABLE_BY_DEFAULT`.
- **Shift-derived grants are NOT built.** See the addendum below — the reason
  is structural, not a backfill. Until then a cover shift uses a time-boxed
  `user_capability_grant`, which does the same job with an explicit,
  attributable actor. `shift_derivable` is recorded so the intent survives.
- **No admin UI yet.** Grants are manageable via SQL/API only. That is the next
  increment and the thing that makes this usable by an operator.
- **`enforced` is a footgun if flipped early.** It should be flipped from an
  admin surface that first shows who would lose access.

## Alternatives rejected

- **Extend the static maps** — roles are tenant data; impossible.
- **Deny-lists** — precedence puzzle, unauditable.
- **JWT claims** — stale; kills time-boxing and revocation.
- **A scan-specific permission table** — guarantees a second RBAC system for the
  next add-on feature.
- **Key role grants on `crew_members.role`** — the free text has already drifted.


---

## Addendum (same day) — why the rostering scaffold is empty, and what was resolved

The empty scaffold was **not** a seeding gap. Investigating it surfaced three
findings, one of which was a live defect.

### 1. `crew_members` is the person SSOT. Settled, not chosen.

| | referenced by | data |
|---|---|---|
| `crew_members` | **8 tables** — assignments, credentials, crew_certifications, crew_ratings, independent_contractor_msas, offer_letters, org_offer_letter_settings, safety_briefing_attendees | real people |
| `workforce_members` | **1 table** — `shifts` | **100% e2e debris** ("E2E Staff 1780772567208", "E2E Volunteer 1780772572792") |

They are not even the same population: **zero** `workforce_members` emails match
a `crew_members` row, and **zero** match an `auth.users`. `workforce_members`
also lives only in `test-portal`/`test-professional`, while all 16 `shifts` live
in `demo` — **disjoint orgs, so that FK could never have been satisfied.**

`workforce_members` is not a duplicate to merge blindly: it carries `kind`
(paid_staff / volunteer / contractor / official), `skills`, `venue_id`, and the
volunteer surfaces read it. But its identity story is broken and it is an FK
island.

### 2. The live defect: operator-created crew never linked to a login. **FIXED.**

Two creation paths:
- `/me/crew` — self-service, sets `user_id`. **This was the 1 of 42.**
- `/studio/people/crew` — an operator types name/email/role. **`user_id` never set.**

Nothing ever connected the record an operator typed to the login that person
later made. So `crew_members.user_id` was dead, which meant **role-derived
grants could never reach anybody** — ADR-0015's role half was inert.

**Resolved** in `accept_invite` (migration `20260715144621`): the RPC now claims
any unclaimed crew row matching the invite email, in the same transaction as the
membership upsert.

That seam and no other, because it is the only place the email is **both
operator-asserted and auth-verified** — the RPC already raises
`invite_email_mismatch` otherwise. Linking on *any* signup with a matching email
would let an operator's typo hand that crew record — and its assignments,
credentials and offer letters — to whoever registered the address.

Guards, verified against live rows: org-scoped; `user_id is null` so a claimed
record is never stolen (a second user accepting for a claimed email provably
does **not** take it); and `crew_members_org_email_idx` is
`UNIQUE (org_id, lower(email))`, so at most one row can match — unambiguous by
construction.

### 3. Nothing creates shifts or workforce_members at all.

`grep` finds **no insert** for either table anywhere in `src/`. Ten-plus surfaces
*read* them. **There is no rostering writer in the product** — the schedule
surfaces are viewers over data no code path produces, and `/m/schedule` (which
resolves `workforce_members` by `user_id`) is therefore empty for every user.

That is the real blocker for shift-derived grants, and it is a product gap, not
a migration. It needs its own decision:

1. **Repoint `shifts` at `crew_members`** (`crew_member_id`), following the
   repo's own precedent for merging a parallel store into the SSOT
   (equipment→assets, sub_invoices→invoices).
2. **Fold `workforce_members`' facets** (`kind`, `skills`, `venue_id`) onto
   `crew_members` and retire the island — its rows are all disposable e2e debris,
   so there is nothing of value to migrate.
3. **Build the rostering writer.** Until someone can create a shift and put a
   person on it, shift-derived grants have nothing to derive from.

Only after (3) does `shift_derivable` become live. The time-boxed
`user_capability_grant` covers the operational need in the meantime.


---

## Addendum 2 — the merge: Phase A landed, Phase B blocked on two decisions

**Phase A is done and live** (migration `20260715145335`): `crew_members` absorbed
the four facets genuinely unique to `workforce_members` (`workforce_kind`,
`skills`, `venue_id`, `metadata`), and `shifts` gained `crew_member_id`.
Additive only — nothing dropped, nothing deleted, the app untouched. A guard in
the migration asserts `shifts.workforce_member_id` is empty rather than assuming
it, so a future replay against real data fails loudly instead of silently
dropping the link.

Two corrections to Addendum 1, both found while executing it.

### CORRECTION 1 — `workforce_members` is NOT a dead island

Addendum 1 said "nothing creates workforce_members". **That was wrong** — the
grep was line-scoped and missed chained `.insert(` on the following line. It has
a full live CRUD surface:

- creates: `/studio/workforce/{staff,volunteers,contractors}/new` (each sets `kind`)
- updates + separate + reinstate + **delete**: the three `[id]/edit/actions.ts`
- ~14 read surfaces across `/m`, `/p/[slug]/volunteer/*`, `/studio/workforce/*`

The rows are still disposable e2e debris (verified: **105/105** are `E2E %`-prefixed,
0 have a login/venue/skills/metadata). But retiring the table is a **~20-file
repoint including 6 mutation surfaces**, not deleting a scaffold. The merge
direction is unchanged — FK gravity (8 tables vs 1) still makes `crew_members`
the SSOT, and two parallel person-CRUD systems is precisely the duplication
worth collapsing.

### CORRECTION 2 — ⚠️ repointing `delete` would silently destroy credentials

This is the blocker, and it is not a detail. Deleting a `crew_members` row
**CASCADEs**:

| FK rule | Tables |
|---|---|
| **CASCADE — rows are destroyed** | `credentials`, `crew_certifications`, `crew_ratings`, `independent_contractor_msas` |
| SET NULL | `assignments`, `offer_letters`, `org_offer_letter_settings`, `safety_briefing_attendees`, `shifts` |
| RESTRICT | `offer_letters` (one FK) |

On `workforce_members` the "Delete" button was harmless — nothing hung off that
table. Repointed at `crew_members`, **the same button destroys that person's
credentials, certifications, ratings and MSA** — and, because one `offer_letters`
FK RESTRICTs, it would fail for some people and quietly nuke others.
Inconsistent *and* destructive.

The answer already exists in the codebase: `separate*/reinstate*` on those same
action files, whose own comment reads *"separation used to be a plain DELETE,
which erased the person along with any record that they ever worked here"* —
`engagement_state` is `active | separated`. The other session built the right
mechanism and left the legacy Delete button wired next to it.

**Decision required before Phase B** — how should Delete behave once the surface
is `crew_members`?

1. **Remove the Delete button; Separate is the only removal.** Matches the
   lifecycle and the existing comment's intent. User-visible change.
2. **Guard it**: hard-delete only when the person has no dependent rows (a
   typo'd record, safe), otherwise refuse and point at Separate. Keeps the button
   useful, prevents the catastrophe.
3. **Silently make Delete = Separate.** Rejected — a button labelled Delete that
   does something else is worse than either.

Recommend (2), then (1) once the volunteer/contractor surfaces gain Separate.

### Why Phase B was not attempted in the same pass

Repointing creates while the readers still read `workforce_members` leaves a
**broken half-migrated vertical** — a newly created staff member would vanish
from the list that is supposed to show them. Three create actions were repointed
and then **deliberately reverted** to leave the app coherent. Phase B should land
as one change: all ~20 files, the Delete decision above, then drop
`workforce_members` + `shifts.workforce_member_id`.

### Phase C — the rostering writer, still the real blocker

Unchanged and untouched: **nothing creates a shift.** `shifts` has 16 seeded rows
and no writer anywhere in `src/`. Until an operator can create a shift and put a
person on it, `shifts.crew_member_id` stays empty and shift-derived grants have
nothing to derive from. Phase A gave that column a correct target; it did not
give it data.


---

## Addendum 3 — the Delete decision, resolved: separation archives

**Decided: option (2), guard it.** Landed and verified (migration
`20260715151622`).

### It was a live bug, not a Phase B risk

Addendum 2 framed this as a hazard that *would* appear once the workforce
surfaces were repointed. That understated it. **`/studio/people/crew/[crewId]`
already deletes `crew_members` today** (`deleteCrewMember`, wired to a button at
`page.tsx:108`) — sitting directly beside Separate. So the cascade was already
reachable: one click, and that person's credentials, certifications, ratings and
MSA are gone.

### The rule

Hard-delete only a record with **no dependent rows anywhere** — a typo or a
never-engaged entry, where nothing is lost. Any history at all and removal is
**separation**: `engagement_state = 'separated'` + `separated_at` +
`separation_reason`. The row and everything hanging off it survive for
record-keeping and legal retention; re-engagement is a state flip, not a
re-create.

**Independent of org/project state.** "Not currently working here" is not a
reason to destroy the record that they ever did.

### Enforced in the database, not the action

A BEFORE DELETE trigger on `crew_members`. The cascade is a database behaviour,
so the guard is one too — an `if` in a server action protects only the path that
remembers it. The trigger covers every path: this action, the workforce surfaces
once Phase B repoints them (they inherit the protection for free), a future bulk
tool, and a hand-typed DELETE.

The dependent scan is **dynamic**, enumerated from `pg_constraint` at runtime
rather than hardcoding today's 10 FKs. A hardcoded list silently stops
protecting when someone adds the 11th, and the failure mode here is destroyed
history, not a red build. Deletes are rare; reflection costs nothing that matters.

`src/lib/db/separation.ts` is only the **translation** layer — turning the
trigger's refusal into copy that names what is blocking and points at Separate.
Deliberately not a second guard: duplicating the rule in TypeScript is how the
two drift apart.

One subtlety worth keeping: the guard raises `23001 (restrict_violation)`, and
so does a plain FK RESTRICT — which `offer_letters.crew_member_id` genuinely
has. Matching on the SQLSTATE alone would mis-label a real FK error as "separate
instead" and send an operator to a button that would not help. Hence the
`crew_member_has_dependents:` message token, with a test pinning that distinction.

### Verified against live rows

| | result |
|---|---|
| crew member **with** a credential → delete | **REFUSED**, and the credential **survived** (CASCADE never fired) |
| never-engaged record → delete | **allowed** — still deletable, nothing lost |
| message | names the blocker: `public.credentials (1)` |

### Still open

`/studio/workforce/{volunteers,contractors}` have **no Separate action** — only
staff does. They target `workforce_members` today, so the trigger does not reach
them and nothing is at risk yet. But Phase B repoints them at `crew_members`, at
which point their Delete button starts being refused with nowhere to go. **Add
Separate/reinstate to those two surfaces as part of Phase B**, or their operators
are stuck.


---

## Addendum 4 — Phase C landed: the product can roster someone

**Shipped.** `shifts` now has a writer, and `/m/schedule` can find what it writes.

### What was actually broken

Three gaps in a chain, each making the next one moot:

1. `shifts` had **no writer anywhere in `src/`** — ten-plus surfaces read the
   table, none could produce a row. `/studio/workforce/rosters/[rosterId]` was
   generic auto-scaffold that dumped `Object.entries(row)` as key/value pairs: a
   roster you could not put anybody on. (`/studio/workforce/deployment`, labelled
   "Shifts" in the rail, is `workforce_deployments` — a different table.)
2. `/m/schedule` resolved the viewer through `workforce_members.user_id`, which
   is null on **all 105 rows**. Empty for every user, forever.
3. So `shift_derivable` had nothing to derive from.

### What landed

- **`shifts/actions.ts`** — `addShift` / `removeShift`, gated on
  `schedule:write` (manager + collaborator; deliberately not crew — rostering
  decides who works, and once shift-derived grants are live, what they can do).
  Keyed on `crew_member_id`: the person SSOT, whose `user_id` is real.
- **`RosterShifts.tsx`** — the roster's shifts plus the form that creates one,
  replacing the key/value dump.
- **`/m/schedule`** — now resolves `user → crew_members → shifts`.

Guards, each for a reason rather than for symmetry: the roster is re-read
server-side rather than trusted from the URL (that is what org-scopes the write);
the crew member is checked to be **in this org** (RLS would happily allow the
insert, since the shift's own `org_id` is ours — a crafted form could otherwise
roster another tenant's person); a separated person cannot be rostered; a shift
that ends before it starts is refused as the typo it is, rather than reaching
payroll with negative length; and a shift someone has **clocked in on** cannot be
removed, because at that point it stopped being a plan and became a record of
work.

### Verified end to end against live rows

Rostered a crew member who has a login, then ran `/m/schedule`'s exact new query:
**the field app finds the shift**, and `shifts.role` carries `Warehouse` — the
value shift-derived grants will read. Probes cleaned up (42 crew / 16 shifts,
unchanged).

The chain is now closed: **operator rosters → the person's phone shows it →
`shifts.role` + `shift_derivable` have real data to derive from.** Turning
shift-derived grants on is now a resolver change, not a data problem.

### Still open

- **Phase B** (retire `workforce_members`): unchanged, and correctly scoped as
  ~30 files needing surgical per-file edits. NOT mechanical — `swap-action.ts:109`
  has `kind: "shift_swap"`, a *notification* kind, so a blind `kind` →
  `workforce_kind` rename corrupts it. It must land atomically: creates repointed
  while readers still read the old table means a newly created staff member
  vanishes from the list meant to show them. (Attempted, backed out, deliberately.)
  Add Separate/reinstate to `volunteers`/`contractors` in the same pass — the
  delete guard will start refusing them with nowhere to go.
- **Admin UI for grants** — still SQL/API only.
- Note `m/directory/page.tsx:11` already describes itself as merging the "crew
  bench" and "workforce_members (deskless staff)" into one list. The product
  already wants one person table; Phase B is finishing what that comment started.


---

## Addendum 5 — Phase B landed: workforce_members is retired from the code

**Done.** Every `workforce_members` query now targets `crew_members`. Nothing but
comments still names the old table. `tsc` clean, lint clean, 126 tests green.

### The technique that made it tractable: PostgREST aliasing

Addendum 2 called this an atomic ~30-file refactor with 79 `full_name` usages at
risk. It was not, once the right lever was found:

```ts
.from("crew_members")
.select("id, full_name:name, role, phone, email, kind:workforce_kind")
.order("name", { ascending: true })   // real column in order/eq/filter
```

Aliasing on the way **out** means row types, JSX, DataTable keys, and form field
names are all untouched — the blast radius collapses to the query lines. And it
means each surface can move independently, so this was never one atom: it is
three verticals (staff / volunteers / contractors) plus read-only aggregators.

**The helper paths are the exception.** `listOrgScopedPage` / `getOrgScoped`
hard-code `select("*")` (`resource.ts:437`) and accept no columns argument, so
aliasing cannot apply. Left as a bare table swap, `r.full_name` and `row.kind`
would be `undefined` at runtime and **tsc would not have caught it** — those
surfaces read through `Record<string, unknown>` casts, so every name cell would
have silently rendered "—". Those files alias post-fetch instead.

### Two bugs the merge created, both fixed

- **`/m/directory` listed everyone twice.** It unioned "crew bench" + "deskless
  staff" because they were two tables. Post-merge both halves hit `crew_members`,
  so every person yielded two rows. Collapsed to one query — which is what the
  file's own header comment described wanting all along. `workforce_kind` is now
  the team label.
- **Staff's delete threw a raw Postgres error.** Its delete moved to
  `crew_members` without the guard translation, so the trigger's refusal would
  have surfaced as a SQL string. Now translated, like the other two.

### One flagged concern that was unfounded

"`/studio/workforce` unfiltered now includes production crew, so counts
disagree." Checked: `workforce_kind` is NOT NULL with exactly 4 enum values and
all 42 rows have one — the four chips **partition** the table, so the counts
agree. "All" showing every crew member is correct post-merge: they are all
workforce now. That is the point of the merge.

### Separate now exists everywhere the guard can refuse

`volunteers` and `contractors` had Delete and no Separate. Once they targeted
`crew_members`, the delete guard would refuse anyone with history and leave the
operator nowhere to go. Both now have `separate*`/`reinstate*` and the guard
translation, mirroring staff. All three verticals are consistent.

### Still open

- **Drop `workforce_members` + `shifts.workforce_member_id`.** Deliberately NOT
  done in this pass: the code no longer reads the table, but dropping is
  irreversible and worth one deploy of confidence that nothing regressed. The
  105 rows are e2e debris; nothing is lost. Do it as its own small migration.
- **Admin UI for capability grants** — still SQL/API only.
- **Shift-derived grants** — now unblocked (Phase C gave `shifts.crew_member_id`
  and `shifts.role` real data). Turning them on is a resolver change.
