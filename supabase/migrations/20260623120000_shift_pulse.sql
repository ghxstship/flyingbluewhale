-- Shift Pulse: post-clock-out crew sentiment feedback.
-- Deputy parity — equivalent to "Shift Pulse" (launched 2025).
-- One feedback row per time_entry; mood is a 1–5 scale (1 = rough, 5 = great).
-- Highlights and blockers are optional free-text fields surfaced in manager
-- dashboards at /console/workforce/time-off (operator visibility) and
-- fed into the push fan-out for blocker alerts.

CREATE TABLE shift_feedback (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id         uuid        NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  time_entry_id  uuid        NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  created_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  mood           smallint    NOT NULL CHECK (mood BETWEEN 1 AND 5),
  highlights     text,
  blockers       text,
  created_at     timestamptz DEFAULT now() NOT NULL,
  UNIQUE (time_entry_id)
);

ALTER TABLE shift_feedback ENABLE ROW LEVEL SECURITY;

-- Org members (managers) can read all feedback in their org.
CREATE POLICY "org_members_read_shift_feedback" ON shift_feedback
  FOR SELECT USING (private.is_org_member(org_id));

-- Workers can submit feedback only for their own session; once submitted
-- the UNIQUE constraint prevents duplicates for the same time entry.
CREATE POLICY "owner_insert_shift_feedback" ON shift_feedback
  FOR INSERT WITH CHECK (
    private.is_org_member(org_id)
    AND created_by = auth.uid()
  );

-- Lookups: "does this entry already have feedback?" and "feedback for this org, newest first".
CREATE INDEX shift_feedback_entry_idx ON shift_feedback (time_entry_id);
CREATE INDEX shift_feedback_org_created_idx ON shift_feedback (org_id, created_at DESC);
