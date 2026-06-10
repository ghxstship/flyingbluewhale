# Deployment Readiness Validation — Phase 1: Scope Inventory

**Date:** 2026-06-09 · **Branch:** main @ e4071350 · **Status:** MATRICES PRESENTED — awaiting approval to begin Phase 2 browser validation.

Precondition: the full 8-phase hardening audit (reports/AUDIT_2026-06-09_HARDENING_PLAN.md) is complete and pushed — tsc 0 errors, 656/656 unit tests, eslint clean, production build green, live DB schema fully LDP-conformant.

## 1. Test Inventory — 104 Workflows

(Compiled from src/lib/nav.ts, the route tree, and every actions.ts. Full table maintained here; IDs are stable for the Coverage Matrix.)

W1 Signup+verify · W2 Login+next deep link · W3 Magic link · W4 Forgot/reset · W5 MFA enroll+challenge · W6 Invite accept (org+project) · W7 Org bootstrap · W8 SSO/OAuth+WebAuthn · W9 Logout+cross-subdomain session · W10 Profile/preferences/saved searches · W11 Notifications+push matrix · W12 Account delete/restore/export · W13 Personal PATs+scopes · W14 Workspace switcher · W15 Project CRUD+archive · W16 Project members · W17 Project branding · W18 Assignment create · W19 Fulfillment transitions · W20 Assignment details/reassign/comment · W21 Scan-code bind+gate scan · W22 My assignments (3 shells) · W23 Deliverable lifecycle · W24 PortalDocVault · W25 Leads→pipeline · W26 Clients · W27 Proposal authoring · W28 Public proposal sign · W29 Client portal proposal gates/approvals/revisions/COs · W30 Invoice lifecycle · W31 Expenses · W32 Budgets+import · W33 Pay apps · W34 Draws · W35 Accounting periods · W36 Time+mileage · W37 Lien waivers/payroll/AP-OCR · W38 Stripe billing+subscription state · W39 Vendors+prequal+scorecard · W40 Requisitions+leveling · W41 PO+checklist+COs · W42 RFQ publish→vendor bid · W43 WO broadcasts · W44 Public marketplace browse · W45 Gig apply · W46 Open-call submit · W47 Inquiries · W48 Console ATS · W49 Calls+submission review · W50 Talent EPK+riders · W51 Booking offers (two-sided) · W52 Reviews bidirectional · W53 My applications/submissions/availability · W54 Marketplace settings · W55 Time-off request→decide→balance · W56 Shift swaps · W57 Courses→quiz→badge · W58 Kudos+badges · W59 New-hire onboarding · W60 Workforce records · W61 Offer letters (tokened) · W62 MSA sign · W63 Org invites+people+offboard · W64 Announcements→feed · W65 Chat (mobile+portal AM threads) · W66 Polls · W67 Surveys · W68 Mobile clock (geofence) · W69 Incidents (quick/full/medic) · W70 Personal docs · W71 Tasks/daily log/handover · W72 Dispatch+driver runs · W73 Equipment/check-in scans · W74 Mobile role switch · W75 Service desk · W76 Portal resolution+persona homes (15) · W77 Boarding Pass guides E2E · W78 Guest tickets+wallet · W79 Vendor portal ops · W80 Settlements+co-pro+phase approvals · W81 Holds/tours/agency · W82 Org settings core · W83 Org API keys+rate limits · W84 Webhook endpoints · W85 Integrations (QB/Slack/ticketing/FX/partner) · W86 Master catalog · W87 Account managers→AM thread · W88 Settings misc (SSO/sequences/SLA/zones) · W89 Imports · W90 Exports · W91 Automations (4 trigger kinds) · W92 AI chat · W93 Dashboards · W94 Schedule/baselines/CPM/Gantt · W95 Site plans/stage plots/markups · W96 RFIs/submittals/transmittals/specs · W97 Inspections+punch · W98 Safety registers · W99 Programs governance · W100 Events/meetings/venues/accreditation · W101 Production assets+ROS · W102 Logistics/accommodation/transport · W103 Share links+public forms · W104 Knowledge base

### Failure-path classes (each tested at least once against a representative workflow)

F1 Validation error + value restore · F2 Unauthorized role write (UI + direct POST) · F3 Cross-tenant isolation (id + slug) · F4 Unauthenticated deep link → next-param round trip · F5 Empty states · F6 Illegal state transition from stale tab · F7 Concurrent-edit conflict · F8 Duplicate/idempotency (double-submit, rescan, webhook replay) · F9 Offline queue (punch + scans) · F10 Rate limiting 429 · F11 Expired/invalid tokens · F12 Per-kind push opt-out · F13 Upload failures + dead signed URLs · F14 External-service degradation (Stripe/Anthropic/QB down) · F15 Soft-delete visibility · F16 Last-owner/MFA self-lockout guards

## 2. Role Matrix (extracted from code)

**PlatformRole capability bands** (src/lib/auth.ts CAPABILITIES; persona overlay wins when present):

- owner / admin → `*` (admin additionally gates invites, billing:write, payouts:write via isAdmin)
- manager → projects/tasks/schedule/crew/proposals/clients:_ + invoices:read+write, expenses:_, budgets:read, time/mileage/procurement:\* — NO billing/payouts/budgets:write/org admin
- member → projects:read, tasks:read+write, time:write, check-in:\*

**Persona overlay** (replaces role band entirely): collaborator (projects/tasks/schedule/crew:_ + reads), contractor (read+tasks+time), crew (check-in:_ + tasks + time), client (reads only), viewer (reads only), community (zero). guest/visitor → fall through to member with no org.

**Shell routing:** owner/admin/manager/collaborator→/console · client/contractor→/p · crew→/m · viewer/community/member/guest/visitor→/me.

**ProjectRole** (lead/editor/contributor/viewer/vendor): currently a managed LABEL — no RLS policy or app code differentiates the five values; membership itself grants project-scoped reads; manager+ bypass verified org-pinned.

**PAT scopes:** assertScope wildcard semantics (undefined/[]/["*"]); 12 distinct capability strings asserted across routes.

**Tier:** not consulted by can(); feature flags + billing display only.

### Seeded test accounts

- `test+{owner,admin,viewer,crew,client,contractor,community,collaborator,controller,developer}@flyingbluewhale.app` / FlyingBlue!Test2026 (4 test orgs)
- MISSING fixtures: `test+manager@`, `test+member@` (was service-role-blocked) → demo-org stand-ins exist: `mgmt@gvteway.test` (manager), `crew@gvteway.test` (member) / CompvssTest2026!
- No seeded account per the 15 PortalPersona rail variants (persona set per membership; reachable by re-personaing a fixture via SQL).

### Findings already logged from inventory (pre-Phase-2)

- P1-A (MAJOR candidate): `/console/settings/billing` and `/console/settings/api` render for any authed session (requireSession only) — nav hiding is the only view gate; mutations ARE server-gated. Verify + remediate in Phase 4.
- P1-B (note): `(platform)/layout.tsx` gates on session only — persona/shell enforcement is per-page/RLS. Verify a `client`-persona direct /console load leaks nothing beyond chrome.
- P1-C (note): `controller`/`developer` personas exist in seeds + RLS arrays but not the TS Persona union — verify they resolve sanely.

## 3. Coverage Matrix

Axes: 104 workflows × 12 testable principals (anon, guest, member*, crew, contractor, client, viewer, community, collaborator, manager*, admin, owner) — \*manager/member via demo-org accounts until fixtures are seeded.

Cell semantics per the protocol: TESTABLE (role is in the workflow's authorized set — happy path + ≥1 failure path), N/A-DENY (role lacks access — verify the denial is graceful: no crash, no data leak, actionable message), BLOCKED (note why).

Compressed authorized-role sets (full per-cell results recorded during Phase 2):

- Auth/personal (W1-14): all principals; anon only W1-4, W8.
- Console operator workflows (W15-43, W80-104): owner/admin/manager TESTABLE; collaborator TESTABLE on projects/tasks/schedule/crew subsets; member/crew/contractor/client/viewer N/A-DENY (must verify denial); anon N/A-DENY (login redirect + next).
- Admin-gated settings (W82-88 + W38, W54): owner/admin TESTABLE; manager N/A-DENY except manager-band items (exports/imports/automations/compliance/email templates TESTABLE).
- Marketplace public (W44-47): anon + community TESTABLE; apply/submit (W45-46) any authed principal.
- /me marketplace (W50-53): the applying/submitting principal.
- Mobile field (W55-75): crew TESTABLE (+ member stand-in); manager+ for decide sides; others N/A-DENY.
- Portal (W22, W24, W29, W76-80): per-PortalPersona — client persona for client workflows, vendor persona account needed for W79 (re-persona a fixture), guest for W78.
- BLOCKED (current): W8 SSO (needs provider config) · W85 QuickBooks/Slack live OAuth (sandbox creds) · W38 full Stripe checkout round trip (test-mode keys present? verify) · W37 payroll state XML (fixture data) — each to be unblocked or justified in Phase 2.

## 4. Phase 2 execution plan (on approval)

Browser sessions via the preview server + Playwright-driven role logins; per-cell evidence notes; console/network error capture on every step; remediation per the Phase 4 gated loop; final report appends results + verdict to this document.
