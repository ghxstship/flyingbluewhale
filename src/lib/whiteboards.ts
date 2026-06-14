/**
 * Collaborative whiteboards (deferred item F5).
 *
 * Enum tuples + derived types + label maps for the `whiteboards` table
 * (migration PENDING_collaborate_whiteboards). This is a NON-server module
 * so both the "use client" form island and the server pages/actions can
 * import the tuples — never import "server-only" here.
 *
 * Pattern matches `src/lib/goals.ts`: enum tuples `as const` → derived types
 * → label maps. Row shapes are hand-written until the typed Database is
 * regenerated post-apply; reads/writes go through the LooseSupabase cast
 * meanwhile.
 *
 * SCOPE: single-user persistence. Realtime multiplayer presence / live
 * co-editing (tldraw sync, yjs) is out of scope — the snapshot is the whole
 * document state, saved explicitly / debounced by the lone editor.
 */

// ============================================================
// Whiteboard lifecycle (cyclical operational → `whiteboard_state`)
// ============================================================
export const WHITEBOARD_STATES = ["active", "archived"] as const;
export type WhiteboardState = (typeof WHITEBOARD_STATES)[number];

export const WHITEBOARD_STATE_LABELS: Record<WhiteboardState, string> = {
  active: "Active",
  archived: "Archived",
};

// ============================================================
// Row shape (hand-written until database.types.ts regen)
// ============================================================
export type Whiteboard = {
  id: string;
  org_id: string;
  name: string;
  /** tldraw store snapshot — opaque to the app. NULL until first save. */
  snapshot: unknown;
  whiteboard_state: WhiteboardState;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** List-view projection — never ships the (potentially large) snapshot. */
export type WhiteboardListItem = Pick<
  Whiteboard,
  "id" | "name" | "whiteboard_state" | "created_at" | "updated_at"
>;
