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
