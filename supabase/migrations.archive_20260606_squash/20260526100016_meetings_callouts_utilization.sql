-- Round 52 — Meetings + meeting action items + sheet callouts + equipment utilization
--
-- Three small spines tied together because they all touch existing surfaces
-- without their own canonical storage yet:
--   - G-028: Meeting minutes with action items that auto-promote to tasks.
--   - G-038: Sheet hyperlink callouts (polymorphic link from a drawing
--            sheet region to an RFI / submittal / detail).
--   - G-035: Equipment utilization view (read-only view on top of
--            asset_movements; no new tables).

BEGIN;

-- =============================================================================
-- 1. MEETINGS + ACTION ITEMS
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.meeting_kind AS ENUM (
    'kickoff',
    'owner_architect_contractor',  -- OAC weekly
    'sub_meeting',                  -- per-sub
    'safety',
    'punch_walk',
    'design_review',
    'progress',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.meeting_state AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.action_item_state AS ENUM (
    'open',
    'in_progress',
    'closed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.meetings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  project_id      uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Per-project sequence, e.g. OAC-0042. Generated via nextOrgCode.
  code            text NOT NULL,
  title           text NOT NULL,
  kind            public.meeting_kind NOT NULL DEFAULT 'other',
  meeting_state   public.meeting_state NOT NULL DEFAULT 'scheduled',
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz,
  location_name   text,
  location_room   text,
  meeting_url     text,                          -- Zoom / Teams / Meet link
  agenda_md       text,
  minutes_md      text,
  recorded_by     uuid REFERENCES auth.users(id),
  finalized_at    timestamptz,                   -- when minutes were locked
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (org_id, code)
);

CREATE INDEX IF NOT EXISTS meetings_org_idx ON public.meetings (org_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS meetings_project_idx
  ON public.meetings (project_id) WHERE project_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS meetings_starts_at_idx ON public.meetings (starts_at DESC);
CREATE INDEX IF NOT EXISTS meetings_state_idx
  ON public.meetings (meeting_state) WHERE meeting_state IN ('scheduled','in_progress');
CREATE INDEX IF NOT EXISTS meetings_kind_idx ON public.meetings (kind);
CREATE INDEX IF NOT EXISTS meetings_created_by_idx ON public.meetings (created_by);
CREATE INDEX IF NOT EXISTS meetings_recorded_by_idx ON public.meetings (recorded_by);

COMMENT ON TABLE public.meetings IS
  'Project meeting record with minutes. Action items live in meeting_action_items; a trigger auto-creates a tasks row on insert so the action shows up on the assignee dashboard.';

CREATE TABLE IF NOT EXISTS public.meeting_attendees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  meeting_id      uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  -- Exactly one of user_id / vendor_id / external_email.
  user_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  vendor_id       uuid REFERENCES public.vendors(id) ON DELETE SET NULL,
  external_name   text,
  external_email  text,
  role            text,                          -- 'chair' | 'recorder' | 'attendee' | 'optional'
  attended        boolean,
  arrived_at      timestamptz,
  departed_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT meeting_attendee_exactly_one CHECK (
    (CASE WHEN user_id        IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN vendor_id      IS NOT NULL THEN 1 ELSE 0 END)
  + (CASE WHEN external_email IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE INDEX IF NOT EXISTS meeting_attendees_meeting_idx ON public.meeting_attendees (meeting_id);
CREATE INDEX IF NOT EXISTS meeting_attendees_org_idx ON public.meeting_attendees (org_id);
CREATE INDEX IF NOT EXISTS meeting_attendees_user_idx ON public.meeting_attendees (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_attendees_vendor_idx ON public.meeting_attendees (vendor_id) WHERE vendor_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.meeting_action_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  meeting_id      uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  description     text NOT NULL,
  assignee_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  assignee_external_email text,
  due_at          date,
  action_state    public.action_item_state NOT NULL DEFAULT 'open',
  -- The task row auto-created by the trigger; lets us close the loop both
  -- ways (close action → mark task done; close task → mark action done).
  task_id         uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  closed_at       timestamptz,
  closed_by       uuid REFERENCES auth.users(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meeting_action_items_meeting_idx ON public.meeting_action_items (meeting_id);
CREATE INDEX IF NOT EXISTS meeting_action_items_org_idx ON public.meeting_action_items (org_id);
CREATE INDEX IF NOT EXISTS meeting_action_items_assignee_idx
  ON public.meeting_action_items (assignee_user_id) WHERE assignee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_action_items_task_idx
  ON public.meeting_action_items (task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS meeting_action_items_state_idx
  ON public.meeting_action_items (action_state) WHERE action_state IN ('open','in_progress');

COMMENT ON TABLE public.meeting_action_items IS
  'Action items from a meeting. The auto-promote trigger creates a tasks row for the assignee on insert and links it via task_id so closure is bidirectional.';

-- Auto-promote action items → tasks (the trigger).
CREATE OR REPLACE FUNCTION public.tg_action_item_to_task()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_meeting RECORD;
  v_project_id uuid;
  v_org_id uuid;
  v_task_id uuid;
BEGIN
  -- Skip if no assignee (action item still useful as a record).
  IF NEW.assignee_user_id IS NULL THEN RETURN NEW; END IF;
  -- Skip if already linked.
  IF NEW.task_id IS NOT NULL THEN RETURN NEW; END IF;

  SELECT m.id, m.org_id, m.project_id INTO v_meeting
  FROM public.meetings m WHERE m.id = NEW.meeting_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  v_org_id := v_meeting.org_id;
  v_project_id := v_meeting.project_id;

  -- tasks.project_id is NOT NULL on most projects' rows; skip auto-promotion
  -- when no project is attached to the meeting.
  IF v_project_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.tasks (
    org_id, project_id, title, description, status, priority,
    due_at, assigned_to, created_by, created_at, updated_at
  ) VALUES (
    v_org_id,
    v_project_id,
    LEFT(NEW.description, 200),
    'Auto-created from meeting action item.',
    'open',
    'normal',
    CASE WHEN NEW.due_at IS NOT NULL THEN (NEW.due_at::timestamptz) ELSE NULL END,
    NEW.assignee_user_id,
    NEW.assignee_user_id,
    now(),
    now()
  )
  RETURNING id INTO v_task_id;

  NEW.task_id := v_task_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_action_item_to_task ON public.meeting_action_items;
CREATE TRIGGER trg_action_item_to_task
  BEFORE INSERT ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_action_item_to_task();

-- =============================================================================
-- 2. SHEET CALLOUTS (drawing → entity link)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.sheet_callout_target_type AS ENUM (
    'rfi',
    'submittal',
    'punch_item',
    'spec_section',
    'detail_callout',     -- another sheet
    'bim_model',
    'transmittal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.sheet_callouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  site_plan_id    uuid NOT NULL REFERENCES public.site_plans(id) ON DELETE CASCADE,
  -- Click-region polygon stored as JSONB GeoJSON Polygon coords; the viewer
  -- hit-tests against this.
  region_geometry jsonb NOT NULL,
  -- For point-style callouts (legacy compatibility w/ site_plan_pins).
  x               numeric(10,4),
  y               numeric(10,4),
  -- The thing this callout opens.
  target_type     public.sheet_callout_target_type NOT NULL,
  target_id       uuid NOT NULL,
  label           text,                          -- text shown on hover
  ordinal         int NOT NULL DEFAULT 0,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sheet_callouts_site_plan_idx ON public.sheet_callouts (site_plan_id);
CREATE INDEX IF NOT EXISTS sheet_callouts_org_idx ON public.sheet_callouts (org_id);
CREATE INDEX IF NOT EXISTS sheet_callouts_target_idx ON public.sheet_callouts (target_type, target_id);
CREATE INDEX IF NOT EXISTS sheet_callouts_created_by_idx ON public.sheet_callouts (created_by);

COMMENT ON TABLE public.sheet_callouts IS
  'Polymorphic hyperlink regions on a drawing sheet. Click the region in the viewer to navigate to the linked entity (RFI / submittal / punch / detail / model / transmittal).';

-- =============================================================================
-- 3. EQUIPMENT UTILIZATION VIEW
-- =============================================================================

CREATE OR REPLACE VIEW public.v_equipment_utilization AS
WITH movements AS (
  SELECT
    e.id AS equipment_id,
    e.org_id,
    e.category,
    e.name,
    e.asset_tag,
    e.status,
    e.daily_rate_cents,
    e.daily_rate_currency,
    -- Count of "active" movements in the last 30 / 90 days.
    COUNT(am.*) FILTER (
      WHERE am.movement_kind IN ('checkout','reserve','transfer')
        AND am.occurred_at >= now() - INTERVAL '30 days'
    )::int AS movements_30d,
    COUNT(am.*) FILTER (
      WHERE am.movement_kind IN ('checkout','reserve','transfer')
        AND am.occurred_at >= now() - INTERVAL '90 days'
    )::int AS movements_90d,
    -- Sum of reservation days inside the 30/90-day window.
    COALESCE(SUM(
      CASE WHEN am.movement_kind = 'reserve'
        AND am.reservation_starts_at IS NOT NULL
        AND am.reservation_ends_at IS NOT NULL
        AND am.occurred_at >= now() - INTERVAL '30 days'
        THEN GREATEST(0, EXTRACT(EPOCH FROM (am.reservation_ends_at - am.reservation_starts_at)) / 86400)
        ELSE 0 END
    ), 0)::numeric(10,2) AS reserved_days_30d,
    COALESCE(SUM(
      CASE WHEN am.movement_kind = 'reserve'
        AND am.reservation_starts_at IS NOT NULL
        AND am.reservation_ends_at IS NOT NULL
        AND am.occurred_at >= now() - INTERVAL '90 days'
        THEN GREATEST(0, EXTRACT(EPOCH FROM (am.reservation_ends_at - am.reservation_starts_at)) / 86400)
        ELSE 0 END
    ), 0)::numeric(10,2) AS reserved_days_90d,
    MAX(am.occurred_at) FILTER (WHERE am.movement_kind IN ('checkout','reserve','transfer')) AS last_active_at
  FROM public.equipment e
  LEFT JOIN public.asset_movements am ON am.asset_id = e.id
  WHERE e.deleted_at IS NULL
  GROUP BY e.id, e.org_id, e.category, e.name, e.asset_tag, e.status, e.daily_rate_cents, e.daily_rate_currency
)
SELECT
  m.*,
  -- Utilization % = reserved_days / window_days * 100. Surfaces idle assets
  -- (low utilization but high carrying cost = bench cost).
  ROUND((m.reserved_days_30d / 30.0) * 100, 1) AS utilization_pct_30d,
  ROUND((m.reserved_days_90d / 90.0) * 100, 1) AS utilization_pct_90d,
  -- Idle revenue at risk = (30 − reserved_days_30d) * daily_rate.
  CASE WHEN m.daily_rate_cents IS NOT NULL
    THEN ((30 - LEAST(m.reserved_days_30d, 30)) * m.daily_rate_cents)::bigint
    ELSE NULL END AS idle_revenue_30d_cents
FROM movements m;

ALTER VIEW public.v_equipment_utilization SET (security_invoker = true);
GRANT SELECT ON public.v_equipment_utilization TO authenticated;

COMMENT ON VIEW public.v_equipment_utilization IS
  'Per-equipment utilization rollup over the last 30/90 days. Surfaces idle assets w/ revenue-at-risk so fleet planners can cull or re-locate.';

-- =============================================================================
-- 4. updated_at triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION public.touch_round52_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_meetings_touch ON public.meetings;
CREATE TRIGGER trg_meetings_touch BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.touch_round52_updated_at();

DROP TRIGGER IF EXISTS trg_meeting_action_items_touch ON public.meeting_action_items;
CREATE TRIGGER trg_meeting_action_items_touch BEFORE UPDATE ON public.meeting_action_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_round52_updated_at();

-- =============================================================================
-- 5. RLS
-- =============================================================================

ALTER TABLE public.meetings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_attendees     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_action_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_callouts        ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS meetings_org_select ON public.meetings;
CREATE POLICY meetings_org_select ON public.meetings FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS meetings_org_write ON public.meetings;
CREATE POLICY meetings_org_write ON public.meetings FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS meeting_attendees_org_select ON public.meeting_attendees;
CREATE POLICY meeting_attendees_org_select ON public.meeting_attendees FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS meeting_attendees_org_write ON public.meeting_attendees;
CREATE POLICY meeting_attendees_org_write ON public.meeting_attendees FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS meeting_action_items_org_select ON public.meeting_action_items;
CREATE POLICY meeting_action_items_org_select ON public.meeting_action_items FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS meeting_action_items_org_write ON public.meeting_action_items;
CREATE POLICY meeting_action_items_org_write ON public.meeting_action_items FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

DROP POLICY IF EXISTS sheet_callouts_org_select ON public.sheet_callouts;
CREATE POLICY sheet_callouts_org_select ON public.sheet_callouts FOR SELECT USING (private.is_org_member(org_id));
DROP POLICY IF EXISTS sheet_callouts_org_write ON public.sheet_callouts;
CREATE POLICY sheet_callouts_org_write ON public.sheet_callouts FOR ALL
  USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']))
  WITH CHECK (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

COMMIT;
