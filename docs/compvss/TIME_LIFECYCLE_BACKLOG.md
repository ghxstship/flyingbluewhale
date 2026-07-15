# Time lifecycle — backlog

**Context.** Phases 0-5 of [`TIME_MANAGEMENT_LIFECYCLE_PLAN.md`](./TIME_MANAGEMENT_LIFECYCLE_PLAN.md) are on main (`abc5e665` … `ac87c964`). The lifecycle is continuous and reachable: a punch is captured, policy-checked, correctable under review, compiled, submitted, approved, posted, split into earning-coded lines, and exported — from both the console and the API, with signed webhooks for outside integrators.

Everything below is what's left. Keep this as the canonical "what's next" so no item gets re-discovered.

**Read the split first.** P1-P3 are engineering work you can schedule. **P4 and P5 are not** — they wait on other organisations, and no amount of sprint planning moves them. Reading this list as "five buckets left" is the wrong picture.

---

## P1 — Console surfaces the APIs are waiting on

The routes exist, are tested, and are documented. These are the operator doors.

1. **Post-to-payroll control** on `/studio/finance/timesheets/[id]`. `POST /api/v1/timesheets/{id}/post` is live and admin-gated; the detail page still has no button, so posting is curl-only. Needs a payroll-run picker and should surface the returned `otRuleSet` — an operator reconciling a dispute has to know whether OT was computed here or deferred to their HR system.
2. **Export console** on `/studio/finance/payroll/[runId]`. `POST /api/v1/payroll-runs/{runId}/export` + the `GET` history exist. The CSV driver returns an artifact in the response body; the page needs to offer it as a download and render the export ledger (state, attempts, accepted/rejected counts). Show `idempotent: true` plainly when a re-export collides — that is the feature working, not a failure.
3. **Exception queue** for `enforcement_state = 'quarantined'`. Phase 1 routes every blocked/GPS-denied/low-accuracy punch here and `PATCH /api/v1/time/entries/{id}` with `clearException` resolves it, but nothing lists them. Without this, a worker who overrode a geofence with a reason is flagged for a manager who never sees the flag. Index `time_entries_org_enforcement_state_idx` already exists for exactly this read.
4. **Pay-period admin** on `/studio/settings` or the timesheets surface. `POST /api/v1/pay-periods` is live; periods are currently only creatable by API. Generating them from `org_time_settings.pay_period_kind` + `pay_period_anchor` (both already stored, both unread) would remove the hand-entry entirely.
5. **Org time settings editor** — `org_time_settings` has no UI at all. Until it does, an org cannot turn geofencing on: `geofence_policy` defaults to `record_only` and only SQL can change it. Same for `ot_rule_set`, which is the field that decides whether we compute overtime or hand raw hours to a payroll provider. **This is the single highest-value item on the list** — Phase 1 and Phase 3 are both configuration-gated behind it.
6. **Contractor identifiers editor** — `orgs.federal_ein` / `contractor_license_number` / `contractor_address` (migration `20260715200000`) are settable only by SQL. Certified payroll now *refuses* without them (`77a6f30e`), so an org filing CA DIR is blocked until someone runs an UPDATE by hand.

## P2 — Worker surfaces

7. **`/m/timesheet`** — the worker's own sheet. `POST /api/v1/timesheets/{id}/submit` is live and `/p/[slug]/crew/timesheets` is still read-only, so a worker can see a sheet but cannot hand it in from anywhere. The portal's own empty state promises this pipeline.
8. **Foreground geofence check (Phase 7b)** — on app open/resume, take a fix and prompt in-app if the worker is on site with a shift and not clocked in. No native change; `@capacitor/geolocation` is installed. Honest limit: fires only when the app is opened, which is not arrival detection and must not be described as such.

## P2b — Gaps in the shipped work itself (not polish)

These were **designed in the plan and not built**. They're listed apart from the polish above because each one means a shipped feature is narrower than its own docs imply.

9. **`GET /api/v1/time/policy` does not exist, so the offline pre-flight doesn't either.** Phase 1's offline-coherence design has two halves: the server is authoritative, AND the client caches zones+policy so a worker who would be blocked gets the override prompt *at the moment they punch*, offline, rather than discovering it later. Only the server half shipped. Consequence today: a would-be-blocked punch made offline queues silently and lands `quarantined` on replay — the worker's time is never lost (`evaluatePunch` quarantines replays rather than refusing them), but they get no prompt and no chance to give a reason while it's fresh. Build the route, cache into IndexedDB on app open, and run `evaluatePunch` client-side before `postFieldWrite`. The decision function is already pure and shared for exactly this.

10. **The service worker still drops replayed 4xx silently** (`public/service-worker.js:198`). Phase 1's acceptance criteria called for a `rejected` store plus a "Not recorded" banner on `/m/clock`; it wasn't built. The geofence case is now handled server-side (a blocked replay lands quarantined, not 4xx), so this is no longer a *time-loss* path for punches — but every other 4xx on replay (validation, FSM conflict, a dedupe against a changed record) still vanishes with no user signal, across all five queueable endpoints. Pre-existing defect #11 from the audit; unchanged by this program.

11. ~~**The new time/pay notifications can't be muted.**~~ **DONE — and the diagnosis above was backwards. Read this before trusting the rest of this file.**

    What this item claimed: the seven Phase-4 events push unmutably, because `notify()` calls `sendPushTo` with no `kind` and `filterByPushPrefs` short-circuits. The short-circuit is real. The conclusion was not: **they never pushed at all.**

    Two stores exist and they are not the same store. `notification_preferences.matrix` (keyed by `PushKind`) is LIVE — both `/me/notifications` and `/m/settings/notifications` write it, and `filterByPushPrefs` gates on it. `user_preferences.ui_state.notifications` (keyed by `NotifyEvent`) was RETIRED as a placebo (AUDIT C-22 / F-02) — but `notify-resolver.ts#shouldNotify` still reads it, and its push default is `false`. `notify()` gated push on that dead store, so every push resolved to "no" before `sendPushTo` was ever reached. Verified against prod: 31 `user_preferences` rows, **1** carried the `notifications` key. `in_app` and `email` were unaffected — their defaults are `true`, so falling back to a dead store still let them through. Only `push` defaulted false, and only `push` was broken.

    **The trap this item set:** its own prescribed fix — "pass `kind` through" — would not have worked alone. `shouldNotify(push)` returns false first and short-circuits before `sendPushTo` runs. The dead gate had to come out too.

    Fixed by `NOTIFY_EVENT_PUSH_KIND` (src/lib/notify.ts): a partial `NotifyEvent -> PushKind` map that resolves push off the live taxonomy instead of the retired store, on both the `notify()` and `notifyOrgAdmins()` paths. Unmapped events send **no** push, deliberately — handing `filterByPushPrefs` an undefined kind excludes nobody, i.e. the unmutable push this item feared. Kinds `timesheet` / `payroll` / `time_correction` added to all three legs of the mirror (`send.ts`, `kinds.ts`, `notification_kind_catalog` via `20260716010000`). Guarded by `src/lib/notify-push-kind.test.ts`, mutation-tested against both failure modes.

    **Still open, and now the interesting half:** every *other* `notify()` event is still unmapped, so the rest of the app's push channel remains dead. That was pre-existing and is not a time-lifecycle problem, but it is a real one — audit defect #13 is broader than this file implies. Map events as their owners decide they should push; do not bulk-map them, because each one is a behavior change from silence to a buzzing phone.

## P3 — Integration surface

12. **SFTP transport for the CSV driver.** *Needs a dependency decision (`ssh2-sftp-client` or equivalent) — a supply-chain call, not a coding one.* Until then the artifact is downloaded and delivered by hand, which is what a large share of real payroll integrations do anyway. `PayrollExportDriver.capabilities.push` is already modelled for it.
13. **Zapier triggers/actions** — `triggers/clock-ins`, `clock-outs`, `timesheets-submitted`, `timesheets-approved`; `actions/create-time-entry`, `submit-timesheet`. Follow the `triggers/deliverables` template verbatim. **The routes alone do nothing**: the Zapier app definition lives in Zapier's platform and hardcodes URLs, so shipping these is a code change *and* an external app edit. Add samples to `ZAPIER_SAMPLES`.
14. **`GET /api/v1/timesheets` list endpoint** — `PAYROLL_CONNECTORS.md` §4 Option B tells integrators to poll `?state=approved`, and that endpoint does not exist. Either build it or correct the doc; right now the guide describes a path that 404s.
15. **`reconcile` for a real driver** — the interface exists, the CSV driver correctly throws (a file drop has no back-channel). The first API driver needs it, plus a `partial` → retry-only-rejected-lines path through `payroll_export_lines`.

## P4 — Gated on partnership, not on engineering

16. **Native payroll connectors.** ADP Workforce Now needs Marketplace partnership, security review, certification, and mutual-TLS client certs. Gusto/Paychex/UKG need partner approval. Workday is per-tenant and frequently EIB-over-SFTP rather than REST. **Schedule against signed customer demand, not roadmap optimism** — and evaluate Finch (unified HR API, paid, write-back coverage materially thinner than read) before committing to one-by-one.

## P5 — Gated on a native shell release

17. **Background geofencing (Phase 7c)** — true arrival/departure detection. Needs a background-geolocation plugin (license cost), Info.plist + Android manifest permissions baked at build time, Google Play's background-location declaration and manual review, iOS "Always" (20-region cap; users routinely downgrade it, which silently kills the feature), and a permanent capability probe because remote-loaded JS will call a bridge older installs don't have. **Only after 7a/7b prove insufficient with real usage data.** Phase 7a (`ac87c964`) ships the honest 80% today.

---

## Known-good facts worth not re-deriving

- `payroll_run_lines` was never empty — 6 demo rows seeded 2026-06-24. The true claim was that *no application code* wrote it. `post_timesheet` does now.
- Overtime is implemented for **FLSA and California only**. Every other jurisdiction, union agreement, and alternative workweek must run `ot_rule_set = 'none'`, where we emit raw hours and the HR system owes the split. Silently applying FLSA where stricter law applies underpays people. Limits of even those two are documented in `src/lib/time/overtime.ts`.
- **The webview cannot detect mock locations.** `geofence_state` is self-reported by an untrusted device. Tamper-evident, not tamper-proof. Don't build a compliance claim on it.
- `database.types.ts` is `.prettierignore`d generator output. Never run prettier on it, and **verify a commit in an isolated worktree** — a concurrent session's uncommitted regen will mask a missing type, and once did (`584dc09c`).
- A migration applying and the tests passing is **not** evidence a feature exists. Grep for a caller. Phase 3 shipped two RPCs with none.
- **Attributing a red test to someone else is how you stop reading it.** `soft-delete-canon` was failing on another session's file when this program started, so it got labelled "theirs" and skipped on every subsequent run. Four unguarded `parties` / `users` / `projects` reads then shipped into that same red test across Phases 2, 4, 5 and the remediation pass, invisible because the failure line already had an owner. A concurrent session cleaned them up (`cba5c090`). If a guard is red for a reason that isn't yours, re-read the offender list each run — the cost of a red test isn't the test, it's the cover it gives everything after it.
