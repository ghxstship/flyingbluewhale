/**
 * F1 — Meeting notetaker shared types + labels.
 *
 * Client-safe module (NO `server-only`): enum tuples, the action-item shape,
 * and label maps live here so both server actions and any client island can
 * import them. The AI summarization call lives in the server-only sibling
 * `src/lib/ai/meeting-summary.ts`.
 *
 * Backing table `public.meeting_notes` is not yet in database.types.ts, so
 * call sites reach for `LooseSupabase` until types are regenerated.
 */

export const NOTE_STATES = ["draft", "summarized", "archived"] as const;
export type NoteState = (typeof NOTE_STATES)[number];

export const NOTE_STATE_LABEL: Record<NoteState, string> = {
  draft: "Draft",
  summarized: "Summarized",
  archived: "Archived",
};

/**
 * One extracted action item. `task_id` is populated once the item has been
 * pushed into `public.tasks` — its presence is how we avoid double-creating
 * tasks on a re-run of "Create tasks from action items".
 */
export type ActionItem = {
  text: string;
  owner?: string | null;
  due?: string | null;
  task_id?: string | null;
};

/** Narrow an unknown jsonb value (from the DB) to a typed ActionItem[]. */
export function parseActionItems(raw: unknown): ActionItem[] {
  if (!Array.isArray(raw)) return [];
  const out: ActionItem[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.text !== "string" || o.text.trim() === "") continue;
    out.push({
      text: o.text,
      owner: typeof o.owner === "string" ? o.owner : null,
      due: typeof o.due === "string" ? o.due : null,
      task_id: typeof o.task_id === "string" ? o.task_id : null,
    });
  }
  return out;
}
