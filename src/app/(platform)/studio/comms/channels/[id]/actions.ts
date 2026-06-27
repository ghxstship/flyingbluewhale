"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  channel_id: z.string().uuid(),
  body_markdown: z.string().min(1).max(10000),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function postMessage(_: State, fd: FormData): Promise<State> {
  // Any member may post a message — no manager gate.
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);

  // `messages` has no org_id; scope through the channel. Verify the channel
  // belongs to the caller's org before writing into it.
  const channel = await getOrgScoped("message_channels", session.orgId, parsed.data.channel_id);
  if (!channel) return actionFail("Channel not found", fd);

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    channel_id: parsed.data.channel_id,
    author_party_id: session.userId,
    body_markdown: parsed.data.body_markdown,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/comms/channels/${parsed.data.channel_id}`);
  return { ok: true };
}
