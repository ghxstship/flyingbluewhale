# Security Advisor Remediation Plan

**Project:** `flyingbluewhale` (`xrovijzjbyssajhtwvas`) · **Pulled:** 2026-06-30
**Scope:** 10 ERROR · 43 WARN · 4 INFO security lints.
**Run order:** AFTER the full prod e2e suite is green (no app defects). Each phase ends
with `get_advisors(security)` + the relevant e2e guard re-run; do not proceed if a fix
regresses the cross-tenant isolation suite.

> Guiding rule: the public marketplace surfaces are *intentionally* anon-readable, and
> several RPCs are *intentionally* SECURITY DEFINER. The goal is **RLS as the boundary +
> documented exceptions**, not blindly silencing lints. The 2026-06-25 hardening already
> fixed a CRITICAL anon cross-tenant view leak — treat the view lints with that caution.

---

## STATUS (2026-06-30, after the full prod e2e went green)
- **Phase 1a — DONE for 2/9 views** (`20260630140000_advisor_views_security_invoker_safe`):
  `public_talent_directory` + `public_agency_directory` flipped to `security_invoker`
  (verified anon row count identical: 5==5, 2==2). 2 of 10 ERRORs cleared.
- **Probe finding (prevented an outage):** a rollback probe (flip to invoker → count
  rows AS `anon` → rollback) showed **6 views DROP TO 0 rows for anon under invoker** —
  `public_vendor_directory` (4→0), `public_job_board` (4→0), `public_rfq_marketplace`
  (4→0), `public_open_calls` (11→0), `public_event_calendar` (6→0), `public_crew_directory`
  (4→0). Their base tables have no anon SELECT policy, so flipping blindly would have
  taken down the public marketplace. These need a published-gated anon policy on each
  base table FIRST. `public_work_orders` = 0 rows (can't verify by count yet).
- **The verified-safe method for the remaining 7:** for each view, add an anon SELECT
  policy on its base table(s) gated to match the view's published/public filter, then
  run the probe — **only convert if the invoker anon count EQUALS the definer count**
  (== ⇒ no leak AND no breakage). This hard check makes each conversion provably safe.
  Remaining gates to wire: vendors `is_public_profile`, crew_members `is_public_profile`,
  rfqs `visibility`/`public_slug`, open_calls + job_postings published state, events
  public flag, work_orders public flag. Do one view at a time, re-running
  `e2e/cross-tenant-isolation.spec.ts` after each.

## Phase 1 — ERRORS (highest risk, do first)

### 1a. `security_definer_view` ×9 — the `public_*` discovery views
`public_vendor_directory`, `public_job_board`, `public_rfq_marketplace`, `public_open_calls`,
`public_agency_directory`, `public_event_calendar`, `public_talent_directory`,
`public_crew_directory`, `public_work_orders`.

- **Why flagged:** a SECURITY DEFINER view runs as its owner (postgres), bypassing the
  querying user's RLS — so the view's own `WHERE status='published' / is_public` is the
  *only* gate. A single bad predicate leaks private rows to anon (exactly the class of the
  prior CRITICAL leak).
- **Fix (preferred):** for each view, confirm the base tables have RLS policies that grant
  `anon`/`authenticated` SELECT on *published/public* rows only, then
  `ALTER VIEW public.<v> SET (security_invoker = on);` so RLS — not the view body — is the
  boundary. (`v_inbox_items`, `public_work_orders`'s sibling pattern, and the v6 reports
  views already use `security_invoker`; mirror that.)
- **Fallback (only if invoker breaks a legitimate join/aggregate):** keep DEFINER, but
  (i) harden the `WHERE` to the published/public filter, (ii) `REVOKE ALL` then
  `GRANT SELECT` to `anon` explicitly, (iii) add a regression probe to
  `e2e/cross-tenant-isolation.spec.ts`, (iv) document the exception inline + here.
- **One migration**, view-by-view. **Verify:** `e2e/cross-tenant-isolation.spec.ts`
  (`--workers=1`, all negative probes must stay 404/empty) + re-pull advisors.

### 1b. `rls_disabled_in_public` ×1 — `public.spatial_ref_sys`
- **What it is:** the PostGIS SRID reference table (static public geodesy data, no tenant
  rows), owned by the `postgis` extension — RLS can't be added without owning it.
- **Decision:** ACCEPT with rationale (public reference data, read-only) **or** fold into
  Phase 3 by moving `postgis` to an `extensions` schema (removes it from the public-table
  lint set). Recommend ACCEPT + a one-line note; revisit only if `postgis` is moved.
  Optionally `REVOKE` write grants (it should already be read-only to app roles).

---

## Phase 2 — WARNINGS (review-and-decide; mostly intentional)

### 2a. SECURITY DEFINER functions executable by `anon` ×13 / `authenticated` ×24
Two intentional families plus extension noise:
- **Token-flow public functions (anon, KEEP + document):** `accept_offer_letter`,
  `decline_offer_letter`, `get_offer_letter_by_token`, `record_offer_letter_view`,
  `get_msa_by_token`, `sign_msa`, `record_msa_view`, `consume_proposal_share_link`,
  `redeem_event_ticket`, `redeem_guide_access_code`. These are designed for unauthenticated
  token redemption and do their own token validation. Action: confirm each validates its
  token before any write, then leave executable + document.
- **Privileged RPCs (authenticated, REVIEW each):** `accept_invite`, `create_org_with_owner`,
  `approve_time_off_request`, `award_onsite_points`, `compute_risk_scores_for_org`,
  `generate_wip_snapshot_for_project`, `crew_member_active_msa`, etc. SECURITY DEFINER is
  required (they cross RLS for a privileged op), but confirm each performs an internal
  `private.is_org_member` / `has_org_role` check. For any that should be trigger/service-only
  (not directly callable), `REVOKE EXECUTE ... FROM authenticated, anon` (the
  subcontractor `sub_invoice_requires_approved_wo` revoke is the template).
- **Extension functions (ACCEPT):** `st_estimatedextent` and other PostGIS/`pg_*` functions
  — extension-owned, not ours. Accept; they leave the list once extensions move (Phase 3).
- **Output:** one migration that REVOKEs execute on the genuinely-internal functions +
  inline `COMMENT ON FUNCTION` documenting the intentional public/token ones.
  **Verify:** persona e2e (token flows: offer-letter accept, ticket redeem, share-link;
  RPCs: invite accept, time-off approve) must still pass.

### 2b. `extension_in_public` ×5 — `postgis`, `ltree`, `vector`, `pg_trgm`, `pg_net`
- **Best practice:** extensions live in a dedicated `extensions` schema.
- **Risk:** moving `postgis` (and `vector`) post-hoc is high-risk — many dependent objects +
  `search_path` assumptions. **Recommend:** ACCEPT `postgis` + `vector` with a documented
  rationale (move-cost > benefit); evaluate moving the low-dependency ones (`ltree`,
  `pg_trgm`, `pg_net`) only if a clean `ALTER EXTENSION ... SET SCHEMA extensions` + a
  `search_path` sweep verifies green. Treat as LOW priority / optional.

### 2c. `auth_leaked_password_protection` ×1
- **Dashboard setting, not a migration.** Enable HaveIBeenPwned leaked-password protection:
  Supabase Dashboard → Authentication → Sign In / Providers (Password) → enable "Leaked
  password protection." (Known prior TODO from the beta hardening pass.) **Owner: admin.**

---

## Phase 3 — INFO (lowest priority; document or tidy)

### 3a. `rls_enabled_no_policy` ×4 — `private.cron_run_log`, `public.push_send_failures`, `public.webhook_events`, `public.xpms_catalog_staging`
- **What it means:** RLS is ON but there are no policies → **deny-all** to `anon` +
  `authenticated` (service-role bypasses RLS). For these system/internal/staging tables that
  deny-all is the *correct, secure* default — no app role should read them.
- **Action:** ACCEPT + document (a `COMMENT ON TABLE` noting "service-role only; deny-all by
  design"), **or**, to silence the lint, add an explicit restrictive policy
  (`CREATE POLICY "service only" ON ... USING (false)`). Recommend the comment-only route
  unless zero-lint is required.

---

## Execution checklist
1. Confirm full prod e2e is green (no app defects) — prerequisite.
2. Phase 1a migration (views → `security_invoker`, view-by-view) → `cross-tenant-isolation`
   e2e + `get_advisors` (errors should drop 9 → 0 for views).
3. Phase 1b decision (accept `spatial_ref_sys` or defer to Phase 3 ext-move).
4. Phase 2a migration (revoke internal-only fns + comment intentional ones) → persona e2e
   (token + RPC flows).
5. Phase 2b decision (accept postgis/vector; optionally move ltree/pg_trgm/pg_net).
6. Phase 2c — admin enables leaked-password protection in the dashboard.
7. Phase 3a — comment/policy the 4 deny-all tables.
8. Final `get_advisors(security)` → target: 0 ERROR, WARN reduced to documented exceptions,
   INFO documented. Update `[[project-db-advisor-remediation]]` + this file with the outcome.

## Migrations to author (applied via Supabase MCP `apply_migration`, mirrored to `supabase/migrations/`)
- `*_advisor_views_security_invoker.sql` (Phase 1a)
- `*_advisor_revoke_internal_funcs.sql` (Phase 2a)
- `*_advisor_document_denyall_tables.sql` (Phase 3a, if policy route)
- (optional) `*_advisor_move_extensions.sql` (Phase 2b, low-dependency exts only)
