# Building a payroll connector

This document is the contract for getting time and pay data out of ATLVS and into an HR or payroll system — ADP, Gusto, Workday, Paychex, Rippling, UKG, a spreadsheet, or something we've never heard of.

**The rule it exists to keep:** anything a first-party connector can do, you can do. There is no private path. The in-repo drivers are written against this document, so if it's insufficient for you, it's insufficient for us.

If you get stuck on something this page doesn't cover, that's a bug in this page.

---

## 1. What you're integrating with

A punch travels through six states before it's yours to export:

```
capture → (geofence policy) → correction/approval → compile → approve → post
```

You care about the last two. Concretely:

| Thing | What it is |
| --- | --- |
| `time_entries` | One punch. Has `started_at`, `ended_at`, `duration_minutes`, and a `timesheet_id` once compiled. |
| `timesheets` | One worker, one pay period. Carries `state` and the derived `total_minutes`. |
| `pay_periods` | The org's pay calendar. The unit a timesheet is compiled for. |
| `payroll_runs` / `payroll_run_lines` | What you export. Lines are hours-by-earning-code, not per-punch. |
| `earning_codes` | `REG` / `OT` / `DT` / `PTO` per org. Your mapping target. |
| `hr_worker_links` | Maps a worker to **their id in your system**. Without this an exported hour has no employee to attach to. |

**Only an `approved` timesheet posts, and only a posted timesheet produces lines.** That gate is a database predicate, not a UI check — you cannot export hours nobody reviewed, and neither can we.

---

## 2. Authentication

Mint a token at **Settings → API keys**, or `POST /api/v1/me/api-keys`:

```jsonc
{ "name": "ACME Payroll Connector", "scopes": ["time:read", "timesheets:read", "payroll:read", "payroll:export"] }
```

The plaintext token is returned **once**. Then:

```
Authorization: Bearer sk_1a2b3c4d_<secret>
```

### Scopes

`scopes` is required and validated against a real vocabulary — a typo is rejected at mint with a suggestion, rather than minting a token that authenticates and silently grants nothing.

| Scope | Grants |
| --- | --- |
| `time:read` | Read punches and correction requests |
| `time:write` | Record a punch, file a correction |
| `time:approve` | Decide a correction. **Not implied by `time:write`** |
| `timesheets:read` / `timesheets:write` | Read / submit timesheets |
| `payroll:read` | Read runs and lines |
| `payroll:export` | Mark a run exported |
| `<domain>:*` | Every action in that domain |
| `*` | Everything. Ask for it deliberately |

**Take the narrowest set that works.** A read-only connector wants `time:read timesheets:read payroll:read` and nothing else.

> **Legacy note.** Tokens minted before this vocabulary existed may carry an empty `scopes` array, which is still interpreted as a wildcard for backward compatibility. New tokens cannot be minted that way. If you hold an old token, re-mint it with explicit scopes.

---

## 3. The machine-readable spec

```
GET https://atlvs.pro/api/v1/openapi.json
```

Generate your client from it. It's cached for five minutes and is the same document we build against.

---

## 4. Getting the data

### Option A — subscribe (preferred)

Register a webhook at `POST /api/v1/webhooks/endpoints`:

```jsonc
{ "url": "https://your-connector.example/hooks/atlvs", "events": ["timesheet.approved", "payroll.posted"] }
```

The signing secret is returned once.

| Event | Fires when |
| --- | --- |
| `timesheet.submitted` | A worker hands a sheet in |
| `timesheet.approved` | A manager approves it — **your cue: it's now postable** |
| `timesheet.rejected` | Approval refused or the sheet was returned |
| `timesheet.posted` | Posted to a payroll run |
| `payroll.posted` | A run is ready to export |
| `time.correction_requested` / `time.correction_decided` | A worker disputed a punch / it was settled |

#### Verifying the signature

```
x-fbw-event: timesheet.approved
x-fbw-delivery: <uuid>
x-fbw-signature: t=1718900000000,v1=<hex>
```

`v1` is `HMAC-SHA256(secret, "<t>.<raw body>")` as hex. Verify against the **raw** body, before any JSON parsing:

```js
import { createHmac, timingSafeEqual } from "node:crypto";

function verify(rawBody, header, secret) {
  const { t, v1 } = Object.fromEntries(header.split(",").map((p) => p.split("=")));
  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  // Constant-time, and length-checked first — timingSafeEqual throws on a
  // length mismatch.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  // Reject stale deliveries so a captured payload can't be replayed later.
  return Math.abs(Date.now() - Number(t)) < 5 * 60_000;
}
```

Return **2xx** to acknowledge. Anything else is a failure and will be retried.

**Be idempotent.** `x-fbw-delivery` is stable across retries — key on it. At-least-once delivery is the contract; exactly-once is not.

### Option B — poll

`GET /api/v1/timesheets?state=approved` on your own cadence. Simpler, less timely. Fine for a nightly batch.

---

## 5. Mapping the fields

| ATLVS | Canonical | ADP | Gusto | Workday |
| --- | --- | --- | --- | --- |
| `hr_worker_links.external_employee_id` | `employeeId` | `associateOID` | `employee_uuid` | `Worker_Reference` |
| `earning_codes.code` | `earningCode` | `earningCode` | `hours_type` | `Time_Code` |
| `payroll_run_lines.hours_st/ot/dt` | `hours` | `hoursQuantity` | `hours` | `Quantity` |
| `cost_centers.code` | `costCenter` | `costNumber` | `job_id` | `Cost_Center_Reference` |
| `pay_periods.period_start/end` | `payPeriod` | `payPeriodStart/End` | `pay_period` | `Period_Reference` |

**Populate `hr_worker_links` first.** A worker with no link for your provider is the single most common reason an import is rejected. Reconcile it before your first export, not during.

---

## 6. Rules you have to follow

### Idempotency

Payroll is the one place a duplicate costs real money.

- **Key on `(payroll_run_id, provider)`.** Re-exporting unchanged content must be a no-op that returns the existing result, not a second submission.
- Forward an idempotency key to your provider where they support one.
- Re-posting a timesheet **replaces** that sheet's lines rather than appending, so a retry on our side never doubles hours either.

### Partial failure

Providers reject individual lines. When they do:

- Mark the export `partial`, not `failed`.
- Retry **only** the rejected lines, under the same export.
- **Never re-send accepted lines.** That is how people get paid twice.

### Retry

- 5xx and network errors: retry with exponential backoff.
- 4xx: terminal. Surface it — do not loop.

### Pay-period alignment

If the org's ATLVS period disagrees with the provider's calendar, **refuse the export and say so.** Do not silently re-bucket wages into a period the provider will interpret differently.

---

## 7. Things this platform does not do, so you don't build on sand

- **Overtime is computed for FLSA and California only.** Any other jurisdiction, union agreement, or alternative workweek must be configured as `ot_rule_set = 'none'`, in which case we emit raw hours and **your system is responsible for the split**. Do not assume the `OT`/`DT` buckets are populated. Silently applying FLSA where stricter law applies underpays people.
- **Certified-payroll exports currently ship an empty FEIN and license number.** If you build on `/payroll-runs/{id}/state-xml`, those fields are yours to fill.
- **We do not verify device location.** `geofence_state` is derived from coordinates a device self-reports; a rooted phone can lie, and the webview cannot detect mock locations. Treat it as tamper-evident, not tamper-proof, and don't build a compliance claim on it.
- **Rates are not resolved.** Lines carry hours, classification, and earning code. Money is your side of the line.

---

## 8. Zapier / Make / n8n

No bespoke work needed:

- **Zapier** — the published app has clock-in/out and timesheet triggers.
- **Make / n8n** — use a generic webhook trigger plus an HTTP module with `Authorization: Bearer sk_…`. Everything above applies unchanged.

---

## 9. Checklist before you ship

- [ ] Token holds the narrowest scopes that work
- [ ] Webhook signature verified against the **raw** body, constant-time, with a staleness window
- [ ] Deliveries de-duplicated on `x-fbw-delivery`
- [ ] Export keyed on `(payroll_run_id, provider)`; re-export is a no-op
- [ ] Partial failures retry only the rejected lines
- [ ] `hr_worker_links` populated for every worker you expect to export
- [ ] `ot_rule_set` confirmed with the customer — if it's `none`, **you** own the overtime split
- [ ] Pay-period boundaries agree with the provider's calendar
