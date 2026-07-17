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

1. **Grant admin** — the whole RBAC layer is **SQL/API-only**. `crew_roles`,
   `role_capability_grants` and `user_capability_grants` are live, indexed,
   RLS'd and manager-gated, and `public.effective_capabilities()` resolves them
   per request. Nothing renders them. Until this exists, "grant Bob asset
   scanning for tonight's cover shift" is an `INSERT`, which means it will not
   happen. Needs: per-role capability matrix, per-person grant with
   `valid_from`/`valid_until` + `reason`, and a live "who holds what" view. This
   is **the single highest-value item on the list** — everything else in ADR-0015
   is configuration-gated behind it.
2. **Role catalog editor** — `crew_roles` was backfilled from the free text (22
   roles, 26 crew linked, 0 orphans) but `slugify_role()` is deliberately
   **never fuzzy**, so `Stage Manager` and `Stage Manager — cosmicMEADOW` are
   two roles. They are plausibly one job. Merging them is a judgement about an
   org's operations and **merging two roles merges their permissions** — so it
   needs an operator, not a regex. No surface exists to do it.
3. **`scan_unknowns` console lens** — every unresolved code now lands in the miss
   queue with a `seen_count`, ranked, and `scan_unknowns_org_open_idx` exists for
   exactly this read. Nothing lists it. This queue is the **measurement
   instrument for P4**: it is the only thing that can answer "is a paid product
   database worth buying", and it answers it with data instead of opinion.
   Cheap, and it unblocks a purchasing decision.

## P2 — Flip the switch

4. **`orgs.capability_grants_enforced`** defaults FALSE, so the legacy
   `check-in:*` blanket is still synthesized as `scan:*` and **every crew member
   can still scan credentials at a gate**. That is deliberate — grandfathering is
   what let this ship without locking the field out — but the security win is not
   realised until an org flips it.
   **Do not flip it from SQL.** It needs an admin surface that first shows *who
   would lose access*, because flipping before grants are configured locks out
   every scanner in the org. Depends on P1 #1.
5. **Shift-derived grants** — **BUILT (2026-07-17), migration pending apply.**
   The resolver change landed as
   `supabase/migrations/20260717130531_shift_derived_grants.sql` (written, NOT
   yet applied): `effective_capabilities()` gains a third UNION branch — a crew
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
