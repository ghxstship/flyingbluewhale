-- Round 12: extend announcement audience targeting beyond the {role}
-- + optional project_id scope from 0046. Adds team_id so an
-- announcement can target a specific team (eg. "Sound Crew", "VIP Concierge")
-- without re-creating the audience enum.
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS announcements_team_id_idx
  ON public.announcements (team_id) WHERE team_id IS NOT NULL;
