"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import type { AdvanceContact } from "@/lib/db/advance-packets";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  packet_id: z.string().uuid(),
  subject: z.string().max(300).optional(),
  scheduled_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * S1–S3 of the merge pipeline: pick the packet version, map the audiences,
 * resolve contacts into one recipient row each (with its unique portal
 * token, minted by the DB default). The batch lands in `draft`; preview,
 * test send, and the real send happen on the tracking board.
 */
export async function createBatchAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.prepare-advance-sends", "Only manager+ can prepare advance sends") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data: packet } = await supabase
    .from("advance_packets")
    .select("id, packet_state")
    .eq("id", parsed.data.packet_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!packet) return { error: actionErrorMessage("not-found.packet-in-org", "Packet not found in your organization") };
  if (packet.packet_state !== "live") return { error: actionErrorMessage("only-a-live-packet-can-be-sent-go-live", "Only a live packet can be sent. Go live from the packet composer first") };

  const { data: audiences } = await supabase
    .from("advance_audiences")
    .select("id, contacts")
    .eq("packet_id", packet.id)
    .is("deleted_at", null)
    .limit(500);
  const audienceRows = (audiences ?? []) as Array<{ id: string; contacts: AdvanceContact[] }>;
  const totalContacts = audienceRows.reduce((n, a) => n + (a.contacts?.length ?? 0), 0);
  if (totalContacts === 0) return { error: actionErrorMessage("the-packet-has-no-audience-contacts-to-send-to", "The packet has no audience contacts to send to") };

  const scheduledAt = parsed.data.scheduled_at ? new Date(parsed.data.scheduled_at).toISOString() : null;
  // soft-delete-exempt: insert returning id, not a read
  const { data: batch, error } = await supabase
    .from("advance_send_batches")
    .insert({
      org_id: session.orgId,
      packet_id: packet.id,
      subject: parsed.data.subject || null,
      scheduled_at: scheduledAt,
      created_by: session.userId,
    } as never)
    .select("id")
    .single();
  if (error || !batch) return actionFail(error?.message ?? "Insert failed", fd);

  const recipientRows = audienceRows.flatMap((a) =>
    (a.contacts ?? [])
      .filter((c) => c?.email)
      .map((c) => ({
        org_id: session.orgId,
        batch_id: batch.id,
        audience_id: a.id,
        contact: c,
      })),
  );
  if (recipientRows.length > 0) {
    const { error: recipientError } = await supabase.from("advance_send_recipients").insert(recipientRows as never);
    if (recipientError) return actionFail(recipientError.message, fd);
  }

  revalidatePath("/studio/comms/advances");
  redirect(`/studio/comms/advances/${batch.id}`);
}
