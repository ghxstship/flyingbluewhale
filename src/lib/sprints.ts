/**
 * CV10 — Sprint management shared types + helpers.
 *
 * Enum tuples, label maps, and pure compute helpers for the sprint /
 * story / burndown trio. This is the sibling lib for the `actions.ts`
 * server files (a "use server" file may only export async functions), and
 * is safe to import from both server components and client islands.
 *
 * Tables (sprints / sprint_stories / burndown_snapshots) are not yet in
 * the generated `database.types.ts`; call sites use the `LooseSupabase`
 * cast until the PENDING_sprints.sql migration is applied + types regen.
 */

export const SPRINT_STATES = ["planned", "active", "completed"] as const;
export type SprintState = (typeof SPRINT_STATES)[number];

export const STORY_STATES = ["todo", "in_progress", "done"] as const;
export type StoryState = (typeof STORY_STATES)[number];

export const SPRINT_STATE_LABELS: Record<SprintState, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
};

export const STORY_STATE_LABELS: Record<StoryState, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export type Sprint = {
  id: string;
  org_id: string;
  project_id: string | null;
  name: string;
  starts_on: string | null;
  ends_on: string | null;
  sprint_state: SprintState;
  goal: string | null;
  created_at: string;
};

export type SprintStory = {
  id: string;
  org_id: string;
  sprint_id: string;
  title: string;
  points: number;
  story_state: StoryState;
  notes: string | null;
  created_at: string;
};

export type BurndownSnapshot = {
  id: string;
  sprint_id: string;
  snapshot_on: string;
  remaining_points: number;
};

export type BurndownPoint = { date: string; remaining: number };

/** Total committed points across a story set. */
export function totalPoints(stories: Pick<SprintStory, "points">[]): number {
  return stories.reduce((sum, s) => sum + (s.points || 0), 0);
}

/** Points not yet in the `done` column — the live remaining for today. */
export function remainingPoints(stories: Pick<SprintStory, "points" | "story_state">[]): number {
  return stories.reduce((sum, s) => sum + (s.story_state === "done" ? 0 : s.points || 0), 0);
}

/** Points completed this sprint — the velocity contribution. */
export function completedPoints(stories: Pick<SprintStory, "points" | "story_state">[]): number {
  return stories.reduce((sum, s) => sum + (s.story_state === "done" ? s.points || 0 : 0), 0);
}

/** Group stories into kanban columns keyed by story_state, in canonical order. */
export function groupByState<T extends { story_state: StoryState }>(stories: T[]): Record<StoryState, T[]> {
  const cols = { todo: [], in_progress: [], done: [] } as Record<StoryState, T[]>;
  for (const s of stories) cols[s.story_state]?.push(s);
  return cols;
}

/**
 * Build the burndown series. If recorded snapshots exist, use them; else
 * synthesize a single live point from the current remaining so the chart
 * never renders empty for a freshly-started sprint.
 */
export function burndownSeries(
  snapshots: BurndownSnapshot[],
  liveRemaining: number,
  todayIso: string,
): BurndownPoint[] {
  if (snapshots.length > 0) {
    return [...snapshots]
      .sort((a, b) => a.snapshot_on.localeCompare(b.snapshot_on))
      .map((s) => ({ date: s.snapshot_on, remaining: s.remaining_points }));
  }
  return [{ date: todayIso, remaining: liveRemaining }];
}
