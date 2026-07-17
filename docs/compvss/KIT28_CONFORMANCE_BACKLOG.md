# COMPVSS Kit 28 Conformance — Open Work

**Date**: 2026-07-17 · **Session**: kit 28 alignment + self-sufficiency remediation (ended at `2c3ac9a1`, all pushed)
**SSOT for design**: `ATLVS Ecosystem (28).zip` → `design_handoff_compvss_field` (governance: kit leads, repo follows; MORE and LESS are both violations)
**SSOT for capability state**: `src/lib/mobile/self-sufficiency-manifest.ts` (guarded — "shipped" requires a proving spec; do not hand-edit the state without one)

Everything below is open as of the date above. Items are grouped by what unblocks them, not by feature area, because that is how they'll actually get picked up.

> **Branch disposition (2026-07-17, ship pass):** the `worktree-kit28-compvss-conformance`
> branch (tip `2656d7a4`, 11 commits, based on `77a6f30e` / 07-15) is a **superseded
> draft** and was deliberately NOT merged. Its surfaces (Assets tab, Knowledge/Documents
> split, Spaces & Clubs + gate, Engagement, kit-28 app bar) were re-landed on main in
> newer form on 07-17 (`1f295c19` … `2c3ac9a1`), and its two migrations were recovered
> into the aligned ledger under their applied stamps (`20260715151130_kb_must_read_acks`,
> `20260715152619_spaces_gate_fk`). Its one genuinely unlanded change — rewriting
> `kit-mobile.css` back to the kit's sub-11px/off-grid literals ("kit 28 is the floor")
> — is exactly §4's "~90-rule policy drift" item, which **needs Julian's ruling** before
> anyone lands it. If the ruling adopts the kit floor, cherry-pick `b3b889e4` from the
> branch rather than re-deriving the 199 declarations.

---

## 1. Built, unproven — needs an e2e spec, nothing else

The surfaces exist end-to-end; the manifest guard rightly refuses `shipped` until a spec watches them work. Cheapest wins in the file.

| Manifest cell | What the spec must do | Notes |
| --- | --- | --- |
| `expense.file` | File an expense with a receipt photo as crew; assert `expenses.receipt_path` non-null | Receipt uploads service-side (AP-OCR precedent); org-prefixed path already laid out |
| `timesheet.submit` | Punch, submit via `/m/timesheets`, assert `submitted` + manager push | `submit_timesheet` RPC is prod-verified refusing non-owners; only the journey is unwatched |

Test creds: `crew@gvteway.test` / `mgmt@gvteway.test` · `CompvssTest2026!` (demo org). Suppress ConsoleTour; see `docs/E2E_COVERAGE_BACKLOG.md` for fixture gotchas (date-anchored shifts, teardown purges).

## 2. In flight in parallel sessions — do not start, do not touch

| Item | Where it lives | State |
| --- | --- | --- |
| `incident.triage` | `/m/incidents/[incidentId]` + `src/lib/db/incident-fsm.ts` — **uncommitted** in the shared tree | Another session owns it; its soft-delete guard failures are theirs |
| `asset.custody` | Gate + admin surface shipped inert (`11443eb1`); blocked on ADR-0015's `resolveGrants` landing in HEAD | When the resolver lands, the gate activates with no code change here — then it needs the grant-a-crew-fixture e2e |

## 3. Genuinely unbuilt — the eight capability gaps

Recommended order by field stakes (crisis first — on the day it matters nobody is browsing a hub):

1. **`crisis.respond`** — declare a code, acknowledge muster, mark-self-safe from `/m/emergency`. Fan-out half already fixed (crisis pushes reach the field). Full-width thumb targets, unsilenceable kind, ack must queue offline.
2. **`briefing.signin`** — deliverer opens the talk; crew sign in by QR/name + `SignaturePad` (mounted on mobile since the capture layer). Store exists (`safety_briefings` + attendance + `signature_path`). Queue signatures offline.
3. **`approval.clear`** — the real approvals engine on mobile (swipe deck over `approval_instances`), replacing the two-table `/m/requests`. Pre-requisite D7 (`pending` state bug) is fixed; the console decision RPC (`record_approval_decision`, 20260715140000) is the write path.
4. **`offline.durable`** — wrap every mobile server action in the outbox pattern; fold the evictable localStorage queue (`lib/offline/queue.ts`) into the IndexedDB outbox (S5). Exit test: airplane-mode submit on every `/m` form survives an app kill.
5. **`onboard.complete`** — branch `step_kind`: `upload` → real file input, `sign` → SignaturePad, `read` → scroll-gate. Remove the blanket self-attest checkbox. Kinds CHECK at `baseline.sql:11103`.
6. **`punchlist.raise`** — photo-first snag → `/studio/punch` stores. `/m/punch` name is now free of the collision (it's "Punch Clock").
7. **`org.zones`** — geofence retune from the site it governs; map + drag radius; admin-gated.
8. **`shift.assign`** — **no writer exists in ANY shell** (only write repo-wide is the check-in attendance patch). Build desktop-first, then mirror; this is a cross-shell feature, not a mobile port.

Console-only by documented decision (not gaps): `org.billing`, `reports.author`.

## 4. Kit-side flags — the kit must move first (governance rule 3)

| Flag | Detail |
| --- | --- |
| Molten-orange gradient | `apps/field/index.html:23-27` paints `.cop-spark`/`.form-ic`/`.pass-head .pa` in LEG3ND's accent, commented "Molten is the brand default" — contradicts the kit's own README (signal yellow). Repo follows the README. |
| Inbox swipe Flag/Archive | Kit prototype toasts "Archived" with no store in kit OR repo. Omitted rather than faked. Needs a kit-sanctioned store (per-member flags/archive on `chat_room_members`?) before the repo builds it. |
| DM presence dots | Kit seed shows online dots; no presence store exists anywhere. Omitted — a painted dot claims someone is reachable when nobody knows. |
| `/m/advances` vs kit "Advance (cart)" | Kit's Advance surface is the request CART; the repo's `/m/advances` is the issued-items list (which the kit calls the Assets tab). Title reads "Advances". IA question for the kit: does the cart (now `/m/advances/new`) deserve the surface name? |
| Schedule + Jobs FABs | Kit CREATE map wants Schedule → event form, Jobs → job-posting form (perm-gated). Neither has a mobile backend; a FAB that opens nothing is the bug this cycle started with. Build the actions first (`events` insert RLS allows the crew band; `job_postings` is org-member — decide the app-gate). |
| ~90-rule policy drift | The 4px-grid + 11px-floor policies rewrote the kit's off-grid literals during the port (kit `13px` padding → 12, `8.5px` badge text → 11). Pixel-exactness and those guards are mutually exclusive. **Needs Julian's ruling**; provably-wrong cases (switch centring, FAB offset, screen-anim distance) already carry `grid-exempt:` annotations. |

## 5. Repo hygiene fallout from this cycle

| Item | Detail |
| --- | --- |
| e2e specs vs moved routes | `/m/docs` is now **Knowledge** (SiteDocs moved to `/m/documents`); `/m/alerts` 308s to `/m/notifications`; `/m/wallet`→`/m/pass`, `/m/gigs`→`/m/jobs` renamed earlier. `e2e/compvss-field-personas.spec.ts:160` and `e2e/compvss-connecteam-parity.spec.ts:29,86` still visit `/m/docs` expecting the old surface — they'll render Knowledge and any title assertion ("My Documents") fails. Audit all three (incl. `ia-coverage`). |
| i18n retranslation | 21 stale title keys were dropped from de/es/fr/pt/ja/ar (they translated the WRONG names — "Service Requests" over Approvals etc.). en carries the kit names; the six locales need fresh translations of those keys. List = the `DESIRED` map in commit `192fc7a9`. |
| Console inbox convergence | `studio/inbox/actions.ts` still carries its own copy of channel/DM create; `src/lib/db/chat-rooms.ts` is the shared lib the mobile side uses. Converge when that file isn't hot (kit 21 W5 territory). |
| `notify()` kind coverage | `timesheet`/`payroll`/`time_correction` kinds landed; `notification-kind-mirror.test.ts` guards the SQL view ↔ `NOTIF_KINDS` lockstep. If the guard is green, this is done — listed only so nobody re-audits it. |
| Pixel pass | The route/title sweep verified **identity**, signed in. Nobody has done a screen-by-screen pixel comparison against the 42-image kit gallery on a real viewport. The prototype-frame bug class (`absolute` → `fixed`) is fixed for tabbar/FAB/sheets; anything else ported with `absolute` is suspect. |

## 6. Done this cycle (for orientation, not re-audit)

Kit routes all resolve (42/42 surfaces incl. `/m/assets`, `/m/spaces`+detail, `/m/documents`, `/m/time`, `/m/engagement`, Knowledge at `/m/docs`); tab bar + app bar + switcher/search drawers are the kit's; menus use the design system's `.mi`; FABs per the CREATE map (Home's removed); home = kit section set incl. Emergency Card; bell → feed, prefs → Settings; 21 fossil titles reconciled; six CSS porting bugs incl. the crooked switch; Pinyon Script loaded; grid-exempt + component-href + tap-target + notification-mirror guards added.
