-- ============================================================
-- Open Call Submission Intelligence (competitive: GigSalad Lead Insights)
-- ============================================================
-- Adds:
--   1. open_call_stats(call_id) — aggregated analytics function
--   2. ai_market_intelligence text column on open_calls — optional
--      AI-generated note about the applicant pool quality
-- ============================================================

-- Per-call analytics used by /api/v1/marketplace/calls/[id]/insights
CREATE OR REPLACE FUNCTION "public"."open_call_stats"(p_call_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'total',                COUNT(*),
        'shortlisted',          COUNT(*) FILTER (WHERE status = 'shortlisted'),
        'awarded',              COUNT(*) FILTER (WHERE status = 'awarded'),
        'rejected',             COUNT(*) FILTER (WHERE status = 'rejected'),
        'withdrawn',            COUNT(*) FILTER (WHERE status = 'withdrawn'),
        'avg_score',            ROUND(AVG(score)::numeric, 1),
        'avg_fee_cents',        ROUND(AVG(fee_proposed_cents)::numeric),
        'median_fee_cents',     PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY fee_proposed_cents),
        'min_fee_cents',        MIN(fee_proposed_cents),
        'max_fee_cents',        MAX(fee_proposed_cents),
        'first_submission_at',  MIN(submitted_at),
        'latest_submission_at', MAX(submitted_at),
        -- submissions per calendar day since first submission (velocity proxy)
        'submissions_per_day',  ROUND(
            CASE
                WHEN MIN(submitted_at) IS NULL THEN 0
                WHEN EXTRACT(EPOCH FROM (MAX(submitted_at) - MIN(submitted_at))) < 86400 THEN COUNT(*)
                ELSE COUNT(*)::numeric /
                     NULLIF(EXTRACT(EPOCH FROM (now() - MIN(submitted_at))) / 86400, 0)
            END::numeric, 2
        ),
        'shortlist_rate_pct',   ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
                 ELSE (COUNT(*) FILTER (WHERE status = 'shortlisted') * 100.0 / COUNT(*))
            END::numeric, 1
        )
    )
    FROM open_call_submissions
    WHERE open_call_id = p_call_id;
$$;

COMMENT ON FUNCTION "public"."open_call_stats"(uuid)
    IS 'Aggregated submission analytics for an open call. Called by /api/v1/marketplace/calls/[id]/insights.';

-- AI narrative about the applicant pool (populated by the triage endpoint)
ALTER TABLE "public"."open_calls"
    ADD COLUMN IF NOT EXISTS "ai_market_intelligence" text,
    ADD COLUMN IF NOT EXISTS "ai_market_intelligence_at" timestamptz;

COMMENT ON COLUMN "public"."open_calls"."ai_market_intelligence"
    IS 'AI-generated summary of the applicant pool quality and recommendations (GigSalad Lead Insights parity).';
