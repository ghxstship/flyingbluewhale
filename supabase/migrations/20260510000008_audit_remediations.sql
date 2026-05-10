-- ============================================================================
-- Audit Remediations — 2026-05-10
--
-- Addresses all findings from the comprehensive migration audit:
--
--   A. LDP Naming: rename `status` columns (banned post-0001) in 7 tables
--      introduced by 0002_marketplace_canon and 0003_booking_canon.
--      Affected views are recreated with updated column references.
--
--   B. Foreign-key index coverage: 40+ missing FK indexes on columns
--      introduced by 0002/0003 that were missed by the two prior FK-index
--      sweeps (20260509100001 and 20260509100010).
--
--   C. Security: re-assert REVOKE + GRANT on the three offer-letter
--      SECURITY DEFINER functions. Migration 20260509070000 used DROP TYPE
--      + CREATE TYPE, which drops and implicitly recreates all dependent
--      functions, resetting their ACLs to PostgreSQL defaults (PUBLIC gets
--      EXECUTE). The original 0001 snapshot had REVOKE ALL FROM PUBLIC;
--      GRANT TO service_role — those grants must be re-applied.
--
--   D. 3NF: talent_profiles.agent_name/agent_email transitive dependency
--      documented with COMMENT. Full normalisation deferred to Wave 3
--      (requires app-code changes for an agents table).
--
-- Implementation notes:
--   - Column renames: DO $$ ... END $$ guards make each rename idempotent
--     (skips if the column was already renamed).
--   - Views: PostgreSQL stores column names by reference; renaming a column
--     invalidates any view that selects it. Affected views are dropped and
--     recreated below.
--   - Indexes: CREATE INDEX IF NOT EXISTS keeps the migration re-runnable.
--   - All DDL is idempotent. Safe to re-run.
-- ============================================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_min_messages = warning;
SET search_path = public, private, extensions;

-- ============================================================================
-- A. LDP Naming: rename `status` → `*_phase` / `*_state`
--
-- Lifecycle character determines the suffix:
--   *_state  — cyclical / reversible (can go back-and-forth)
--   *_phase  — sequential one-way macro arc
-- ============================================================================

-- ── open_calls.status → open_call_state ─────────────────────────────────────
-- Rationale: draft→published→closed→awarded/cancelled. Can be re-opened from
-- closed or re-published from draft — cyclical → *_state.
DO $$ BEGIN
    ALTER TABLE public.open_calls RENAME COLUMN status TO open_call_state;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.open_calls.open_call_state IS
    'LDP §marketplace Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Cyclical state machine: '
    'draft→published→closed→{awarded,cancelled}.';

-- ── open_call_submissions.status → submission_phase ─────────────────────────
-- Rationale: submitted→shortlisted→{rejected,awarded,withdrawn}. One-way arc
-- (withdrawn/rejected/awarded are terminal) → *_phase.
DO $$ BEGIN
    ALTER TABLE public.open_call_submissions RENAME COLUMN status TO submission_phase;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.open_call_submissions.submission_phase IS
    'LDP §marketplace Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Sequential phase: '
    'submitted→shortlisted→{rejected,awarded,withdrawn}.';

-- ── talent_offers.status → talent_offer_state ───────────────────────────────
-- Rationale: sent⇄countered is reversible → *_state.
DO $$ BEGIN
    ALTER TABLE public.talent_offers RENAME COLUMN status TO talent_offer_state;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.talent_offers.talent_offer_state IS
    'LDP §marketplace Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Cyclical: draft→sent⇄countered→'
    'accepted→contracted. declined/cancelled are terminal.';

-- ── job_postings.status → job_posting_phase ─────────────────────────────────
-- Rationale: draft→published→closed→archived. One-way → *_phase.
DO $$ BEGIN
    ALTER TABLE public.job_postings RENAME COLUMN status TO job_posting_phase;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.job_postings.job_posting_phase IS
    'LDP §marketplace Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Sequential phase: '
    'draft→published→closed→archived.';

-- ── job_applications.status → job_application_phase ─────────────────────────
-- Rationale: new→reviewed→phone→{booked,pass,hold,withdrawn}. Hiring funnel
-- is a one-way progression → *_phase.
DO $$ BEGIN
    ALTER TABLE public.job_applications RENAME COLUMN status TO job_application_phase;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.job_applications.job_application_phase IS
    'LDP §marketplace Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Sequential hiring funnel: '
    'new→reviewed→phone→{booked,pass,hold,withdrawn}.';

-- ── settlements.status → settlement_state ───────────────────────────────────
-- Rationale: disputed↔reconciling is reversible → *_state.
DO $$ BEGIN
    ALTER TABLE public.settlements RENAME COLUMN status TO settlement_state;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.settlements.settlement_state IS
    'LDP §booking Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Cyclical: draft→reconciling→final '
    'or disputed↔reconciling.';

-- ── tours.status → tour_phase ───────────────────────────────────────────────
-- Rationale: planning→routing→confirmed→complete/cancelled. One-way → *_phase.
DO $$ BEGIN
    ALTER TABLE public.tours RENAME COLUMN status TO tour_phase;
EXCEPTION WHEN undefined_column THEN NULL; END $$;

COMMENT ON COLUMN public.tours.tour_phase IS
    'LDP §booking Lifecycle. Renamed from status (banned post-0001) '
    'by audit remediation 2026-05-10. Sequential phase: '
    'planning→routing→confirmed→{complete,cancelled}.';


-- ── Recreate views that referenced the renamed columns ───────────────────────
-- PostgreSQL stores view query text with column names; renaming a column
-- that appears in a view's SELECT or WHERE causes the view to return an error.
-- We must DROP + recreate each affected view.

-- public_job_board — referenced jp.status
DROP VIEW IF EXISTS public.public_job_board;
CREATE VIEW public.public_job_board AS
SELECT
    jp.id,
    jp.public_slug,
    jp.title,
    jp.description,
    jp.role_taxonomy,
    jp.region,
    jp.city,
    jp.country,
    jp.employment_type,
    jp.day_rate_min_cents,
    jp.day_rate_max_cents,
    jp.currency,
    jp.dates,
    jp.posting_type,
    jp.union_required,
    jp.certs_required,
    jp.travel_paid,
    jp.lodging_provided,
    jp.applicant_count,
    jp.published_at,
    jp.expires_at,
    o.name  AS org_name,
    o.slug  AS org_slug,
    o.logo_url AS org_logo_url
FROM public.job_postings jp
INNER JOIN public.orgs o ON o.id = jp.org_id
WHERE jp.job_posting_phase = 'published'
  AND jp.deleted_at IS NULL
  AND (jp.expires_at IS NULL OR jp.expires_at > now());

GRANT SELECT ON public.public_job_board TO anon, authenticated;

COMMENT ON VIEW public.public_job_board IS
    'Public job posting feed — definer mode (security_invoker=off). '
    'WHERE clause is the public-read contract: job_posting_phase=published. '
    '(Recreated by audit remediation 20260510000008 after status→job_posting_phase rename.)';

-- Restore security_invoker setting (was set to ON by 20260509100003, then reverted
-- for these public-discovery views by 20260510000003; definer mode is intentional
-- for marketplace discovery per 20260510000003 rationale).
ALTER VIEW public.public_job_board SET (security_invoker = off);

-- public_open_calls — referenced oc.status
DROP VIEW IF EXISTS public.public_open_calls;
CREATE VIEW public.public_open_calls AS
SELECT
    oc.id,
    oc.public_slug,
    oc.kind,
    oc.title,
    oc.description,
    oc.genre_tags,
    oc.trade_categories,
    oc.region,
    oc.venue_type,
    oc.performance_date,
    oc.fee_min_cents,
    oc.fee_max_cents,
    oc.currency,
    oc.deadline_at,
    oc.eligibility,
    oc.submission_count,
    oc.published_at,
    o.name  AS org_name,
    o.slug  AS org_slug,
    o.logo_url AS org_logo_url
FROM public.open_calls oc
INNER JOIN public.orgs o ON o.id = oc.org_id
WHERE oc.open_call_state = 'published'
  AND oc.deleted_at IS NULL
  AND (oc.deadline_at IS NULL OR oc.deadline_at > now());

GRANT SELECT ON public.public_open_calls TO anon, authenticated;

COMMENT ON VIEW public.public_open_calls IS
    'Public open-call feed — definer mode, see public_rfq_marketplace. '
    '(Recreated by audit remediation 20260510000008 after status→open_call_state rename.)';

ALTER VIEW public.public_open_calls SET (security_invoker = off);

-- tour_p_and_l — referenced t.status
DROP VIEW IF EXISTS public.tour_p_and_l;
CREATE VIEW public.tour_p_and_l AS
SELECT
    t.id AS tour_id,
    t.org_id,
    t.name,
    t.tour_phase AS status,   -- expose as `status` in view for backward compat during transition
    t.tour_phase,
    t.starts_on,
    t.ends_on,
    COUNT(DISTINCT o.id) AS leg_count,
    COUNT(DISTINCT s.id) AS settled_legs,
    COALESCE(SUM(s.gross_box_office_cents), 0) AS gross_box_office_cents,
    COALESCE(SUM(s.nbor_cents), 0) AS nbor_cents,
    COALESCE(SUM(s.artist_payout_cents), 0) AS artist_payout_cents,
    COALESCE(SUM(s.agent_commission_cents), 0) AS agent_commission_cents,
    COALESCE(SUM(s.bar_revenue_cents + s.merch_revenue_cents + s.other_revenue_cents), 0) AS ancillary_revenue_cents
FROM public.tours t
LEFT JOIN public.talent_offers o ON o.tour_id = t.id
LEFT JOIN public.settlements s ON s.talent_offer_id = o.id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.org_id, t.name, t.tour_phase, t.starts_on, t.ends_on;

GRANT SELECT ON public.tour_p_and_l TO authenticated;

COMMENT ON VIEW public.tour_p_and_l IS
    'Tour P&L roll-up for org-member dashboards. Exposes both tour_phase '
    '(LDP canonical) and status alias for backward compat during transition. '
    '(Recreated by audit remediation 20260510000008 after status→tour_phase rename.)';

-- public_insights_pool — referenced s.status for settlements
DROP VIEW IF EXISTS public.public_insights_pool;
CREATE VIEW public.public_insights_pool AS
SELECT
    date_trunc('month', s.show_date)::date AS month,
    unnest(COALESCE(tp.genre_tags, ARRAY['unknown'])) AS genre,
    COUNT(*) AS show_count,
    AVG(s.gross_box_office_cents)::bigint AS avg_gross_cents,
    AVG(s.paid_attendance)::int AS avg_attendance,
    AVG(s.artist_payout_cents)::bigint AS avg_artist_payout_cents
FROM public.settlements s
INNER JOIN public.orgs o ON o.id = s.org_id AND o.insights_opt_in = true
LEFT JOIN public.talent_offers o2 ON o2.id = s.talent_offer_id
LEFT JOIN public.talent_profiles tp ON tp.id = o2.talent_profile_id
WHERE s.settlement_state = 'final'
GROUP BY 1, 2
HAVING COUNT(*) >= 3;

GRANT SELECT ON public.public_insights_pool TO authenticated;

COMMENT ON VIEW public.public_insights_pool IS
    'Opt-in anonymized booking aggregates. k-anonymity floor: 3. '
    '(Recreated by audit remediation 20260510000008 after status→settlement_state rename.)';

-- public_rfq_marketplace — references rfqs.status (rfqs is an existing pre-0002 table;
-- rfqs.status was NOT renamed in this migration since rfqs predates 0001 and uses the
-- legacy LDP exception pattern). No change needed for this view.


-- ============================================================================
-- B. Foreign-key index coverage — 0002 / 0003 tables
-- ============================================================================

-- ── open_calls ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_open_calls_org_id
    ON public.open_calls (org_id);
CREATE INDEX IF NOT EXISTS idx_open_calls_project_id
    ON public.open_calls (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_calls_awarded_submission_id
    ON public.open_calls (awarded_submission_id)
    WHERE awarded_submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_calls_created_by
    ON public.open_calls (created_by)
    WHERE created_by IS NOT NULL;

-- ── open_call_submissions ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_open_call_submissions_org_id
    ON public.open_call_submissions (org_id);
CREATE INDEX IF NOT EXISTS idx_open_call_submissions_talent_profile_id
    ON public.open_call_submissions (talent_profile_id)
    WHERE talent_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_call_submissions_crew_member_id
    ON public.open_call_submissions (crew_member_id)
    WHERE crew_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_call_submissions_vendor_id
    ON public.open_call_submissions (vendor_id)
    WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_open_call_submissions_reviewed_by
    ON public.open_call_submissions (reviewed_by)
    WHERE reviewed_by IS NOT NULL;

-- ── talent_offers ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_talent_offers_org_id
    ON public.talent_offers (org_id);
CREATE INDEX IF NOT EXISTS idx_talent_offers_project_id
    ON public.talent_offers (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_open_call_submission_id
    ON public.talent_offers (open_call_submission_id)
    WHERE open_call_submission_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_previous_offer_id
    ON public.talent_offers (previous_offer_id)
    WHERE previous_offer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_stage_plot_id
    ON public.talent_offers (stage_plot_id)
    WHERE stage_plot_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_agency_id
    ON public.talent_offers (agency_id)
    WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_created_by
    ON public.talent_offers (created_by)
    WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_talent_offers_performance_agreement_proposal_id
    ON public.talent_offers (performance_agreement_proposal_id)
    WHERE performance_agreement_proposal_id IS NOT NULL;

-- ── job_postings ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_postings_org_id
    ON public.job_postings (org_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_project_id
    ON public.job_postings (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_postings_created_by
    ON public.job_postings (created_by)
    WHERE created_by IS NOT NULL;

-- ── job_applications ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_job_applications_org_id
    ON public.job_applications (org_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_crew_member_id
    ON public.job_applications (crew_member_id)
    WHERE crew_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_applications_reviewed_by
    ON public.job_applications (reviewed_by)
    WHERE reviewed_by IS NOT NULL;

-- ── availability_slots ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_availability_slots_org_id
    ON public.availability_slots (org_id)
    WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_availability_slots_granted_to_org_id
    ON public.availability_slots (granted_to_org_id)
    WHERE granted_to_org_id IS NOT NULL;

-- ── reviews ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_reviews_org_id
    ON public.reviews (org_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_org_id
    ON public.reviews (reviewer_org_id)
    WHERE reviewer_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_subject_crew_member_id
    ON public.reviews (subject_crew_member_id)
    WHERE subject_crew_member_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_subject_org_id
    ON public.reviews (subject_org_id)
    WHERE subject_org_id IS NOT NULL;

-- ── saved_searches ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_searches_org_id
    ON public.saved_searches (org_id)
    WHERE org_id IS NOT NULL;

-- ── settlements ──────────────────────────────────────────────────────────────
-- talent_offer_id already has settlements_offer_idx; add the missing ones.
CREATE INDEX IF NOT EXISTS idx_settlements_project_id
    ON public.settlements (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_settlements_venue_id
    ON public.settlements (venue_id)
    WHERE venue_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_settlements_finalized_by
    ON public.settlements (finalized_by)
    WHERE finalized_by IS NOT NULL;

-- ── settlement_lines ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_settlement_lines_org_id
    ON public.settlement_lines (org_id);

-- ── ticketing_connections ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ticketing_connections_project_id
    ON public.ticketing_connections (project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ticketing_connections_talent_offer_id
    ON public.ticketing_connections (talent_offer_id)
    WHERE talent_offer_id IS NOT NULL;

-- ── ticketing_sales_snapshots ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ticketing_sales_snapshots_org_id
    ON public.ticketing_sales_snapshots (org_id);

-- ── agency_artists ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_agency_artists_org_id
    ON public.agency_artists (org_id);
CREATE INDEX IF NOT EXISTS idx_agency_artists_agent_user_id
    ON public.agency_artists (agent_user_id)
    WHERE agent_user_id IS NOT NULL;

-- ── tours ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tours_agency_id
    ON public.tours (agency_id)
    WHERE agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tours_created_by
    ON public.tours (created_by)
    WHERE created_by IS NOT NULL;

-- ── co_pro_partnerships ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_co_pro_partnerships_org_id
    ON public.co_pro_partnerships (org_id);
CREATE INDEX IF NOT EXISTS idx_co_pro_partnerships_partner_org_id
    ON public.co_pro_partnerships (partner_org_id)
    WHERE partner_org_id IS NOT NULL;

-- ── uis_role_state_transitions (added in 20260509060000) ────────────────────
-- org_id FK was not in either prior sweep sweep.
CREATE INDEX IF NOT EXISTS idx_uis_role_state_transitions_org_id
    ON public.uis_role_state_transitions (org_id);


-- ============================================================================
-- C. Security: re-assert REVOKE on offer-letter SECURITY DEFINER functions
--
-- Migration 20260509070000 used DROP TYPE + CREATE TYPE to rebuild the
-- offer_letter_status enum. Postgres drops all functions that depend on a
-- type when the type is dropped, then implicitly recreates them with default
-- ACLs (EXECUTE granted to PUBLIC). The original 0001_remote_snapshot.sql
-- had:
--   REVOKE ALL ON FUNCTION ... FROM PUBLIC;
--   GRANT ALL ON FUNCTION ... TO service_role;
-- Those grants must be re-applied here.
--
-- These functions authenticate via bearer token + access_code, not via
-- session JWT. They must only be callable by trusted server routes using
-- the service-role client — never directly by PostgREST callers.
-- ============================================================================

REVOKE ALL ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text)
    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text)
    FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text)
    TO service_role;

REVOKE ALL ON FUNCTION public.decline_offer_letter(uuid, text, text)
    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decline_offer_letter(uuid, text, text)
    FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_offer_letter(uuid, text, text)
    TO service_role;

REVOKE ALL ON FUNCTION public.record_offer_letter_view(uuid, text)
    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_offer_letter_view(uuid, text)
    FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_offer_letter_view(uuid, text)
    TO service_role;

COMMENT ON FUNCTION public.accept_offer_letter(uuid, text, text, inet, text) IS
    'Token-authenticated offer-letter acceptance. SECURITY DEFINER. '
    'EXECUTE restricted to service_role — called from server-side portal '
    'routes via createServiceClient() only. '
    'ACL re-applied by audit remediation 20260510000008 after DROP TYPE in '
    '20260509070000 reset grants to PostgreSQL defaults.';

COMMENT ON FUNCTION public.decline_offer_letter(uuid, text, text) IS
    'Token-authenticated offer-letter decline. SECURITY DEFINER. '
    'EXECUTE restricted to service_role. '
    'ACL re-applied by audit remediation 20260510000008.';

COMMENT ON FUNCTION public.record_offer_letter_view(uuid, text) IS
    'Token-authenticated first-view event recorder. SECURITY DEFINER. '
    'EXECUTE restricted to service_role. '
    'ACL re-applied by audit remediation 20260510000008.';


-- ============================================================================
-- D. 3NF: talent_profiles transitive dependency documentation
--
-- talent_profiles.agent_name → agent_email: agent_name is a fact about the
-- agent entity (keyed by agent_email), not about the talent profile itself.
-- Full normalisation requires a new `agents` table with an FK from
-- talent_profiles.agent_id. Deferred to Wave 3 — requires application code
-- changes and a data migration.
-- ============================================================================

COMMENT ON COLUMN public.talent_profiles.agent_email IS
    '3NF-DEFERRED: agent_name depends on agent_email, not on talent_profiles.id. '
    'Transitive dependency: id→agent_email→agent_name. '
    'Normalise into a separate agents table in Wave 3 schema cleanup.';

COMMENT ON COLUMN public.talent_profiles.agent_name IS
    '3NF-DEFERRED: transitive dependency via agent_email (see agent_email comment). '
    'Normalise into a separate agents table in Wave 3 schema cleanup.';
