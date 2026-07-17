# Universal capture + add-on RBAC — backlog

**Context.** Landed 2026-07-15 across two threads that turned out to be one:
[`SCANNING_UNIVERSAL_CAPTURE_PLAN.md`](./SCANNING_UNIVERSAL_CAPTURE_PLAN.md)
Phases 0-2, and [`ADR-0015`](../decisions/ADR-0015-add-on-capability-grants.md)
Addenda 1-5. The scanner decomposed into per-feature capabilities; those
capabilities became grantable by role, by person, and for a time window; and the
person model underneath them got merged, linked to logins, and given a rostering
writer.

Everything below is what is left. Keep this as the canonical "what's next" so no
item gets re-discovered — several items here were expensive to establish and are
easy to re-litigate from first principles.

**Read the split first.** P1-P3 are engineering you can schedule. **P4 is gated
on a legal answer** and **P5 was decided against on the evidence** — neither is a
sprint item, and reading this as "five buckets left" is the wrong picture.

---

## P1 — The doors

The data layer, the guards, and the API exist and are verified. These are the
operator surfaces that make them usable by someone who is not holding a SQL
client.

1. **Grant admin** — **BUILT (2026-07-17).** `/studio/settings/capabilities`
   (settingsNav · Team & Access, readable manager+, writes admin per the RLS
   band) now carries all three pieces: (a) the role × capability **matrix**
   over `crew_roles` × `role_capability_grants` (grant/revoke per cell +
   per-row `shift_derivable` toggle, derivation-excluded capabilities
   refused), (b) **per-person grants** with `valid_from`/`valid_until` +
   `reason` and liveness badges (Active/Scheduled/Lapsed), and (c) the live
   **"who holds what"** view — resolved through the same logic as
   `effective_capabilities()` + the static floor via `src/lib/rbac/holders.ts`
   (which borrows the REAL `can()` matcher rather than re-implementing it),
   including blanket attribution while grandfathered. Pinned by
   `src/lib/rbac/holders.test.ts`.
2. **Role catalog editor** — **BUILT (2026-07-17).**
   `/studio/settings/capabilities/roles`: list with crew counts + grants,
   create/rename (manager+, rename touches the display name only — the slug
   is the stable key), and **merge** (admin, because it moves permission
   rows): pick From/Into, both roles' grants render **side by side with the
   merged result** before an acknowledged confirm. Merge copies grants
   (target's `shift_derivable` wins on collision), repoints
   `crew_members.crew_role_id`, drops the source's grant rows, soft-deletes
   the source. `slugify_role()` stays never-fuzzy; the TS mirror is
   `src/lib/rbac/slugify-role.ts` (parity-pinned in holders.test.ts).
3. **`scan_unknowns` console lens** — **BUILT (2026-07-17).**
   `/studio/settings/capabilities/scan-misses`: open misses ranked by
   `seen_count` (rides `scan_unknowns_org_open_idx`), last-seen/last-actor,
   stat tiles (open · scans represented · repeats), manager+ resolve
   (resolved_at/resolved_by — never deleted), recently-resolved tail. The P4
   measurement instrument now has a readout.

## P2 — Flip the switch

4. **`orgs.capability_grants_enforced`** — **surface BUILT (2026-07-17); the
   per-org flip itself remains an operator decision.**
   `/studio/settings/capabilities/enforcement` is now the ONLY write path in
   the console: it renders the who-would-lose-access diff (legacy blanket
   synthesis vs configured grants, computed by
   `computeEnforcementDiff` in `src/lib/rbac/holders.ts`) BEFORE offering the
   switch, requires an acknowledgement checkbox past a non-empty loss list,
   and the action **re-measures the diff server-side at submit time** so a
   stale tab still gets an honest refusal. Disabling shows who would regain
   the blanket. Both directions audited
   (`capability.enforcement_changed`, with the loser count in metadata).
   The old one-click toggle on the capabilities page was removed.
   **Still true: no org has flipped yet** — the security win lands when an
   org configures grants and walks through this page.
5. **Shift-derived grants** — **BUILT + APPLIED (2026-07-17).**
   The resolver change landed AND is live as
   `supabase/migrations/20260717130531_shift_derived_grants.sql`: `effective_capabilities()` gains a third UNION branch — a crew
   member rostered on an ACTIVE shift (`starts_at <= now() < ends_at`,
   attendance scheduled/checked_in/on_break, not separated) derives the
   capabilities of the role the SHIFT names (`shifts.role` → `slugify_role` →
   `crew_roles.slug`), for grant rows flagged `shift_derivable`. The
   per-(role, capability) flag is honored; **`scan:credential` is hard-excluded
   in the SQL even if a row is flagged**, mirrored by
   `SHIFT_DERIVATION_EXCLUDED` / `isShiftDerivable()` in
   `src/lib/rbac/capabilities.ts`, and the grant admin action now refuses to
   set `shift_derivable` on an excluded capability so the flag can't be
   configured into a no-op. Pinned by `src/lib/rbac/capabilities.test.ts`.
   The scheduler-as-authorization-surface rationale above stands: derivation is
   the intended ergonomics for gear and stock, never for gate access.

## P3 — Finish the merge

6. **Drop `workforce_members` + `shifts.workforce_member_id`** — **migration
   WRITTEN (2026-07-17), pending apply:**
   `supabase/migrations/20260717130551_drop_workforce_members.sql`. Re-verified
   before writing (both greps run separately, against the REF): the table name
   and the column name survive only in comments plus the RLS-canon test list
   (entries removed alongside). The migration rewrites
   `shifts_select_consolidated` first (keeping `manager` in the band, no
   `is_org_member` return — the chat-membership-boundary guard reads this as
   the last policy body), then drops the column, then the table, with apply-time
   guards re-asserting the e2e-debris verdict (0 linked shifts, 0 rows with a
   user_id) and 0 inbound FKs. Supersedes the branch-only
   `20260715220000_retire_workforce_members.sql`. **Apply only after the
   deployed ref is verified clean of readers** — code-then-migration is the
   zero-downtime order.
7. **`workforce_deployments` is named "Shifts" in the rail.** `/studio/workforce/
   deployment` is a *different table* from `shifts`. Harmless today, actively
   misleading now that shifts are real and rostered somewhere else
   (`/studio/workforce/rosters/[rosterId]`). Rename the nav entry or reconcile
   the two concepts.
8. ~~**`manager` holds no `check-in` grant**~~ **DONE (2026-07-17).** The gap:
   a manager persona was refused by `/api/v1/scan` while a plain `member` was
   accepted. **Decision, ratified this pass: managers supervise gates, so the
   manager band gets `check-in:*`** — added to `CAPABILITIES.manager` in
   `src/lib/auth.ts`, pinned by `src/lib/auth.test.ts`. Grandfather interplay
   is deliberate: while `capability_grants_enforced` is false, `resolveGrants`
   keys the legacy scan blanket on `check-in:write`, so managers now pick up
   the synthesized `scan:*` alongside members and crew.

## P4 — Product data — **gated on a legal answer, not on engineering**

9. **External product lookup.** Do not schedule this as a sprint item. The
   blocker is not cost — UPCitemdb's overage is **$0.0004/lookup** and GS1's
   View/Use tier is $500, both noise against an event budget. The blocker is
   **the right to cache and re-serve**: UPCitemdb's docs are silent on it, and
   GS1's trial terms restrict use to *"internal business purposes"* and bar
   redistribution without written authorization — which a **multi-tenant SaaS
   arguably performs by design** when it shows a customer's bar staff a product
   name. That is a question for counsel and a GS1 rep.
   **Do the free half first**: bulk-import **Open Food Facts** (ODbL, free, full
   nightly exports, no rate limit, caching explicitly fine). Then let
   `scan_unknowns` (P1 #3) prove whether any paid provider is needed at all.
   **Measured, not assumed**: OFF resolved **2 of 11 spirits (~18%)**, ~29%
   overall. There is no good liquor database. Anything promising "scan anything,
   get a name" will fail at 2am at the bar.

## P5 — Vision — **decided against, on the evidence**

10. **Photograph-a-bottle volume estimation. Not planned.** Recorded here so it
    is not re-proposed as an obvious win. Single-photo fill estimation is
    **±15-25%**; a **$30 Bluetooth scale is ±1%**. If the goal is liquor
    variance accounting, the camera is the wrong instrument, and the user agreed
    to defer on exactly that basis. Should it ever return: the accuracy lever is
    the capture UX (framing overlay, level gate, glare check), **not** the model,
    and confirm-and-correct is mandatory — a wrong number a human confirmed is an
    operational fact; a wrong number the system asserted is a trust loss. Full
    reasoning: `SCANNING_UNIVERSAL_CAPTURE_PLAN.md` §3.

---

## The Phase B verification lesson — read before the next table merge

The merge shipped a real bug, caught and fixed by other sessions
(`0019cde5`, then `c809cfb6` swept the remaining seven sites). The half-migrated
shape was:

```ts
.from("crew_members")            // repointed
.eq("workforce_member_id", ...)  // NOT repointed — null on every row, returns nothing
```

**Both verification gates missed it, and it is worth understanding why:**

- `tsc` could not see it. The column is a **string argument**, and these readers
  go through loose typing — the exact blind spot that also hides
  `listOrgScopedPage`'s `select("*")` aliasing failure.
- The grep was for **`workforce_members`** — the TABLE. The surviving references
  were **`workforce_member_id`** — the COLUMN. The table sweep reported clean
  while seven filters still pointed at the dead key.

**Next table merge: sweep the FK column name separately from the table name, and
do not treat a clean `tsc` as coverage for anything passed as a string.** A
merge is not done when the table name is gone; it is done when every column that
named the old table is gone too.

---

## Things that are NOT coming back — do not re-derive

- **NFC is impossible in the Capacitor shell.** Not just iOS (WebKit has never
  shipped Web NFC) — **Android's System WebView never plumbs the `nfc`
  permission**, so `scan()` fails with no way to grant it. The trap:
  `"NDEFReader" in window` is **true** in that WebView, so a naive feature-detect
  lights up UI that always fails. Real NFC means a native plugin, an App Store
  round-trip, and a maintenance-model change. The decorative NFC mode was
  deleted.
- **No phone reads UHF RFID.** Physics, not software. The answer is a Bluetooth
  sled in **HID keyboard-wedge mode**, which types the EPC into the focused
  input — zero plugin, both platforms, works on the shipped binary. That is why
  the manual field auto-focuses. Web Bluetooth is also unavailable in the shell
  on both platforms.
- **Three scan outcomes, not two.** `resolved` / `unresolved` / **`unresolvable`**.
  Retailer RCNs (`20`-`29`), deli codes (`02`), ISBNs (`977`-`979`) and coupons
  pass the check digit and are shape-identical to GTINs, but **no database can
  ever resolve them** — GS1 licenses a *prefix*, not products. They are excluded
  from `scan_unknowns` on purpose; recording them would corrupt the one number
  that queue exists to produce.
