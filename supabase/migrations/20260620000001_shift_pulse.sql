-- Shift Pulse: post-shift sentiment feedback (WF-PULSE-001)
-- Competitive parity: Deputy Shift Pulse+ (2025)
-- Collects per-shift mood + fatigue signals for the crew happiness index.

CREATE TABLE IF NOT EXISTS public.shift_feedback (
  id            uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid            NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  shift_id      uuid            NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  user_id       uuid            NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mood          smallint        NOT NULL CHECK (mood BETWEEN 1 AND 5),
  fatigue       smallint        NOT NULL CHECK (fatigue BETWEEN 1 AND 5),
  comment       text,
  submitted_at  timestamptz     NOT NULL DEFAULT now()
);

-- One feedback row per user per shift (duplicate submissions are a UX bug, not a data model)
CREATE UNIQUE INDEX IF NOT EXISTS shift_feedback_unique_per_user_shift
  ON public.shift_feedback (shift_id, user_id);

CREATE INDEX IF NOT EXISTS shift_feedback_org_submitted
  ON public.shift_feedback (org_id, submitted_at DESC);

ALTER TABLE public.shift_feedback ENABLE ROW LEVEL SECURITY;

-- Workers can insert/read their own feedback; managers read org-wide.
CREATE POLICY "shift_feedback_worker_insert"
  ON public.shift_feedback FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND org_id IN (SELECT org_id FROM public.memberships WHERE user_id = auth.uid())
  );

CREATE POLICY "shift_feedback_worker_read"
  ON public.shift_feedback FOR SELECT
  USING (
    auth.uid() = user_id
    OR private.is_org_member(org_id)
  );

-- Manager read covers the analytics surface; no update/delete — feedback is immutable.
