-- ============================================================
-- AI Operator Digest Snapshots (competitive: HoneyBook AI Priority Lists)
-- ============================================================
-- Caches per-user AI-generated briefings so repeated page loads don't
-- burn Anthropic API credits. TTL is enforced app-side (4 h default).
-- ============================================================

CREATE TABLE IF NOT EXISTS "public"."ai_digest_snapshots" (
    "id"              uuid DEFAULT gen_random_uuid() NOT NULL,
    "org_id"          uuid NOT NULL,
    "user_id"         uuid NOT NULL,
    "generated_at"    timestamptz DEFAULT now() NOT NULL,
    -- AI-written paragraph summarising the operator's current state
    "summary"         text NOT NULL,
    -- Structured priority items: [{category, urgency, action, href?}]
    "priorities"      jsonb DEFAULT '[]'::jsonb NOT NULL,
    -- Raw context fed to the model (for debugging / re-generation)
    "context_digest"  jsonb DEFAULT '{}'::jsonb NOT NULL,
    "input_tokens"    integer DEFAULT 0 NOT NULL,
    "output_tokens"   integer DEFAULT 0 NOT NULL,
    CONSTRAINT "ai_digest_snapshots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."ai_digest_snapshots" OWNER TO "postgres";

COMMENT ON TABLE "public"."ai_digest_snapshots"
    IS 'Cached AI operator briefings (HoneyBook-parity daily digest). One row per generation; latest by user_id wins.';

-- Fast lookup: "give me the newest digest for user X in org Y"
CREATE INDEX IF NOT EXISTS "ai_digest_snapshots_user_idx"
    ON "public"."ai_digest_snapshots" ("org_id", "user_id", "generated_at" DESC);

-- RLS: users read only their own digests; service role writes them.
ALTER TABLE "public"."ai_digest_snapshots" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_digest_snapshots_select_own"
    ON "public"."ai_digest_snapshots"
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ai_digest_snapshots_service_all"
    ON "public"."ai_digest_snapshots"
    FOR ALL TO "service_role" USING (true) WITH CHECK (true);
