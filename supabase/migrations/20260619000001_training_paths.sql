-- Training Paths (Trainual parity)
CREATE TABLE public.training_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  target_role text,
  estimated_hours numeric(6,1),
  is_required boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.training_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read training_paths" ON public.training_paths FOR SELECT USING (private.is_org_member(org_id));
CREATE POLICY "org managers write training_paths" ON public.training_paths FOR ALL USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

CREATE TABLE public.training_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES training_paths(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  kind text NOT NULL CHECK (kind IN ('course','resource','quiz','external')),
  title text NOT NULL,
  resource_url text,
  course_id uuid,
  estimated_minutes integer,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_path_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read training_path_steps" ON public.training_path_steps FOR SELECT USING (private.is_org_member(org_id));
CREATE POLICY "org managers write training_path_steps" ON public.training_path_steps FOR ALL USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

CREATE TABLE public.training_path_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES training_paths(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  progress_pct integer NOT NULL DEFAULT 0,
  UNIQUE(path_id, user_id)
);
ALTER TABLE public.training_path_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read own enrollments" ON public.training_path_enrollments FOR SELECT USING (private.is_org_member(org_id) AND (user_id = auth.uid() OR private.has_org_role(org_id, ARRAY['owner','admin','manager'])));
CREATE POLICY "org managers write enrollments" ON public.training_path_enrollments FOR ALL USING (private.has_org_role(org_id, ARRAY['owner','admin','manager']));

-- Learning Streaks (Trainual gamification parity)
CREATE TABLE public.learning_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  total_completions integer NOT NULL DEFAULT 0,
  UNIQUE(org_id, user_id)
);
ALTER TABLE public.learning_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read learning_streaks" ON public.learning_streaks FOR SELECT USING (private.is_org_member(org_id));
CREATE POLICY "org members write own streak" ON public.learning_streaks FOR ALL USING (private.is_org_member(org_id));

-- Automation Rules (HoneyBook Automations 2.0 parity)
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  trigger_conditions jsonb NOT NULL DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean NOT NULL DEFAULT true,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read automation_rules" ON public.automation_rules FOR SELECT USING (private.is_org_member(org_id));
CREATE POLICY "org admins write automation_rules" ON public.automation_rules FOR ALL USING (private.has_org_role(org_id, ARRAY['owner','admin']));

-- touch updated_at triggers
CREATE TRIGGER training_paths_updated_at BEFORE UPDATE ON public.training_paths FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();
CREATE TRIGGER automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION private.touch_updated_at();
