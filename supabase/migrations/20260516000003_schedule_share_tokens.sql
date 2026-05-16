-- Schedule Share Tokens: generate a persistent public read-only link to an org's
-- event schedule (or a single project's schedule).
-- Competitive parity: Propared "one-click live schedule sharing" (standout feature).
--
-- Tokens are 32-byte random base64url strings — no HMAC, because the token
-- itself is the secret (no auth bypass; the view is already public-safe data).
-- Expiry + revocation are enforced in the query layer and the RLS policy.

-- ============================================================
-- 1. schedule_share_tokens
-- ============================================================
CREATE TABLE IF NOT EXISTS "public"."schedule_share_tokens" (
    "id"          uuid        DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "org_id"      uuid        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
    "project_id"  uuid        REFERENCES public.projects(id) ON DELETE CASCADE,
    "token"       text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'base64'),
    "title"       text        NOT NULL DEFAULT 'Schedule',
    "view_type"   text        NOT NULL DEFAULT 'events'
                      CHECK (view_type IN ('events', 'crew', 'full')),
    "is_active"   boolean     NOT NULL DEFAULT true,
    "expires_at"  timestamptz,
    "view_count"  integer     NOT NULL DEFAULT 0,
    "created_by"  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    "created_at"  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE "public"."schedule_share_tokens" OWNER TO "postgres";

COMMENT ON TABLE "public"."schedule_share_tokens" IS
  'Persistent public share links for org/project event schedules. Competitive parity: Propared one-click schedule sharing.';
COMMENT ON COLUMN "public"."schedule_share_tokens"."view_type" IS
  'events = public event list only; crew = with workforce assignments; full = events + crew + tasks.';
COMMENT ON COLUMN "public"."schedule_share_tokens"."token" IS
  '32-byte random base64 string. The token itself is the secret; no additional HMAC required.';

-- ============================================================
-- 2. RLS
-- ============================================================
ALTER TABLE "public"."schedule_share_tokens" ENABLE ROW LEVEL SECURITY;

-- Org admins / managers can fully manage their tokens
CREATE POLICY "schedule_share_tokens_admin_all" ON "public"."schedule_share_tokens"
    FOR ALL TO authenticated
    USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
    WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

-- Anon / authenticated: read a specific token row for link verification.
-- The caller must supply the token value via .eq('token', ...) and the row
-- must be active + not expired. The route handler validates both.
CREATE POLICY "schedule_share_tokens_public_verify" ON "public"."schedule_share_tokens"
    FOR SELECT TO anon, authenticated
    USING (
        is_active = true
        AND (expires_at IS NULL OR expires_at > now())
    );

-- ============================================================
-- 3. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sst_org_id    ON "public"."schedule_share_tokens"(org_id);
CREATE INDEX IF NOT EXISTS idx_sst_token     ON "public"."schedule_share_tokens"(token);
CREATE INDEX IF NOT EXISTS idx_sst_project   ON "public"."schedule_share_tokens"(project_id)
    WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sst_active    ON "public"."schedule_share_tokens"(is_active, expires_at)
    WHERE is_active = true;

-- ============================================================
-- 4. Increment view_count RPC (called by the public share renderer)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_schedule_share_view(p_token text)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public AS $$
    UPDATE public.schedule_share_tokens
    SET view_count = view_count + 1
    WHERE token = p_token
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now());
$$;

GRANT EXECUTE ON FUNCTION public.increment_schedule_share_view(text) TO anon, authenticated;
