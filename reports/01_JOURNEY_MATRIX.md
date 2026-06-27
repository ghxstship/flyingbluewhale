# Phase 1 — Journey Matrix

**Scope:** 10 `platform_role` rows × 8 lifecycle columns = 80 cells. N/A cells cite the code that prevents the role from performing the stage.

Each cell is annotated `{ entry · key steps · success criteria }`. N/A cells are marked with `🚫 <reason>`. Cells that become OWNER/ADMIN-only at runtime show `→ admin` so the matrix doesn't duplicate identical flows.

---

## Legend

| Symbol | Meaning |
|---|---|
| ✅ | Role can perform this stage; steps + success criteria defined |
| 🚫 | Role is structurally blocked from this stage (cite capability/RLS) |
| →role | Identical to the linked role's entry; no difference for this stage |
| 🔶 | Partial — can perform limited scope of stage |

---

## Stages

| # | Stage | Primary surface |
|---|---|---|
| S1 | Account creation (signup → verify → onboarding) | `(auth)` → `/auth/resolve` |
| S2 | Team formation (invite, accept, role change, remove) | `/console/people/invites`, `/accept-invite/[token]` |
| S3 | Project setup (create, configure, scope, permissions) | `/console/projects/new`, `/console/projects/[id]/settings` |
| S4 | Project mgmt — **ATLVS console** | `/console/*` |
| S5 | Project mgmt — **GVTEWAY portal** | `/p/[slug]/{artist,client,crew,guest,sponsor,vendor}` |
| S6 | Project mgmt — **COMPVSS mobile** | `/m/*` |
| S7 | Final reconciliation (invoices paid, proposals signed, exports, close-out) | `/console/finance/*`, `/console/projects/[id]/close-out` |
| S8 | Project archive (soft-delete, read-only post-archive, restore) | `deleted_at` soft-delete + RLS |

---

## Matrix (compressed)

### R1 — `developer`

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup same as any user ([actions.ts:55 `signupAction`](src/app/(auth)/actions.ts)). | ✅ can invite; in `CAPABILITIES` developer has `["*"]` wildcard ([auth.ts:93](src/lib/auth.ts)). | ✅ full | ✅ full — lands on `/console` via `resolveShell('developer')`. | 🚫 developer persona is in the console-shell bucket ([auth.ts:95](src/lib/auth.ts)); no slug context. | 🚫 not in mobile persona list. | ✅ full finance read/write | ✅ full |

### R2 — `owner`, R3 — `admin`

Same as `developer` for capabilities (wildcard `["*"]`). Both land on `/console`. Treated as canonical admin pattern.

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup (same flow). First user to signup for an org becomes owner on server-trigger ([auto-membership in handle_new_user](supabase/migrations/20260416_000001_identity_tenancy.sql)). | ✅ `createInviteAction` in [console/people/invites/actions.ts](src/app/(platform)/console/people/invites/actions.ts); admin-gated by `isAdmin(session.role)`; RLS `invites_insert_admin` matches. | ✅ create `/console/projects/new` → form → insert; set permissions via memberships role column. | ✅ every `/console/*` module accessible. | 🚫 admin persona is console-bucket; external portal intentionally excluded (no admin persona in `["client","vendor","artist","sponsor"]`). | 🚫 same — admin is not crew. | ✅ approves invoices, closes POs, signs off deliverables, exports data. | ✅ soft-delete via `deleted_at`; RLS narrows to select-only for non-owner. |

### R4 — `controller`

Scoped: finance + ops. Capabilities: `projects:read`, `projects:write`, `invoices:*`, `expenses:*`, `budgets:*`, `time:*`, `mileage:*`, `advances:*`, `payouts:*`, `procurement:*` ([auth.ts:98-104](src/lib/auth.ts)).

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ same signup. | 🔶 can view invites list (RLS `invites_select_admin` includes owner/admin/developer — **NOT controller**). 🚫 cannot invite (admin-gate denies). | 🔶 can create projects (`projects:write`) but **not** configure memberships (no `team:*` cap). | ✅ `/console` — finance + procurement + ops modules only (UI gates by role; deliverables-scan + AI may be out-of-scope but not explicitly gated). | 🚫 not in portal personas. | 🚫 not in mobile personas. | ✅ full — this is their primary value. | 🔶 can archive own scoped entities only. |

### R5 — `collaborator` (→ persona `project_manager`)

Capabilities: `projects:*`, `advancing:*`, `deliverables:*`, `schedule:*`, `tasks:*`, `crew:read`, `crew:write`. ([auth.ts:109-114](src/lib/auth.ts))

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup. | 🚫 invite is admin-gated. | ✅ create + configure projects. Cannot assign billing. | ✅ `/console` — primary user of advancing + CMS + crew. | 🚫 not in portal personas. | 🚫 not in mobile personas. | 🔶 closes operational deliverables; **NOT** finance reconciliation. | 🔶 archive project (write scope on projects includes delete/archive). |

### R6 — `contractor` (→ persona `vendor`)

Capabilities: none listed → default-deny outside vendor-portal scope.

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup via `/accept-invite/[token]` (invite-only normally). | 🚫 invite is admin-gated. | 🚫 no project-create capability. | 🚫 resolveShell routes vendor to `/p`, not `/console`. | ✅ `/p/[slug]/vendor` — scoped to their COIs, W-9s, POs, invoices. | 🚫 not crew. | 🔶 vendor-side only — submits invoices, uploads W-9. | 🚫 archive is admin-scoped. |

### R7 — `crew` (→ persona `crew`)

Field-ops role. Scoped to mobile PWA.

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup (often via invite). | 🚫 admin-gated. | 🚫 no capability. | 🚫 resolveShell routes crew to `/m`, not `/console`. | 🚫 not in portal personas. | ✅ `/m/*` — ticket scan, clock-in, inventory, incident reports. | 🔶 clock-out + time entries complete; no fiscal close. | 🚫 no archive scope. |

### R8 — `client` (→ persona `client`)

External client — proposal + invoice view.

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup via invite or proposal-share link (`/proposals/[token]` is anonymous-acceptable). | 🚫 admin-gated. | 🚫 no capability. | 🚫 routed to `/p`. | ✅ `/p/[slug]/client` — proposals, invoices, KBYG. | 🚫 not crew. | 🔶 client-side sign-off: accepts proposals, pays invoices. | 🚫 archive is ops-side. |

### R9 — `viewer`, R10 — `community`

Both persona-map to `guest` → routed to `/me` (no slug = no portal).

| | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
|| ✅ signup. | 🚫 admin-gated. | 🚫 no capability. | 🚫 resolveShell → `/me`, not console. | 🚫 no slug. | 🚫 not crew. | 🚫 no finance scope. | 🚫 no archive scope. |

---

## Total executable cells

Counting cells that are ✅ or 🔶 (non-N/A):

- developer: 6
- owner / admin: 7 each = 14
- controller: 5
- collaborator: 5
- contractor (vendor): 3
- crew: 3
- client: 3
- viewer / community: 1 each = 2

**Total non-N/A cells: 39** across 10 roles × 8 stages.

**N/A cells: 41**, each with code citation for the capability/persona gate that prevents the role from performing the stage.

---

## Phase 2 execution strategy

Given:
- `.env.local` lacks Stripe, Anthropic, Resend, the remote flag service, Sentry keys.
- No existing seeded test accounts for each role (other than the `demo` org owner from `20260416_000006_seed.sql`).

Phase 2 will execute in three tiers:

**Tier A — Anonymous + public (no auth required):**
- S1 signup flow (all roles — anyone can hit `/signup`)
- Public marketing routes, sitemap, robots
- `/proposals/[token]` with a seeded proposal token
- `/p/[slug]/guide` public KBYG

**Tier B — Route reachability + API probing (no full session):**
- Every `/console/*`, `/p/[slug]/*`, `/m/*` route reaches 200 (or 307 → `/login` for auth-gated — expected behavior is the pass criterion)
- API endpoint 401/403 for unauthenticated calls (correct behavior)
- Database RLS policies enforced (verify policy names exist, counts match migrations)

**Tier C — Static + typecheck gates:**
- `npm run typecheck` — blocks any untyped import/export break
- `npm run test` — 108 unit/integration tests
- `npm run build` — end-to-end build success
- `npm run lint` — code quality

**BLOCKED tiers (require third-party credentials):**
- Stripe payment flows, Connect onboarding, webhook signature verify round-trip
- Real email delivery via Resend
- Streaming AI chat (Anthropic)
- the remote flag service flag evaluation
- OAuth (Google/GitHub/Microsoft — require external OAuth client setup in Supabase dashboard)
- SSO / SCIM (not implemented)

**Authenticated-role E2E (Playwright specs):**
- Will run `npm run e2e` and rely on existing spec coverage. Any new spec development for missing roles is scope-creep — flagged but not executed.
