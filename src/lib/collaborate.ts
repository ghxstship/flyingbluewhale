/**
 * Collaborate — block documents (deferred item F4).
 *
 * Pure, non-server module: enum tuples, label maps, and shared types for the
 * `/studio/collaborate/docs` block-document editor. Imported by both server
 * actions and client islands, so it MUST NOT `import "server-only"`.
 *
 * Storage: `public.collab_docs` (see migration PENDING_collaborate_docs.sql).
 * The editor body is a Tiptap / ProseMirror document node persisted to the
 * `content` jsonb column.
 *
 * Multiplayer is out of scope — single-user editing, last-write-win on the
 * whole `content` blob.
 */

/** Document lifecycle (LDP `doc_state` enum — sequential macro arc). */
export const DOC_STATES = ["draft", "published", "archived"] as const;
export type DocState = (typeof DOC_STATES)[number];

export const DOC_STATE_LABEL: Record<DocState, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

/** A minimal Tiptap / ProseMirror document node. Tiptap accepts arbitrary
 *  attrs/marks per node, so the shape stays intentionally loose. */
export type TiptapDoc = {
  type: "doc";
  content?: unknown[];
};

/** The canonical empty document the editor mounts against when a row has no
 *  body yet — mirrors the DB column default. */
export const EMPTY_DOC: TiptapDoc = { type: "doc", content: [] };

export type CollabDocRow = {
  id: string;
  org_id: string;
  title: string;
  content: TiptapDoc;
  doc_state: DocState;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export function isDocState(v: unknown): v is DocState {
  return typeof v === "string" && (DOC_STATES as readonly string[]).includes(v);
}

/** Coerce arbitrary jsonb back to a usable Tiptap doc, falling back to empty. */
export function asTiptapDoc(v: unknown): TiptapDoc {
  if (v && typeof v === "object" && (v as { type?: unknown }).type === "doc") {
    return v as TiptapDoc;
  }
  return EMPTY_DOC;
}
