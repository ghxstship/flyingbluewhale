-- incidents: enforce the close sign-off at the DATABASE, not just the app.
--
-- The app tier landed in src/lib/db/incident-states.ts (shared by the console
-- and COMPVSS, pinned by incident-states.test.ts): filing and forward progress
-- (open -> investigating -> resolved) are never gated, but CLOSING is a
-- sign-off where there are stakes, and reopening a closed record is the manager
-- band's call.
--
-- That tier is defense-in-depth only: `incidents_update` RLS grants the crew
-- persona, so a token holder calling PostgREST directly could still close their
-- own injury report and bypass the FSM entirely. This trigger closes that hole
-- so the rule holds wherever the write comes from.
--
-- A TRIGGER rather than a narrowed RLS policy, deliberately: the rule is about
-- a TRANSITION (old.incident_state -> new.incident_state), and an RLS WITH
-- CHECK only sees the new row. Expressing it as a policy would have had to gate
-- every update to an already-closed record instead of the close itself.
--
-- The role set is `owner, admin, manager` to match MANAGER_BAND_ROLES in
-- src/lib/auth.ts exactly. If the two disagree, the UI offers an action the
-- database then refuses — the failure mode this whole change exists to avoid.

CREATE OR REPLACE FUNCTION "private"."enforce_incident_close_signoff"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET "search_path" TO 'public', 'private', 'pg_temp'
AS $$
DECLARE
  manager_band text[] := ARRAY['owner', 'admin', 'manager'];
BEGIN
  -- Trusted server paths (service role, automations, migrations) carry no JWT.
  -- `private.has_org_role` returns FALSE when auth.uid() is null, so without
  -- this bypass an automation closing an incident would be refused.
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only lifecycle moves are gated. Editing a record's details, and forward
  -- progress (open -> investigating -> resolved), are untouched.
  IF NEW.incident_state IS NOT DISTINCT FROM OLD.incident_state THEN
    RETURN NEW;
  END IF;

  -- Reopening a closed record is always the manager band's call. (`closed`
  -- stopped being terminal because a wrongly-closed injury with no way back is
  -- a worse liability than a wrongly-open one.)
  IF OLD.incident_state = 'closed' THEN
    IF NOT private.has_org_role(NEW.org_id, manager_band) THEN
      RAISE EXCEPTION 'Only a manager can reopen a closed incident'
        USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN NEW;
  END IF;

  -- Closing: a sign-off where there is something to sign off. Any recorded
  -- injury (at ANY severity) or a major/critical safety report needs the
  -- manager band. Lost property (handing a phone back at the desk) and
  -- low-severity no-injury reports stay self-serve — over-gating is how safety
  -- software stops being used.
  --
  -- report_kind defaults to 'safety' in the schema, so COALESCE keeps a missing
  -- value on the STRICT side rather than falling through to the lenient branch.
  IF NEW.incident_state = 'closed'
     AND COALESCE(NEW.report_kind, 'safety') <> 'lost_property'
     AND (NEW.injury_type IS NOT NULL OR NEW.severity IN ('major', 'critical'))
     AND NOT private.has_org_role(NEW.org_id, manager_band)
  THEN
    RAISE EXCEPTION 'Closing an injury or major/critical report is a manager sign-off'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION "private"."enforce_incident_close_signoff"() OWNER TO "postgres";

COMMENT ON FUNCTION "private"."enforce_incident_close_signoff"() IS
  'Mirrors the shared app FSM (src/lib/db/incident-states.ts): closing an injury or major/critical incident, and reopening any closed incident, require the owner/admin/manager band. Filing and open->investigating->resolved are ungated. Bypassed for service-role/JWT-less callers.';

DROP TRIGGER IF EXISTS "tg_incidents_close_signoff" ON "public"."incidents";

CREATE TRIGGER "tg_incidents_close_signoff"
  BEFORE UPDATE ON "public"."incidents"
  FOR EACH ROW
  EXECUTE FUNCTION "private"."enforce_incident_close_signoff"();
