"use client";

import { STORY_STATES, STORY_STATE_LABELS, groupByState } from "@/lib/sprints";
import type { SprintStory, StoryState } from "@/lib/sprints";
import { moveStoryAction } from "./actions";

/**
 * Kanban board for a sprint's stories, grouped by story_state. Each card
 * carries inline "move" forms (server action) so a card can advance or
 * retreat one column without client state — the action revalidates the
 * page. Manager-only: the page mounts this only for manager+, and the
 * action re-guards server-side.
 */
export function KanbanBoard({
  projectId,
  stories,
  canWrite,
}: {
  projectId: string;
  stories: SprintStory[];
  canWrite: boolean;
}) {
  const cols = groupByState(stories);
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {STORY_STATES.map((state) => (
        <div key={state} className="surface-inset rounded-md p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-medium tracking-[0.18em] text-[var(--p-text-2)] uppercase">
              {STORY_STATE_LABELS[state]}
            </span>
            <span className="font-mono text-[11px] text-[var(--p-text-2)]">{cols[state].length}</span>
          </div>
          <ul className="space-y-2">
            {cols[state].map((story) => (
              <li key={story.id} className="surface rounded-md p-2.5 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[var(--p-text-1)]">{story.title}</span>
                  <span className="shrink-0 rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--p-text-2)]">
                    {story.points}
                  </span>
                </div>
                {canWrite && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {STORY_STATES.filter((s) => s !== story.story_state).map((target) => (
                      <MoveButton
                        key={target}
                        projectId={projectId}
                        storyId={story.id}
                        target={target}
                      />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MoveButton({
  projectId,
  storyId,
  target,
}: {
  projectId: string;
  storyId: string;
  target: StoryState;
}) {
  return (
    <form action={moveStoryAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="storyId" value={storyId} />
      <input type="hidden" name="story_state" value={target} />
      <button
        type="submit"
        className="press-scale rounded border border-[var(--p-border)] px-1.5 py-0.5 text-[11px] text-[var(--p-text-2)] hover:text-[var(--p-text-1)]"
      >
        → {STORY_STATE_LABELS[target]}
      </button>
    </form>
  );
}
