# E2E_GROUND_TRUTH_MAP

**Protocol:** E2E-LRP Phase 0 deliverable + LDP overlay
**Run:** 2026-05-09 · operator: Claude Opus 4.7 · scope: flyingbluewhale (ATLVS Technologies)
**Branch:** `claude/naughty-wu-b69201` (worktree)
**HEAD prior to run:** `75d4fdb` _feat(salvage-city): 8th-persona model + offer-letter alignment to playbook v3_

> **What this document is.** Per E2E-LRP §PHASE 0: "what is actually testable end-to-end through UI." Every claim cites file path and (where useful) line number. No inferences from CLAUDE.md alone — every entry verified against schema, route files, or library headers.
>
> **What this document is NOT.** Not the test plan (that's Phase 2 deliverable, deferred until you confirm the open decisions in `PHASE_0_EXIT_SUMMARY.md`). Not a remediation plan (that's `LDP_REMEDIATION_PLAN.md`). Not a regression run (Phase 6).

---

## Prior audit work — context

This is **not the first audit run on this codebase**. A prior UJV (User Journey Validation) Phase 0–5 cycle ran on **2026-04-22** at HEAD `72f45e750ee08e864268e88429ca9c2b01917c59` and shipped GO with 39/39 cells GREEN, 0 P0/P1 open. Artifacts:

- [reports/00_DISCOVERY.md](reports/00_DISCOVERY.md) — surfaces, roles, entities, auth flows, tooling
- [reports/01_JOURNEY_MATRIX.md](reports/01_JOURNEY_MATRIX.md) + `01_journey_matrix.json` — 10 roles × 8 stages
- [reports/02_EXECUTION_LOG.md](reports/02_EXECUTION_LOG.md) — Tier A/B/C execution
- [reports/03_REMEDIATIONS.md](reports/03_REMEDIATIONS.md) — R-1 (`/me` auth guard), R-2 (SSO/SCIM copy cleanup)
- [reports/04_REGRESSION.md](reports/04_REGRESSION.md), [reports/05_DEPLOY_READINESS.md](reports/05_DEPLOY_READINESS.md)

**This new E2E-LRP run differs from UJV in scope:**

- UJV asked "do all roles complete the lifecycle?" — yes, 39/39.
- E2E-LRP + LDP asks "is the lifecycle decomposition itself well-formed?" — see this document and the 5 LDP-\* reports.

The two questions are independent. UJV's GO does not invalidate LDP findings; LDP findings do not invalidate UJV's GO.

---

## Section 1 — Subsystem implementation status

Per the user's reconciled mapping (turn 3): use ATLVS-implementation names; treat XPMS/USNP as conceptual labels. Full mapping in [docs/XPMS_TO_ATLVS_MAPPING.md](../docs/XPMS_TO_ATLVS_MAPPING.md). Summarised here for the in-scope subsystem list.

| In-scope subsystem                                                                               | Implementation status                                                                                                                                                                                                         | Anchor                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **identity**                                                                                     | REAL — orgs, users, memberships, project_members, crew_members, delegations                                                                                                                                                   | [0001:4272](../supabase/migrations/0001_remote_snapshot.sql:4272) (memberships), [:4981](../supabase/migrations/0001_remote_snapshot.sql:4981) (project_members)                                                                                               |
| **projects**                                                                                     | REAL — projects, events, locations + 8 nested console tabs (overview/tasks/gantt/roadmap/files/calendar/budget/crew/advancing)                                                                                                | [0001:4428](../supabase/migrations/0001_remote_snapshot.sql:4428); routes `/console/projects/[projectId]/*`                                                                                                                                                    |
| **deliverables**                                                                                 | REAL with `deliverable_history` transition log                                                                                                                                                                                | [0001:3299](../supabase/migrations/0001_remote_snapshot.sql:3299), [:3264](../supabase/migrations/0001_remote_snapshot.sql:3264)                                                                                                                               |
| **marketplace** (postings/calls/talent/offers/reviews)                                           | REAL — 11 tables in `0002_marketplace_canon.sql`                                                                                                                                                                              | [0002:160](../supabase/migrations/0002_marketplace_canon.sql:160) onward                                                                                                                                                                                       |
| **proposals**                                                                                    | REAL — proposals + proposal_share_links + proposal_activity + proposal_events; SDK `src/lib/proposals/`; PDF in `src/lib/pdf/proposal.tsx`                                                                                    | [0001:5038, 5103](../supabase/migrations/0001_remote_snapshot.sql:5038)                                                                                                                                                                                        |
| **invoices**                                                                                     | REAL — invoices, invoice_line_items, payment_applications, payment_application_lines                                                                                                                                          | [0001:4051](../supabase/migrations/0001_remote_snapshot.sql:4051)                                                                                                                                                                                              |
| **RFQs/POs (procurement)**                                                                       | REAL — vendors, requisitions, purchase_orders, po_line_items, po_change_orders, po_change_order_lines, po_checklist_items, prequalification_questionnaires, prequalification_questions; routes under `/console/procurement/*` | [0001:4913](../supabase/migrations/0001_remote_snapshot.sql:4913), [:4868](../supabase/migrations/0001_remote_snapshot.sql:4868), [:4929](../supabase/migrations/0001_remote_snapshot.sql:4929)                                                                |
| **event_guides**                                                                                 | REAL — event_guides + guide_comments + guide_persona enum (8 personas including brand_ambassador, media_press)                                                                                                                | [0001:3447](../supabase/migrations/0001_remote_snapshot.sql:3447), [:254](../supabase/migrations/0001_remote_snapshot.sql:254)                                                                                                                                 |
| **audit_log**                                                                                    | REAL — single canonical table + per-subsystem event tables (domain_events, proposal_events, stripe_events, usage_events, service_request_events, accreditation_changes, venue_build_log)                                      | [0001:2731](../supabase/migrations/0001_remote_snapshot.sql:2731), [:3346](../supabase/migrations/0001_remote_snapshot.sql:3346)                                                                                                                               |
| **finance** (expenses/budgets/time/mileage/advances)                                             | REAL operational; **no financial period state machine** (LDP §7 absent)                                                                                                                                                       | [0001:3489](../supabase/migrations/0001_remote_snapshot.sql:3489), [:2842](../supabase/migrations/0001_remote_snapshot.sql:2842), [:3664](../supabase/migrations/0001_remote_snapshot.sql:3664), [:3621](../supabase/migrations/0001_remote_snapshot.sql:3621) |
| **production** (equipment/rentals/fabrication)                                                   | REAL operational; **no production_phase column** (LDP §2 absent)                                                                                                                                                              | [0001:3421, 3534](../supabase/migrations/0001_remote_snapshot.sql:3421)                                                                                                                                                                                        |
| **ops** (incidents, daily_logs, inspections, punch_items, submittals, rfis, change_orders, RFIs) | REAL — Olympic/construction-grade ops surface                                                                                                                                                                                 | [0001:3858, 3173, 3946](../supabase/migrations/0001_remote_snapshot.sql:3858)                                                                                                                                                                                  |

**ai-tagged tables** (out of scope per turn 3): `ai_agents` `:2606`, `ai_conversations` `:2627`, `ai_messages` `:2640`. Not exercised in this run.

---

## Section 2 — Schema scale

| Source                                             | Tables                            | Lines            |
| -------------------------------------------------- | --------------------------------- | ---------------- |
| `0001_remote_snapshot.sql` (consolidated baseline) | 208                               | 18,853           |
| `0002_marketplace_canon.sql`                       | 11                                | 1,075            |
| `0003_booking_canon.sql`                           | 9                                 | 570              |
| 10 dated migrations 20260505*–20260508*            | 0 (incremental ALTER + DATA only) | 1,918 cumulative |
| **Total**                                          | **228 tables**                    | **22,416 lines** |

**Enum types declared:** ~80 across the three canon files.

**Migration history note:** the prior UJV audit at [reports/00_DISCOVERY.md:35](00_DISCOVERY.md:35) cites `supabase/migrations/20260416_000001_identity_tenancy.sql` and 28 dated siblings ending at `20260421_000029_invites.sql` (29 migrations). Those have been **squashed into `0001_remote_snapshot.sql` since the prior run** — the current worktree has 13 migrations total. No data was lost; the squash is a maintenance refactor.

---

## Section 3 — Route surface

**Total `page.tsx` files: 777** distributed across 7 shells:

| Shell              | Pages   | Purpose                                                                                                                                                                                                                                                                                                                                    | Anchor                                                          |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `(marketing)`      | 45      | Public SEO; marketplace public discovery; legal                                                                                                                                                                                                                                                                                            | [src/app/(marketing)/](<../src/app/(marketing)/>)               |
| `(auth)`           | 12      | Login/signup/invite/passwordless/SSO entry (SSO entry route exists, server-side not implemented per UJV R-2)                                                                                                                                                                                                                               | [src/app/(auth)/](<../src/app/(auth)/>)                         |
| `(personal)`       | 23      | `/me/*` — profile, settings, applications, submissions, talent/crew profile editing                                                                                                                                                                                                                                                        | [src/app/(personal)/](<../src/app/(personal)/>)                 |
| `(platform)` ATLVS | **541** | Internal ops console — Olympic-scale (programs, venues, accreditation, workforce, safety, transport, accommodation, participants, commercial, logistics, legal, comms, sustainability, KB, ops, marketplace, bookings, agency, marketing, insights, finance, procurement, production, people, projects, ai, inbox, files, forms, settings) | [src/app/(platform)/console/](<../src/app/(platform)/console/>) |
| `(portal)` GVTEWAY | 90      | External stakeholder portals — slug-gated. Personas: artist, vendor, client, sponsor, guest, crew, **delegation, media, vip, hospitality, volunteer, athlete** (last 6 are Olympic-scale additions per `scripts/routes.txt:431-484`)                                                                                                       | [src/app/(portal)/](<../src/app/(portal)/>)                     |
| `(mobile)` COMPVSS | 43      | Field-ops PWA: gate, scan, shift, check-in, incident, medic, safeguarding, alerts, driver, A&D, run-of-show, guard, WMS, punch, handover                                                                                                                                                                                                   | [src/app/(mobile)/](<../src/app/(mobile)/>)                     |
| `(ghxstship)`      | 15      | **Parent-co marketing surface** — separate brand (locked bermuda-triangle theme), out of ATLVS app scope; included for completeness                                                                                                                                                                                                        | [src/app/(ghxstship)/](<../src/app/(ghxstship)/>)               |

### Page-content reality (sample of `(platform)` shell)

| Bucket                 | Page count                                 |
| ---------------------- | ------------------------------------------ |
| Tiny (<30 lines)       | 66                                         |
| Small (30–99 lines)    | 292                                        |
| Medium (100–299 lines) | 182                                        |
| Large (300+ lines)     | 2                                          |
| **Total**              | **541 / 46,324 lines** (avg 86 lines/page) |

- **Redirect-only `page.tsx` defects (per memory `feedback_no_redirect_stubs.md`):** **0 found.** Memory rule observed.
- **`<PageStub>` placeholder pages:** **27** out of 777 (3.5%).

The 33% small + 54% medium tier population is the build-out frontier. Most are real but lightweight — list pages, simple detail pages, modest server-action wrappers. The 2 large pages (>300 lines) are major composite views (likely `/console/projects/[projectId]/page.tsx` and one other).

---

## Section 4 — Auth + RBAC ground truth

Per [reports/00_DISCOVERY.md §Roles](00_DISCOVERY.md) and the codebase:

- **`platform_role` enum** (10 values): owner, admin, manager, controller, collaborator, contractor, crew, client, viewer, community. **NOTE:** the prior UJV report listed `developer` as a value; the current `0001` snapshot has `manager` in that slot at [0001:389-402](../supabase/migrations/0001_remote_snapshot.sql:389). One of: enum was changed since prior audit, or prior audit cited an older enum. Material? — only if test plan addresses developer-role flows; new audit should rely on current enum.
- **`project_role` enum** (4 values): creator, collaborator, viewer, vendor. [0001:416](../supabase/migrations/0001_remote_snapshot.sql:416)
- **`tier` enum** (4 values): portal, starter, professional, enterprise. [0001:607](../supabase/migrations/0001_remote_snapshot.sql:607)
- **Persona resolution** — [src/lib/auth.ts](../src/lib/auth.ts) `personaForRole()` and `resolveShell()` route owner/admin/manager/controller/collaborator/developer to `/console`; client/contractor → `/p`; crew → `/m`; viewer/community → `/me`.
- **Capability matrix** in `src/lib/auth.ts CAPABILITIES`: owner/admin = `["*"]`; controller scoped to finance/ops; collaborator scoped to projects/advancing; rest narrow read-heavy.
- **RLS pattern:** `private.is_org_member(org_id)` + `private.has_org_role(org_id, roles[])` + `private.has_project_role(project_id, roles[])` + `private.is_project_member(project_id)` are the canonical RLS helpers.

---

## Section 5 — Lifecycle conformance (LDP overlay summary)

Full detail in [LDP_LIFECYCLE_AUDIT.md](LDP_LIFECYCLE_AUDIT.md), [LDP_NAMING_AUDIT.md](LDP_NAMING_AUDIT.md), [LDP_CONFLATION_FINDINGS.md](LDP_CONFLATION_FINDINGS.md), [LDP_SCHEMA_CONFORMANCE_REPORT.md](LDP_SCHEMA_CONFORMANCE_REPORT.md).

| LDP Lifecycle          | Verdict                    | Top issue                                                                                     |
| ---------------------- | -------------------------- | --------------------------------------------------------------------------------------------- |
| §1 Project             | PARTIAL                    | `xpms_phase` correct values; column-named-`xpms_phase` not `project_phase`; no transition log |
| §2 Production          | **FAIL**                   | No `production_phase` column anywhere; `fabrication_orders.status` is 4 coarse states         |
| §3 Asset               | PARTIAL                    | `equipment.status` typed enum but only 5/9 LDP states; no `asset_movements` ledger            |
| §4 Deliverable         | PARTIAL (closest to PASS)  | Wrong name + 2 missing states + transition log already exists ✓                               |
| §5 Engagement          | DISTRIBUTED (P2)           | Per-channel state in 4 tables; no unified `engagement_state` on `project_members`             |
| §6 Engagement-Document | PARTIAL                    | `offer_letters.status` strong; needs COUNTERSIGNED/ACTIVE/SUPERSEDED/VOIDED states            |
| §7 Financial Period    | **FAIL** (not implemented) | No `financial_periods` table                                                                  |
| §8 Subscription        | **FAIL** (not implemented) | No `subscriptions` table                                                                      |

**Naming compliance rate:** ~20% (~14/70 lifecycle-bearing columns LDP-name-correct).
**Conflation patterns confirmed strict:** P6 (financial period absent), P7 (subscription absent).

---

## Section 6 — Test harness ground truth

- **Playwright** already configured: `playwright.config.ts`, `playwright.audit.config.ts`, `e2e/audit/` matrix config + theme/responsive/snapshot specs.
- **Existing spec count:** 35+ spec files covering: a11y, API (10 specs), auth, audit log, booking canon, capability gating, chroma theme, CMS↔portal roundtrip, compliance flow, consent, forms (3 specs), handoff shells, i18n, marketing (2 specs), marketplace canon (2 specs), mobile, pagination, portal, RLS boundaries, roles, public-route smoke, SEO metadata.
- **CI integration:** `npm run e2e` script in [package.json](../package.json). UJV's prior run reported "847 passed / 25 env-gated skipped / 0 failed."
- **Auth fixtures:** not yet inspected in this Phase 0 run; deferred to Phase 2 prep.

**Implication:** the "install Playwright as a discrete commit" step authorized in turn 3 is a **no-op**. No install commit will be made. The test plan can build on existing fixtures.

---

## Section 7 — Environment + external creds

Per [reports/00_DISCOVERY.md §Tooling/External deps](00_DISCOVERY.md) — unchanged status as of this run unless `.env.local` was updated since:

| Service               | Required by            | Status (prior audit) | Phase 2 implication                   |
| --------------------- | ---------------------- | -------------------- | ------------------------------------- |
| Supabase URL + anon   | Everything             | ✅ SET               | OK                                    |
| Supabase service-role | Webhooks, admin flows  | ❌ NOT SET           | invite email send blocked             |
| Anthropic             | AI assistant streaming | ❌ NOT SET           | `/api/v1/ai/chat` returns 500 (no-op) |
| Stripe                | Invoicing, Connect     | ❌ NOT SET           | payment flows blocked                 |
| Resend                | Transactional email    | ❌ NOT SET           | `sendEmail` no-ops silently           |
| GrowthBook            | Feature flags          | ❌ NOT SET           | `FLAG_DEFAULTS` fallback              |
| Sentry                | Error tracking         | ❌ NOT SET           | OK; logs only                         |

Phase 2 will execute against this env. Third-party-dependent flows continue to be BLOCKED tier per UJV precedent — code paths verifiable, full round-trips not.

---

## Section 8 — Stop conditions check

Per E2E-LRP §STOP CONDITIONS:

- [x] **Required inputs missing or ambiguous** — RESOLVED in turn 3.
- [x] **Phase 0 reveals <50% of in-scope subsystems testable end-to-end** — NOT TRIGGERED. All in-scope subsystems are REAL with substantive UI.
- [x] **Seed teardown unsafe** — N/A (Phase 1 not yet entered).
- [x] **S1 defect found that cannot be safely contained** — NONE (audit-only Phase 0).
- [x] **Auth/financial/audit-log integrity defect** — NONE in audit; LDP-class findings are architectural, not integrity defects.
- [x] **Time budget exceeded with substantial coverage gap** — Phase 0 budget consumed; Phase 1 + 2 will require fresh budget.

Per LDP §STOP CONDITIONS:

- [x] **Schema audit reveals `status` columns on core entities** — TRIGGERED. 50+ instances. The protocol says "cannot proceed until split into proper lifecycle columns OR explicitly justified." Justification: this audit run is read-only; the migrations to fix are deferred per `LDP_REMEDIATION_PLAN.md`. **Decision needed before Phase 1 seed:** does the user accept the deferred remediation, or does the run pause until remediation lands? Surfaced in `PHASE_0_EXIT_SUMMARY.md`.

---

## Phase 0 exit

**Phase 0 deliverables landed:**

- ✅ [docs/XPMS_TO_ATLVS_MAPPING.md](../docs/XPMS_TO_ATLVS_MAPPING.md)
- ✅ [reports/E2E_GROUND_TRUTH_MAP.md](E2E_GROUND_TRUTH_MAP.md) (this file)
- ✅ [reports/LDP_LIFECYCLE_AUDIT.md](LDP_LIFECYCLE_AUDIT.md)
- ✅ [reports/LDP_NAMING_AUDIT.md](LDP_NAMING_AUDIT.md)
- ✅ [reports/LDP_CONFLATION_FINDINGS.md](LDP_CONFLATION_FINDINGS.md)
- ✅ [reports/LDP_REMEDIATION_PLAN.md](LDP_REMEDIATION_PLAN.md)
- ✅ [reports/LDP_SCHEMA_CONFORMANCE_REPORT.md](LDP_SCHEMA_CONFORMANCE_REPORT.md)
- ✅ `PHASE_0_EXIT_SUMMARY.md` (separate file with the decisions list)

**Recommendation:** see `PHASE_0_EXIT_SUMMARY.md` for the 6 decisions needed before Phase 1 seed generation begins.
