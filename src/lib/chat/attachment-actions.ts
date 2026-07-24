"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ChatAttachment } from "./attachment-types";

/**
 * Chat attachment write path — shared by the console inbox and the COMPVSS
 * field inbox (same `chat_rooms`/`chat_room_members`/`chat_messages` stores,
 * so one action; each shell passes its own `revalidate` path, the
 * docs-action pattern).
 *
 * Guards mirror `sendMessage`/`sendConsoleMessage` exactly: org pin +
 * explicit membership check (RLS backstops both). The upload rides the
 * caller's own client — `storage_org_scoped_upload` admits the
 * `chat-attachments` bucket only under the caller's org prefix, so a crafted
 * path into another tenant's folder is denied at the policy, not just here.
 *
 * MIME allowlist: images + PDF only. Chat is a conversation surface, not a
 * file drop — and everything here is served back via signed URLs, so active
 * content (html/svg) stays out for the same XSS reason as the advancing
 * bucket.
 */

const ATTACH_ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const SendSchema = z.object({
  roomId: z.string().uuid(),
  revalidate: z.string().min(1).max(200),
});

export type AttachmentState = { error?: string } | null;

export async function sendChatAttachment(_prev: AttachmentState, fd: FormData): Promise<AttachmentState> {
  const session = await requireSession();
  const parsed = SendSchema.safeParse({ roomId: fd.get("roomId"), revalidate: fd.get("revalidate") });
  if (!parsed.success) return { error: "Invalid input" };
  const { roomId, revalidate } = parsed.data;

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to send." };
  if (file.size > MAX_ATTACHMENT_BYTES) return { error: "Attachments are capped at 10 MB." };
  const mime = (file.type || "").toLowerCase();
  if (!ATTACH_ALLOWED_MIME.has(mime)) return { error: "Photos and PDFs only." };

  const supabase = await createClient();

  const { data: room } = await supabase
    .from("chat_rooms")
    .select("id, org_id")
    .eq("id", roomId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!room) return { error: "Thread not found." };

  const { data: member } = await supabase
    .from("chat_room_members")
    .select("room_id")
    .eq("room_id", roomId)
    .eq("user_id", session.userId)
    .maybeSingle();
  if (!member) return { error: "You are not a member of this thread." };

  const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${session.orgId}/${roomId}/${Date.now()}-${safeName}`;
  const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(path, file, {
    contentType: mime,
    upsert: false,
  });
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` };

  const attachment: ChatAttachment = { path, name: safeName, mime, size: file.size };
  const now = new Date().toISOString();
  const { error: msgError } = await supabase.from("chat_messages").insert({
    org_id: session.orgId,
    room_id: roomId,
    author_id: session.userId,
    body: safeName,
    attachments: [attachment],
  });
  if (msgError) return { error: msgError.message };

  await Promise.all([
    supabase.from("chat_rooms").update({ last_message_at: now }).eq("id", roomId),
    supabase.from("chat_room_members").update({ last_read_at: now }).eq("room_id", roomId).eq("user_id", session.userId),
  ]);

  revalidatePath(revalidate);
  return null;
}

const SignSchema = z.object({ path: z.string().min(1).max(400) });

/**
 * Mint a 5-minute signed URL for a chat attachment. The org-prefix check is
 * belt; the `storage_org_scoped_read` policy on the caller's client is
 * braces — a member of the org can read, nobody else can.
 */
export async function signChatAttachmentUrl(input: { path: string }): Promise<string | null> {
  const session = await requireSession();
  const parsed = SignSchema.safeParse(input);
  if (!parsed.success) return null;
  if (!parsed.data.path.startsWith(`${session.orgId}/`)) return null;

  const supabase = await createClient();
  const { data: signed } = await supabase.storage.from("chat-attachments").createSignedUrl(parsed.data.path, 300);
  return signed?.signedUrl ?? null;
}
