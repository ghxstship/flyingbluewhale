-- Shift confirmation state — lets workers confirm or decline upcoming shifts
-- directly from COMPVSS without opening the shift detail.
-- Competes with Connecteam's per-shift confirm/reject feature (2025).
-- LDP naming: *_state for cyclical operational lifecycle.

CREATE TYPE "public"."shift_confirmation_state" AS ENUM (
  'pending',
  'confirmed',
  'declined'
);

ALTER TABLE "public"."shifts"
  ADD COLUMN "confirmation_state" "public"."shift_confirmation_state"
    NOT NULL DEFAULT 'pending'::"public"."shift_confirmation_state",
  ADD COLUMN "confirmed_at" timestamp with time zone,
  ADD COLUMN "confirmation_note" text;

-- Workers can update their own shift confirmation state.
-- Managers can update any shift's confirmation state within their org.
CREATE OR REPLACE FUNCTION "public"."confirm_shift"(
  p_shift_id uuid,
  p_state "public"."shift_confirmation_state",
  p_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shift shifts%ROWTYPE;
  v_wfm_id uuid;
BEGIN
  SELECT * INTO v_shift FROM shifts WHERE id = p_shift_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Shift not found';
  END IF;

  -- Allow the shift's own workforce member (via auth.uid → users → workforce_members)
  -- or any org manager.
  SELECT wf.id INTO v_wfm_id
    FROM workforce_members wf
    WHERE wf.org_id = v_shift.org_id
      AND wf.user_id = auth.uid()
    LIMIT 1;

  IF v_wfm_id IS NULL THEN
    -- Must be an org member at least
    IF NOT EXISTS (
      SELECT 1 FROM memberships WHERE org_id = v_shift.org_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Not authorized';
    END IF;
  END IF;

  -- Only the assigned worker or a manager may confirm/decline.
  IF v_shift.workforce_member_id IS DISTINCT FROM v_wfm_id THEN
    -- Must be manager+
    IF NOT EXISTS (
      SELECT 1 FROM memberships
      WHERE org_id = v_shift.org_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin', 'controller', 'collaborator')
    ) THEN
      RAISE EXCEPTION 'Not authorized to update another member''s shift';
    END IF;
  END IF;

  UPDATE shifts
     SET confirmation_state = p_state,
         confirmed_at = CASE WHEN p_state = 'confirmed' THEN now() ELSE NULL END,
         confirmation_note = p_note
   WHERE id = p_shift_id;
END;
$$;

GRANT EXECUTE ON FUNCTION "public"."confirm_shift"(uuid, "public"."shift_confirmation_state", text)
  TO authenticated;

COMMENT ON COLUMN "public"."shifts"."confirmation_state"
  IS 'Worker''s acknowledgement of this shift: pending (no response), confirmed, or declined.';
