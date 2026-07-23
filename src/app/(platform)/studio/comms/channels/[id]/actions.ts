"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getOrgScoped } from "@/lib/db/resource";
import { ensureMyPartyId } from "@/lib/db/parties";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

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
  if (!channel) return actionFail(actionErrorMessage("not-found.channel", "Channel not found"), fd);

  // author_party_id is a parties.id, not an auth uid — the FK rejects raw uids.
  const authorPartyId = await ensureMyPartyId(session.orgId, session.userId, session.email);
  if (!authorPartyId) return actionFail(actionErrorMessage("could-not-resolve-your-party-record-in-this-workspace", "Could not resolve your party record in this workspace"), fd);

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    channel_id: parsed.data.channel_id,
    author_party_id: authorPartyId,
    body_markdown: parsed.data.body_markdown,
  });
  if (error) return actionFail(error.message, fd);

  revalidatePath(`/studio/comms/channels/${parsed.data.channel_id}`);
  return { ok: true };
}
