# E2E coverage backlog — the lifecycle flows still untested

**Status as of 2026-07-15.** The complete-coverage program landed the render
tier (every shell × every persona), the behavioral tier (14/14 product
domains), and the lifecycle tier (invite-accept, account delete-restore,
auth-edges). `src/lib/ia/coverage-manifest.test.ts` guards all three — deleting
a spec fails CI rather than silently restoring a gap.

What's below is what remains. Each item says **why** it was deferred, because
in every case the reason is a real constraint, not a lack of time — and the
next person will hit the same wall.

> **The one lesson worth carrying:** of the three flows deferred as "flaky"
> earlier in this program, **all three turned out to be real app/DB defects**
> (`ba441779`). When a carefully-authored e2e resists multiple fix rounds,
> suspect the product, not the test.

---

## 1. COMPVSS lifecycle — kit-auth wizard, onboarding, joinOrgAction, pause/resume/archive

**Why deferred:** the `/m` surfaces were being actively rewritten by parallel
sessions during this program (routes deleted, components mid-edit). Authoring
specs against moving targets would have produced tests that were wrong on
arrival.

**Also genuinely uncovered:** the **vendor and talent personas are never
exercised on `/m` by any spec**. Note the premise correction from the audit —
`ROLE_TABS` is retired, COMPVSS serves one tab set to everyone and auth is
persona-agnostic, so "per-role COMPVSS surfaces" do not exist. The gap is the
coarse persona (Crew / Vendors / Talent), not per-role routes.

**Blocked on:** the COMPVSS rewrite settling. Re-check `/m` route reality
before authoring — do not trust this doc's route list.

**What "the rewrite" actually is (added 2026-07-15, by the time-lifecycle
session).** "Parallel sessions" was doing a lot of work in that sentence, and
whoever picks this up can't tell when it's unblocked. Concretely, the churn is
the *mobile self-sufficiency parity* effort: `/m/wallet` → `/m/pass`, `/m/gigs`
→ `/m/jobs`, `/m/directory/companies` → `/m/companies`, `m/onsite` deleted
(moved to `/p/onsite`), plus new `/m/my-work` and `/m/settings/team`. That is
what has to settle. It is **not** the time-lifecycle work, which was additive
and is done.

**Not blocked, author against these now:** `/m/clock` and `/m/schedule` are
outside the rename set and are stable. They already have live coverage —
`e2e/time-geofence-policy.spec.ts`, `e2e/time-corrections.spec.ts`,
`e2e/time-lifecycle-spine.spec.ts` — so check those before writing anything
overlapping. Two gotchas they encode, both of which read as flakes if you
rediscover them the hard way:

- The seeded owner carries **3 open `time_entries`** from the base fixture and
  `clock_out` closes only the newest, so a single-shot cleanup leaves the user
  "already clocked in" and every subsequent `clock_in` 409s. Drain in a loop
  until the API says nothing is open.
- First-hit Turbopack compiles of a new route take 25-45s. Attempt 1 fails,
  the retry passes in ~5s. That is the documented cold-compile, not a real
  flake — `playwright.config.ts` already carries retries for it.

## 2. SCIM deprovision

**Investigated 2026-07-15 — the security hypothesis was REFUTED, don't re-raise it.**
Deprovision (`DELETE`, or `PATCH {active:false}`) soft-deletes the membership
and that **is** sufficient to kill access:

- `chat_messages_select` → `private.is_room_member()` → **does** call
  `private.is_org_member()`, which filters `deleted_at is null`.
- `verifyApiKey` (`src/lib/api-keys.ts`) re-checks membership with
  `.is("deleted_at", null)`, so a deprovisioned user's PAT stops
  authenticating.

**The real, narrower gap:** SCIM never calls `offboardMembershipInOrg`, so it
skips the cascade. On **re-activation** (`PATCH {active:true}` upserts
`deleted_at:null`) the user's old PATs, `project_members` roles,
`chat_room_members` and push subscriptions all come back — whereas the console
path (`removePerson`) revokes them permanently and deliberately.

**Needs a product decision before any code changes** — does SCIM `active:false`
mean *suspend* or *terminate*? Okta/Entra routinely use it as a temporary
suspend, so cascading on every deactivate would permanently strip a returning
user's project roles. That may be worse than the gap. **Do not "fix" this by
reflex.**

**Testing it is blocked on a credential:** the routes authenticate with a
per-org bearer from `org_scim_tokens`. A spec needs a live plaintext token,
which must NOT be committed (it grants org-scoped user management). Gate it on
an `E2E_SCIM_TOKEN` env var and skip when absent — the same pattern the
service-client-gated flows already use.

## 3. MFA — challenge, recovery, and the proxy aal2 gate

**Why deferred:** needs a TOTP fixture (seeded secret + a code generator in the
spec) that doesn't exist yet.

## 4. `/onboarding/org`

**Why deferred:** creates durable prod pollution — a real org with a heavy
cascade, and it **rewrites the creating user's active workspace**, so it can't
point at a shared fixture. Needs its own disposable user (see the pattern in
§"Fixtures" below) and a teardown that can remove an org.

## 5. Signup happy-path — deliberately out of scope

Creates `auth.users` rows that cannot be torn down through the app. Left
untested on purpose; not a gap to close.

---

## Fixtures — read this before adding a lifecycle spec

- **`test+disposable@flyingbluewhale.app`** exists for destructive identity
  chains. It has **exactly one membership** (Starter, `member`) and that row is
  its entire blast radius. It is seeded **outside** the `ROLES × TIERS` loop in
  `supabase/functions/seed-test-fixtures/index.ts` — that loop puts every user
  in all four test orgs, which is precisely what a delete/deprovision chain must
  not touch. Keep it out of the loop.
- **Account deletion is not org-scoped.** It revokes memberships in EVERY org.
  Never aim it at a shared fixture: a mid-chain failure strands them, and the
  teardown cannot heal it (a member cannot restore their own soft-deleted
  membership — that write is service-role only).
- **Hand-creating an `auth.users` row breaks sign-in** with GoTrue 500
  "Database error querying schema" unless `confirmation_token`, `recovery_token`,
  `email_change` and `email_change_token_new` are `''` (not NULL) — GoTrue scans
  them into non-nullable strings. It also needs a matching `auth.identities` row
  (provider `email`, `provider_id = user_id`). Prefer
  `supabase.auth.admin.createUser`; if you must hand-roll, diff against a
  working fixture row.
- **The teardown owner (`test+owner@`) is only in the four `test-*` orgs.** A
  purge or verification probe seeded in `demo` is invisible to it and will
  silently do nothing.
- **Verify a teardown fix by seeding the blocking shape.** "0 rows removed, no
  error" is indistinguishable from "the broken path never ran."
- **Prod e2e tests the DEPLOYED code.** A local fix cannot turn a prod e2e
  green — push, wait for Vercel, then re-run. Budget ~5 min per cycle.

## Open question from the 2026-07-17 prod run — viewer resolves as member

`POST /api/v1/projects` as the `test+viewer` fixture denies correctly (403,
`projects:write` named) but the deny echo reads `Persona "member" (role
"member")` — the fixture's active org resolved a member role, not viewer.
Either the fixture's `last_org_id` points at an org where it holds member,
or persona derivation changed in the capture sweep. Denial is intact either
way; capability-gating.spec.ts now asserts the audit property (a resolved
persona/role + the capability are named) instead of pinning the login
suffix. ANSWERED (same day): the fixture held a stray persona='member' membership in Test Starter Org (seeding slip, every other org said viewer) and the session resolved there — member's floor carries check-in:*, which also explains the viewer scan 200. The membership row is corrected to viewer; the product authz map was never wrong.

---

# 2026-07-18 sweep — kit 30–33 behavioral gaps

The render tier is data-driven off the nav SSOT, so every route kits 29–33 added
is already render-covered. The kit specs (`kit29-surfaces`,
`compvss-kit31-32-surfaces`, `compvss-kit33-surfaces`) are render + RBAC-gate +
interaction-lite — they NAVIGATE the new surfaces but do not DRIVE their
mutations. This sweep closed the mutating flows that were safe to drive against
prod, and documents (below) the ones that are genuinely blocked.

## Closed 2026-07-18

- **Offer-letter accept FSM** (`/offer/[token]`, sent → accepted) —
  `e2e/roster-engagement-lifecycle.spec.ts`. Creates a disposable crew, assigns
  with the offer sent, scrapes the public token + access code off the console
  LetterShareCard, accepts anonymously in a clean context, asserts the signed
  notice. jack-sparrow only assigned; this signs.
- **Edit Reports drawer** (`/studio/projects/[id]/roster/reporting?edit=1`) —
  same file. Re-points a reporting edge post-assign (setReportsAction →
  offer_letters.reports_to_crew_member_id on live letters).
  Fixing this surfaced a **real prod defect** (see below).
- **Field template create** (`/m/templates/new`) —
  `e2e/compvss-field-mutations.spec.ts` (+ a crew manager-gate negative).
- **Mobile roster assign** (`/m/roster/assign` → offer_letters engagement) —
  same file (proven green vs prod).

Teardown for all of the above is registered in `scripts/e2e-clean-fixtures.mjs`
(field_templates `E2E Template%`, shifts role `E2E %`, and the assigned crew via
the letters-first `LIFECYCLE_CAST_PATTERNS` extended with `E2E Recruit%` /
`E2E Skipper%`). Both specs are pinned non-regressable in
`src/lib/ia/coverage-manifest.test.ts` (KIT_BEHAVIORAL_SPECS).

FormScreen gotcha (both COMPVSS create forms use the kit FormScreen): fields
carry NO `name` attr (React-controlled) — resolve each control through its
label's `.fld` wrapper. A `seg` field's `default` is NOT counted toward the
submit-enable gate until the option is explicitly clicked (the CTA stays a no-op
at opacity 0.5 otherwise) — click the default option before submitting.

## Deferred 2026-07-18 — real constraints, not time

- **Crisis check-in** (`/m/emergency` I'm Safe / Acknowledge Muster) — needs an
  ACTIVE `crisis_alerts` row (24h window) that no seed creates. The only in-app
  declare path (`/studio/safety/crisis/new`) fires an **org-wide unsilenceable
  `crisis` push to every member**, and `crisis_alerts` has **no stand-down
  lifecycle column** (can't be deactivated) — so declaring on prod is
  irreversible and spams real devices. Also `Need Help` pages the whole manager
  band. Blocked on: a service-role SQL seed of `crisis_alerts` (local lacks the
  service-role key) + drive `self_safe`/`muster_ack` only.
- **Mobile approvals drawer** (`/m` Approve tile) — needs a seeded open
  `approval_instances` row with a decidable step; approving pushes the requester
  unless requester == the decider. Blocked on: service-role seed (local lacks
  the key). Also delayed-commit (5s undo) — the write fires on a timer.
- **Roster reporting cycle** (open/close) — the memory flags **dual cycle
  walkers** (`lib/db/reporting.ts` vs page-local `roster/reporting/cycle.ts`) as
  an unreconciled convergence item; authoring a spec now would pin behavior that
  is itself undecided. Blocked on: a product decision.
- **Kit 33 Operations ledgers** (`/m/{reports,inspections,logistics,permits,
  travel}`) — render-only BY DESIGN; no backing tables yet (seed =
  `src/lib/mobile/ops-seed.ts`). Nothing to transition. Blocked on: schema.
- **Kit 33 Aurora chat** — canned placeholder (`answerFor`/`toolFor`); no
  persisted state. Interaction is already covered; there is no behavioral FSM.
- **Enum-normalization `OptionSelect` / `category_code`** (vendors/expenses/
  budgets/leads) — new UI, but it is **uncommitted** (a parallel session's work)
  and its M3/M4 cutover is mid-flight, so it is NOT on the deployed prod target.
  When it lands, the category write path (`category_code` + label mirror) is the
  concrete new behavioral gap to close.
- **Shift scheduler CREATE** (`/m/scheduler` New Shift → draft `shifts`) — the
  New Shift FormScreen does not open from a headless `getByRole('button',
  {name:/new shift/i})` click (the form's Area select never mounts). Needs
  live-browser archaeology on the FAB/trigger + a seeded venue/zone for the Area
  select. Render + view-switching + overflow sheet are already covered by
  `compvss-kit33-surfaces.spec.ts`; only the create mutation is deferred.

## Real defect this sweep surfaced

- **`/m/templates` server actions all 500 in prod** —
  `src/app/(mobile)/m/templates/actions.ts` is a `"use server"` module that
  exported a value (`export const TEMPLATE_CATEGORIES`), which Next forbids:
  *"A 'use server' file can only export async functions, found object."* The
  module throws at evaluation, so **every** action in it (create / duplicate /
  promote / archive / restore) returns 500. It shipped with kit 31 and was
  invisible because the kit render spec only OPENS the New Template form; the new
  submit test caught it. **Fixed** (the const + the two types are now
  module-local). A repo-wide sweep found no other `"use server"` file with a
  value export. The template create test can only go green once this fix
  DEPLOYS (prod e2e tests deployed code).

## Environmental caveat for the 2026-07-18 prod run

A parallel enum-normalization session applied enum-promotion migrations to the
SHARED prod DB (punch_items / service_requests / event_listings state+priority,
xpms_phase, expense_category, marketplace) but its matching app code is
uncommitted/undeployed — so the deployed app (`da1561e4`) is SKEWED against the
migrated DB. This regressed shipped surfaces: notably the web
`/studio/projects/[id]/roster` assign path (the project layout reads
`projects.xpms_phase`), which broke the **previously-green** `lifecycle-jack-
sparrow` acceptance test AND the two new roster-engagement tests at the identical
step. Those specs are correct; they can only be re-verified green once the enum
session deploys its app code. Proven green vs prod this run despite the skew:
mobile roster assign (`compvss-field-mutations`) + the control probe
`atlvs-sales-crm-coverage`.

# Full-suite rerun triage (2026-07-19, prod `115bc6e3`)

Ran the ENTIRE suite serially vs prod after the enum cutover deployed:
**1534 passed · 31 failed · 18 flaky · 5 not-run** (3.9h). Isolated re-runs
(the only reliable signal — a serial run of ~1500 back-to-back creates
rate-limits itself) resolved every failure to one of three buckets, with
**zero real app regressions** (no server errors in the Vercel logs throughout):

1. **Missing `suppressTour` → ConsoleTour scrim intercepts `/studio` clicks →
   120s click-timeout** (the #1 gotcha). Caused ~15 failures across 7 specs that
   drive the console but never suppressed the first-run tour:
   `forms-construction-trade`, `console-core-flows`, `console-transitions`,
   `console-transitions-b2`, `console-modules`, `subcontractor-ops`,
   `marketplace-canon-actions`. It surfaced now because a fresh deploy
   re-triggers the tour for the fixture users. **Fixed** — `suppressTour` added
   to each (before the login goto). `forms-construction-trade` verified 5/5 green
   (was 5/5 fail, 120s each).
2. **Stale selectors** (2 specs, both fixed): `consent` — the cookie banner is a
   `<section aria-label>` (role=region) not a heading, and "Customize" is now
   "Manage settings" (dba0a2a6 UI audit); `marketplace-canon-actions:323` — the
   `/me/availability` slot label renders 3× (calendar ×2 + list), so the bare
   `getByText` was a strict-mode 3-match → `.first()`.
3. **Contention / cold-start flakiness** (the rest): proven-green specs in the
   failed list — `atlvs-sales-crm`, `lifecycle-jack-sparrow`, the two new specs,
   and every RBAC/persona spec (`atlvs-console-personas`, `authz-matrix`,
   `project-roles`, `atlvs-deep-coverage`) — ALL pass in isolation; *different*
   tests flake each run. Plus the client-side subdomain-canonicalization nav
   race (`atlvs.pro/m/docs` → `compvss.atlvs.pro`), harmless (the route is 200).

**Triage method for the next person:** never trust a big serial prod run's raw
failure count. Re-run each failing spec ALONE (or ≤3 at a time). A proven-green
spec in the failed list = contention, full stop. A 120s click-timeout on
`/studio` = missing `suppressTour` before anything else. See
[[project-prod-migration-app-skew-hazard]] and the coverage-program gotcha
catalog.
