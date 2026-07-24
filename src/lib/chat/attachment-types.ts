/**
 * Chat attachments — shared client-safe types.
 *
 * `chat_messages.attachments` (jsonb, default `[]`) shipped with the 0046
 * schema and stayed a dead column for a year: no writer, no reader, no
 * storage bucket. This module is the vocabulary both shells share now that
 * the loop is closed (bucket `chat-attachments`, migration
 * 20260724131547).
 */

export type ChatAttachment = {
  /** Storage object path inside the chat-attachments bucket: {orgId}/{roomId}/{ts}-{name}. */
  path: string;
  /** Original (sanitized) filename shown on the chip. */
  name: string;
  mime: string;
  size: number;
};

/** Defensive jsonb → typed list. Unknown shapes drop silently. */
export function parseAttachments(value: unknown): ChatAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (a): a is ChatAttachment =>
      typeof a === "object" &&
      a !== null &&
      typeof (a as ChatAttachment).path === "string" &&
      typeof (a as ChatAttachment).name === "string",
  );
}

export function isImageAttachment(a: ChatAttachment): boolean {
  return typeof a.mime === "string" && a.mime.startsWith("image/");
}
