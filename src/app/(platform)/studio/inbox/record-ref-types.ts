/**
 * Client-safe slice of the record-ref contract (`src/lib/chat/record-refs.ts`
 * is server-only — it does the org-scoped lookups). The island only needs
 * the resolved map shape and the pasted-link pattern.
 */
export type RecordRef = { href: string | null; label: string };
export type RecordRefMap = Record<string, RecordRef>;

/** Internal console link, absolute or origin-relative. */
export const CHAT_URL_PATTERN = /(?:https?:\/\/[^\s]+)?\/studio\/[\w\-/]+(?:\?[\w\-=&%.]*)?/g;
