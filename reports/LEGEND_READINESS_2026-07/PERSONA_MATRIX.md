# L-RECON · LEG3ND Persona × Workflow Coverage Matrix

Date: 2026-07-23 · Repo state: main @ c863b7f6 · Scope: `src/app/(legend)/**` + legend libs + `/studio/knowledge` + `/m/docs` remnants + `e2e/legend-*.spec.ts`.
Goal fixture: "LEG3ND deployment-ready with ALL workflows for EVERY role and persona."

---

## 1. Personas — the real set

Canonical persona enum (`src/lib/supabase/types.ts:32`): `visitor · guest · owner · admin · manager · member · collaborator · contractor · crew · client · viewer · community`. App-rail reach (`src/lib/entitlements.json#personas`): `learner` lands on legend "full"; `crew`/`operator` get legend "ro".

**Finding P-0 (structural): inside `/legend` the 12 personas collapse to exactly FOUR effective bands.** Every gate in the shell is `requireSession()` (any authed org member), `isManagerPlus(session)` (owner/admin/manager + controller band), or `isAdmin(session)` (brand only). `session.persona` is consulted **only** by `/legend/start` (`persona === "guest"` = "no real org yet", `src/app/(legend)/legend/start/page.tsx:59`) and by the App Rail. There is no INSTRUCTOR/AUTHOR role anywhere — authoring, where it exists, is the manager+ band. The `learner` entitlements persona is a rail concept, not a gate.

Matrix columns therefore use the effective bands, with the persona→band mapping:

| Band | Personas mapped in | Gate |
|---|---|---|
| **ANON** | visitor | no session; layout renders public funnel (`(legend)/layout.tsx:20-25`) |
| **AUTH** (learner band) | guest, member, crew, collaborator, contractor, client, viewer, community | `requireSession()` only |
| **MGR** | manager, owner, admin (+controller via `MANAGER_BAND_ROLES`) | `isManagerPlus()` |
| **ADMIN** | owner, admin | `isAdmin()` (org branding only) |

**Finding P-1 (SHOULD):** read-only personas (`viewer`, `client`, `community` — "no write capabilities" per the type docblock) pass every learner write gate: enroll, post to community, register for sessions, redeem vouchers, request recerts. RLS is deliberately membership-banded (`src/lib/legend-learner-rls-canon.test.ts` locks 7 learner-write policies to `is_org_member` + self-id), so the persona claim "read-only stakeholder" is not enforced anywhere in this shell. Consistent with the RLS canon, inconsistent with the persona contract / entitlements "ro" reach.

**Finding P-2 (SHOULD):** `entitlements.json` declares LEG3ND `publicSurfaces: ["/legend", "/legend/catalog"]` — **`/legend/catalog` is not a route** (the catalog is `/legend/learn`; the priced-URID catalog is `/legend/hub/catalogs`, session-gated). Contract drift.

**Finding P-3 (SHOULD):** `LegendSidebar` renders the full `legendNav` unfiltered to every band — the MANAGE group (Console/XMCE/Recert Matrix) is shown to learners (click → AccessDenied), and the entire authed nav is shown to ANON (click → /login bounce). No role/session filter (`src/components/legend/LegendSidebar.tsx`, `src/lib/nav.ts#legendNav`).

---

## 2. The matrix

Legend: ✅ EXISTS · ◐ PARTIAL · ✗ MISSING · — not applicable to that band (correctly denied/blocked is ✅ for that cell: the gate itself is the deliverable). Evidence paths relative to `src/app/(legend)/legend/` unless noted.

### A. Org onboarding & Hub pillars (owner/admin configures the org)

| Workflow | ANON | AUTH | MGR | ADMIN | Evidence / gap |
|---|---|---|---|---|---|
| A1 `/start` onboarding wizard (org, positions, finance codes, locations, catalog, invites) | ✅ bounce | ✅ guest-aware | ✅ | ✅ | `start/page.tsx`, `start/actions.ts` (steps manager-gated; invites via `invites` + email); e2e `legend-onboarding-gate.spec.ts` |
| A2 Hub overview | — | ✅ read | ✅ | ✅ | `hub/page.tsx` (live counts) |
| A3 Brand studio | — | ✅ read | ✅ read | ✅ write | `hub/brand/actions.ts:21` `isAdmin` |
| A4 Positions (org chart) CRUD | — | ✅ read | ✅ CRUD | ✅ | `hub/organization/actions.ts:40,69,100` |
| A5 Finance codes (cost centers) CRUD | — | ✅ read | ✅ CRUD | ✅ | `hub/finance-codes/actions.ts:47,75,96` |
| A6 Locations + geofences CRUD | — | ✅ read | ✅ CRUD | ✅ | `hub/locations/**` (create/edit/geofence actions) |
| A7 Master catalog (priced atoms/URIDs) CRUD + special-order approval | — | ✅ read | ✅ CRUD | ✅ | `hub/catalogs/**` (`master_catalog_items`, `unit_cost_cents`, pending-approval lens) |
| A8 Templates hub (job templates CRUD; field-template/advance-preset counts) | — | ✅ read | ✅ job-templates CRUD | ✅ | `hub/templates/**`; field templates + advance presets are count tiles linking out — job templates are the only in-shell authoring |

### B. Learning spine (learner)

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| B1 Browse catalog | ✅ sample preview | ✅ real org catalog | ✅ | `learn/page.tsx` (anon → `learn/sample.ts` preview funnel) |
| B2 Course detail + enroll | ✅ sample redirect | ✅ | ✅ | `learn/[course]/page.tsx`, `CourseEnroll` → `course_enrollments` insert |
| B3 Lesson consume / progress / complete (+points) | ◐ sample | ✅ | ✅ | `learn/actions.ts:50-127` (`lesson_progress` upsert, enrollment pct, `points_ledger`) |
| B4 Quiz / assessment attempt (server-scored) | — | ✅ | ✅ | `learn/actions.ts:179-` (`assessment_attempts`, `QuizRunner`/`AssessmentRunner`) |
| B5 Certification issuance on pass | — | ✅ auto | ✅ | `learn/actions.ts:227` `certification_holders` upsert via `grants_certification_id` |
| B6 Course reviews | — | ✅ | ✅ | `learn/[course]/review-actions.ts` → `legend_course_reviews` |
| B7 Learning Path (sequential units) | — | ✅ | ✅ | `path/page.tsx` (derived from published courses + own enrollments) |
| B8 My Learning / Progress / transcript | — | ✅ | ✅ | `my-learning/page.tsx`, `progress/page.tsx` |
| B9 **Course/lesson/quiz AUTHORING (create → edit → publish)** | — | ✗ | ✗ | **MISSING everywhere.** Zero `insert/update/upsert` against `legend_courses`, `lessons`, `assessments`, `assessment_questions` in all of `src/` (verified by grep). Content exists only via seed migrations (`20260623215805_legend_learning_lms.sql`, `20260625161724_legend_seed_test_professional_org.sql`). The for-institutions page *sells* "Author courses" (`for-institutions/page.tsx:21`) — the product cannot do it. `/studio/workforce/courses` was removed as "LEG3ND-only". **BLOCKER B-1** |

### C. Certifications & recertification

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| C1 Cert wallet (own holdings) | — | ✅ | ✅ | `certifications/page.tsx` |
| C2 Holder detail + print artifact | — | ✅ | ✅ | `certifications/[holderId]/page.tsx` + `PrintButton` |
| C3 **Public verification** | ✅ | ✅ | ✅ | `certifications/[holderId]/verify/page.tsx` — anon-safe `verify_certification` SECURITY DEFINER RPC, live effective-state computation. One of only two true public data surfaces |
| C4 Recert **request** | — | ✅ | ✅ | `certifications/actions.ts:33` → `certification_recerts` (state=requested) |
| C5 **Recert processing/approval** | — | — | ✗ | **MISSING.** `certification_recerts` is written once and **never read anywhere** in `src/` (only other reference is an RLS canon test). The learner's request is a dead letter: no queue, no approve/deny action, no state machine consumer. The `/legend/compliance` Recert Matrix reads `certification_holders` only. **BLOCKER B-3** |
| C6 Cert-type definitions (which credentials exist, recert windows) | — | ✗ | ✗ | **MISSING** — no writes to `legend_certifications`; seed-only. Part of **BLOCKER B-1/B-5** |

### D. Live sessions

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| D1 Browse sessions + capacity/waitlist register + cancel | — | ✅ | ✅ | `live/page.tsx`, `live/actions.ts` → `legend_session_registrations`; e2e covered |
| D2 **Session authoring (schedule/host/cancel a session)** | — | — | ✗ | **MISSING** — no writes to `legend_live_sessions` anywhere; seed-only forward-dated sessions. **BLOCKER B-2** |

### E. Gamification & store

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| E1 Points earn + leaderboard (Arena) | — | ✅ | ✅ | `points_ledger` written on lesson complete + community; `leaderboard/page.tsx` real |
| E2 Badges/achievements **earning** | — | ◐ | ◐ | `badges/page.tsx` renders the achievement gallery + "earned" state, but **`achievement_awards` is never inserted** app-side and the gamification migration ships no award trigger — badges can never be earned outside seed rows. Display-only promise. **SHOULD S-1** |
| E3 Crew standings | — | ◐ read | ◐ read | `crew/page.tsx` ranks `legend_crews` by member points; **no create/join/leave crew anywhere** (no writes to `legend_crews`/`legend_crew_members`). **SHOULD S-2** |
| E4 Buy credits (Stripe checkout) | — | ✅ | ✅ | `store/BuyButton.tsx` → `/api/v1/stripe/credits-checkout` |
| E5 Voucher redeem | — | ✅ | ✅ | atomic `redeem_voucher` RPC (`store/actions.ts`) — e2e covered |
| E6 **Credit SPEND (fulfillment)** | — | ✗ | ✗ | **MISSING.** Store subtitle promises "Buy credits for courses, exams, and resources" — nothing in `src/` ever debits `credit_ledger` (only voucher/purchase credits). Credits are purchasable **and unusable**. Real-money dead end. **BLOCKER B-4a** |
| E7 **Store admin (stock products, mint vouchers)** | — | — | ✗ | **MISSING** — no writes to `credit_products` / `vouchers`; an org owner cannot stock their own store. Seed-only. **BLOCKER B-4b** |

### F. Community

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| F1 Feed: post (discussion/question) + points | — | ✅ | ✅ | `community/actions.ts` (`community_posts` + `points_ledger`) |
| F2 Post detail: comment, react, accept answer | — | ✅ | ✅ | `[postId]/page.tsx` (`MANAGER_BAND_ROLES` consulted for moderation affordances) |
| F3 Members directory | — | ✅ | ✅ | `community/members/page.tsx` |
| F4 Moderation (delete/lock others' posts) | — | — | ◐ | accept-answer + manager band present; no explicit remove/lock surface — NICE |

### G. Knowledge base ("The Standard") — cross-shell

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| G1 Author article | — | ✅ | ✅ | **lives in `/studio/knowledge`** (`(platform)/studio/knowledge/new`) — the legend landing tile links out via `urlFor("platform", "/knowledge")` (`page.tsx:34`). Any org member can author; verify is manager+ |
| G2 Verify / re-verify cadence | — | — | ✅ | `studio/knowledge/[slug]/actions.ts:15` (`isManagerPlus`, verified_at/by + audit row) |
| G3 Must-read acknowledgements | — | ✅ | ✅ | **lives in `/m/docs`** (`(mobile)/m/docs/actions.ts` — `must_read` SOP ack + audit) |
| G4 Search | — | ◐ | ◐ | tag filter only (`?tag=` on `studio/knowledge/page.tsx`); no full-text search. **SHOULD S-3.** Note the KB is a `/studio`+`/m` capability, not a `/legend` one — a pure legend-subdomain learner never sees it in `legendNav` |

### H. XMCE compliance engine (manager+ consumer)

| Workflow | AUTH (member) | MGR | Evidence / gap |
|---|---|---|---|
| H1 Rules register + CRUD | ✅ AccessDenied (page-gated) | ✅ | `engine/rules/**` (page + action both `isManagerPlus`) — e2e round-trip |
| H2 Run engine | ✅ denied | ✅ | `engine/runs/actions.ts:34` |
| H3 Run detail + findings | ✅ denied | ✅ | `engine/runs/[id]` + `FindingsTable` |
| H4 Findings triage / remediation | ✅ denied | ✅ | `engine/runs/actions.ts:115` (triage action) — e2e covered |
| H5 Recert Matrix | ✅ denied | ✅ | `compliance/page.tsx:63` |

### I. Signage & resources

| Workflow | ANON | AUTH | MGR | Evidence / gap |
|---|---|---|---|---|
| I1 Signage register browse + SignPanel preview | ✅ bounce | ✅ | ✅ | `signage/page.tsx` (org register, session-gated by design — public reference content is the AIGA sprite itself) |
| I2 Sign create/edit/state transitions | — | ✅ form renders, action refuses | ✅ | `signage/actions.ts:32,59,108` — **action-gated only** (page renders to members; e2e asserts the refusal). Inconsistent with the engine's page-gating. **SHOULD S-4** |
| I3 Placements (install register) | — | ◐ | ✅ | `[signId]/placements/new` |
| I4 Print/export a sign artifact | — | ✗ | ✗ | no print/export affordance on signage (certs have `PrintButton`; signs do not) — NICE |
| I5 Resources hub: browse/detail | — | ✅ | ✅ | `resources/**` |
| I6 Resource CRUD + publish + collections | — | ✅ form renders, action refuses | ✅ | `resources/actions.ts:32,60,90,107`, `collections/actions.ts` — same action-gated-only pattern as I2 |

### J. Account & misc

| Workflow | ANON | AUTH | MGR | Evidence |
|---|---|---|---|---|
| J1 Profile (identity, points, awards) | — | ✅ | ✅ | `profile/page.tsx` |
| J2 Architecture explainer | — | ✅ | ✅ | `architecture/page.tsx` |
| J3 For Institutions (B2B capture) | ✅ | ✅ | ✅ | `for-institutions/page.tsx` (fully public) |
| J4 Landing `/legend` | ✅ | ✅ | ✅ | `page.tsx` (public tiles) |
| J5 Training console (roster KPIs + course assignment) | — | ✅ denied | ✅ | `console/page.tsx:38` page-gated; `assignCourseAction` upserts enrollment — e2e covered |

---

## 3. Cell counts

Counting the 38 workflow rows above across their applicable bands (— cells excluded; "correct denial" counted EXISTS):

- **EXISTS: 30 rows** fully green for every applicable band
- **PARTIAL: 5 rows** — E2 badges (never earnable), E3 crews (read-only), G4 KB search (tag-only), I3/I4 signage placements/print, F4 moderation
- **MISSING: 7 rows** — B9 course authoring, C5 recert processing, C6 cert-type authoring, D2 session authoring, E6 credit spend, E7 store admin, plus the `/legend/catalog` route drift (P-2)

The pattern is unmistakable: **every learner-consume loop is complete and e2e-proven; every "who makes the content?" loop is absent.** LEG3ND today is a read/consume product whose entire supply side is seed migrations.

---

## 4. BLOCKER list (deployment-ready = a real org can run LEG3ND without SQL)

| # | Blocker | What's concretely absent | Files that would anchor the fix |
|---|---|---|---|
| **B-1** | **Course/lesson/assessment authoring lifecycle** | No surface, action, or API writes `legend_courses` / `lessons` / `assessments` / `assessment_questions` — create, edit, publish, archive all impossible in-app. The instructor/author persona has no home (no role either — manager+ is the natural band). Marketing promises it (`for-institutions/page.tsx:21`) | `learn/**` (reads exist), seed `20260623215805` shows the shape |
| **B-2** | **Live-session authoring** | `legend_live_sessions` has zero app writers — no schedule/edit/cancel-as-host. Registration UX is complete against seed data only | `live/**` |
| **B-3** | **Recert processing** | `certification_recerts` insert-only; no queue/read/approve surface anywhere. Learner-visible "Recert requested" confirmation leads nowhere — a silent dead-end in a compliance product | `certifications/actions.ts:33`, `compliance/page.tsx` (natural home) |
| **B-4** | **Store economy is open-loop** | (a) nothing debits `credit_ledger` — purchased credits can never be spent; (b) no admin surface writes `credit_products` / `vouchers` — orgs can't stock the store. Real Stripe money in, nothing out | `store/**`, `api/v1/stripe/credits-checkout` |
| **B-5** | **Certification-type definitions** | `legend_certifications` (the credential catalog + recert windows) is seed-only — an org can't define the credentials it certifies | `compliance/page.tsx:72` reads it |

SHOULD (pre-GA, not launch-blocking): S-1 achievements never awardable (no engine/trigger) · S-2 crews read-only · S-3 KB search tag-only + KB/must-read live outside the legend shell nav · S-4 signage/resources authoring is action-gated only while engine/console are page-gated (inconsistent denial UX) · P-1 read-only personas can write · P-2 `/legend/catalog` entitlements drift · P-3 unfiltered sidebar · single shell-level `loading.tsx` (no per-route boundaries under heavy pages like leaderboard/compliance).

NICE: signage print/export · community moderation tools.

---

## 5. Cross-cutting audits

- **RLS/gating consistency: PASS with the P-1 caveat.** Learner writes membership-banded and guarded by `src/lib/legend-learner-rls-canon.test.ts` (7 policies); manager gates duplicated page- and action-side for engine/console/compliance; signage/resources rely on action+RLS only (S-4). Brand correctly `isAdmin`. Voucher redemption is an atomic RPC (double-credit safe). Public cert verify goes through a scoped SECURITY DEFINER RPC exposing paper-cert columns only.
- **Empty-state honesty: PASS.** Surfaces read live tables and render `EmptyState`/`ConfigureSupabase`; no fabricated numbers found. The dishonesty is subtler: pages *promise* actions the product lacks (badges "earn", store "buy credits for courses", institutions "author courses").
- **Loading boundaries: PARTIAL.** One `(legend)/loading.tsx` for the whole shell; no per-route boundaries.
- **i18n: PASS.** All 55 `page.tsx` files under `(legend)` import `getRequestT`; client islands use `useT`. No stragglers found.
- **e2e coverage** (`e2e/legend-*.spec.ts` → matrix cells): `legend-personas` — crew+owner full `legendNav` render sweep + B2/B3/B4 (enroll/lesson/quiz), F1, D1, E5, I6-create, J5-assign · `legend-coverage` — F2 (comment/accept), D1 cancel, H2/H4, H-member-denial · `legend-deep-coverage` — H1 round-trip, H3, I1/I2/I3 + sign state, H5 grid, I6 collections, C4, E5-balance, member gates for I2/H1 · `legend-xmce` + `legend-signage` — H1/I2 CRUD · `legend-onboarding-gate` — A1 shell + COMPVSS join-only. **Uncovered cells:** all ANON funnel cells (J4, B1-sample, C3 verify, J3), E4 checkout, E1/E2 leaderboard/badges, B7/B8 path/progress, all Hub pillars A2–A8, G1–G3 knowledge, F3 directory. Fixture set is crew+owner only — no manager, viewer, community, contractor, client, or guest fixture ever touches `/legend`.

---

## 6. Bottom line

The learner consume-side (browse→enroll→lesson→quiz→certify + community + live + store-redeem) is genuinely deployment-grade: real data, correct gates, RLS-canon-guarded, e2e-proven for two personas. The product is **not** deployment-ready against the stated goal because five supply-side workflows (B-1..B-5) do not exist for ANY persona — content, sessions, credentials, recert processing, and store stock all require SQL seeds. Closing B-1 (course authoring, manager+ band, mirroring the resources-hub CRUD pattern) is the single highest-leverage move; B-3 and B-4 are small surfaces (a queue page + a store-admin page + a spend RPC) with outsized honesty impact.
