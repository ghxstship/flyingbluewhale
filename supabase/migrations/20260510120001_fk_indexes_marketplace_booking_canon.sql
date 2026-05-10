-- FK indexes for tables introduced in 0002 (marketplace_canon) and 0003 (booking_canon).
--
-- The two FK index sweeps (20260509100001 and 20260509100010) covered only
-- pre-existing 0001 tables. All new tables from 0002/0003 were missed and have
-- unindexed FK columns that appear in every RLS policy evaluation.

-- ─── open_call_submissions (0002) ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ocs_org_id
  ON public.open_call_submissions (org_id);

CREATE INDEX IF NOT EXISTS idx_ocs_talent_profile_id
  ON public.open_call_submissions (talent_profile_id)
  WHERE talent_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ocs_crew_member_id
  ON public.open_call_submissions (crew_member_id)
  WHERE crew_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ocs_vendor_id
  ON public.open_call_submissions (vendor_id)
  WHERE vendor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ocs_reviewed_by
  ON public.open_call_submissions (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

-- ─── talent_offers (0002/0003) ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_to_project_id
  ON public.talent_offers (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_open_call_submission_id
  ON public.talent_offers (open_call_submission_id)
  WHERE open_call_submission_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_stage_plot_id
  ON public.talent_offers (stage_plot_id)
  WHERE stage_plot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_previous_offer_id
  ON public.talent_offers (previous_offer_id)
  WHERE previous_offer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_performance_agreement_proposal_id
  ON public.talent_offers (performance_agreement_proposal_id)
  WHERE performance_agreement_proposal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_created_by
  ON public.talent_offers (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_to_agency_id
  ON public.talent_offers (agency_id)
  WHERE agency_id IS NOT NULL;

-- ─── job_applications (0002) ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ja_org_id
  ON public.job_applications (org_id);

CREATE INDEX IF NOT EXISTS idx_ja_crew_member_id
  ON public.job_applications (crew_member_id)
  WHERE crew_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ja_reviewed_by
  ON public.job_applications (reviewed_by)
  WHERE reviewed_by IS NOT NULL;

-- ─── reviews (0002) ──────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reviews_org_id
  ON public.reviews (org_id);

CREATE INDEX IF NOT EXISTS idx_reviews_subject_crew_member_id
  ON public.reviews (subject_crew_member_id)
  WHERE subject_crew_member_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_subject_org_id
  ON public.reviews (subject_org_id)
  WHERE subject_org_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_user_id
  ON public.reviews (reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_org_id
  ON public.reviews (reviewer_org_id)
  WHERE reviewer_org_id IS NOT NULL;

-- ─── settlements (0003) ──────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_settlements_project_id
  ON public.settlements (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlements_venue_id
  ON public.settlements (venue_id)
  WHERE venue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_settlements_finalized_by
  ON public.settlements (finalized_by)
  WHERE finalized_by IS NOT NULL;

-- ─── settlement_lines (0003) ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_settlement_lines_org_id
  ON public.settlement_lines (org_id);

-- ─── ticketing_connections (0003) ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tc_project_id
  ON public.ticketing_connections (project_id)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tc_talent_offer_id
  ON public.ticketing_connections (talent_offer_id)
  WHERE talent_offer_id IS NOT NULL;

-- ─── agency_artists (0003) ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_aa_org_id
  ON public.agency_artists (org_id);

CREATE INDEX IF NOT EXISTS idx_aa_agent_user_id
  ON public.agency_artists (agent_user_id)
  WHERE agent_user_id IS NOT NULL;

-- ─── tours (0003) ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tours_agency_id
  ON public.tours (agency_id)
  WHERE agency_id IS NOT NULL;

-- ─── event_milestones (0003) ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_em_org_id
  ON public.event_milestones (org_id);

CREATE INDEX IF NOT EXISTS idx_em_created_by
  ON public.event_milestones (created_by)
  WHERE created_by IS NOT NULL;

-- ─── co_pro_partnerships (0003) ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_cpp_org_id
  ON public.co_pro_partnerships (org_id);

CREATE INDEX IF NOT EXISTS idx_cpp_partner_org_id
  ON public.co_pro_partnerships (partner_org_id)
  WHERE partner_org_id IS NOT NULL;
