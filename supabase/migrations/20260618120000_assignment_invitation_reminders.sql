-- Assignment invitation reminders (Competitive Edge Drop v1 — Rentman 2025
-- "crew invitation reminders" parity). Adds a lightweight reminder log so
-- operators can nudge unresponded parties without re-sending the full
-- assignment notice. One column on assignments (last_reminder_sent_at) +
-- a dedicated log table for audit, with RLS matching the assignments RLS
-- pattern (manager+ writes, org-members read).

-- Track when the last reminder was sent, so the UI can surface "last
-- reminded X ago" and prevent flooding.
ALTER TABLE "public"."assignments"
  ADD COLUMN IF NOT EXISTS "last_reminder_sent_at" TIMESTAMPTZ;

COMMENT ON COLUMN "public"."assignments"."last_reminder_sent_at"
  IS 'Timestamp of the most recent crew/party reminder push sent for this assignment.';

-- Append-only reminder log: one row per reminder sent, for auditing and
-- rate-limiting. org_id is redundant with the assignment FK but lets
-- RLS do a single .eq("org_id", …) lookup without a JOIN.
CREATE TABLE IF NOT EXISTS "public"."assignment_reminder_log" (
  "id"            UUID DEFAULT gen_random_uuid() NOT NULL,
  "org_id"        UUID NOT NULL REFERENCES "public"."orgs"("id") ON DELETE CASCADE,
  "assignment_id" UUID NOT NULL REFERENCES "public"."assignments"("id") ON DELETE CASCADE,
  "sent_by"       UUID REFERENCES "auth"."users"("id") ON DELETE SET NULL,
  "sent_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "channel"       TEXT NOT NULL DEFAULT 'push',
  CONSTRAINT "assignment_reminder_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "arl_assignment_idx"
  ON "public"."assignment_reminder_log" ("assignment_id");

CREATE INDEX IF NOT EXISTS "arl_org_sent_idx"
  ON "public"."assignment_reminder_log" ("org_id", "sent_at" DESC);

ALTER TABLE "public"."assignment_reminder_log" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "arl_select"
  ON "public"."assignment_reminder_log" AS PERMISSIVE FOR SELECT
  TO authenticated
  USING (private.is_org_member("org_id"));

CREATE POLICY "arl_insert"
  ON "public"."assignment_reminder_log" AS PERMISSIVE FOR INSERT
  TO authenticated
  WITH CHECK (private.has_org_role("org_id", ARRAY['owner','admin','controller','collaborator']));
