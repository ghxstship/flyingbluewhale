"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendChatMessage } from "@/lib/db/chat-send";

/**
 * /m/inbox/[roomId] write actions. Every send routes through the shared
 * helper (src/lib/db/chat-send.ts): org pin + membership guard, insert,
 * cursor stamps, and inbox/push fan-out to the other members.
 */

export type State = { error?: string } | null;

const MsgSchema = z.object({
  roomId: z.string().uuid(),
  body: z.string().min(1).max(4000),
});

export async function sendMessage(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = MsgSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { roomId, body } = parsed.data;
  const supabase = await createClient();

  const result = await sendChatMessage({
    supabase,
    orgId: session.orgId,
    authorId: session.userId,
    roomId,
    body,
  });
  if ("error" in result) return { error: result.error };

  revalidatePath(`/m/inbox/${roomId}`);
  return null;
}
