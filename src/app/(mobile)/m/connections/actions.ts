"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

const IdInput = z.object({ id: z.string().uuid() });
const AddresseeInput = z.object({ addresseeUserId: z.string().uuid() });
const RespondInput = z.object({ id: z.string().uuid(), accept: z.enum(["true", "false"]) });

/**
 * Send a connection request. RLS WITH CHECK requires requester_user_id =
 * auth.uid(), so the owner column is always the session user.
 */
export async function requestConnection(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = AddresseeInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  if (parsed.data.addresseeUserId === session.userId) {
    return { error: "You can't connect with yourself." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("connections").insert({
    requester_user_id: session.userId,
    addressee_user_id: parsed.data.addresseeUserId,
    connection_state: "pending",
  });
  if (error) return { error: error.message };

  revalidatePath("/m/connections");
  return null;
}

/**
 * Accept / decline an incoming request. Only the addressee may respond — RLS
 * permits either party to update, so we re-check addressee = session here.
 */
export async function respondConnection(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = RespondInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data: row, error: readErr } = await supabase
    .from("connections")
    .select("id, addressee_user_id, connection_state")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!row || row.addressee_user_id !== session.userId) {
    return { error: "You can only respond to your own incoming requests." };
  }

  const { error } = await supabase
    .from("connections")
    .update({
      connection_state: parsed.data.accept === "true" ? "connected" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) return { error: error.message };

  revalidatePath("/m/connections");
  return null;
}

/** Remove a connection (either party). RLS gates the delete to the two parties;
 *  the explicit party pin + read-back turn a silent RLS no-op into an honest error. */
export async function removeConnection(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = IdInput.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .delete()
    .eq("id", parsed.data.id)
    .or(`requester_user_id.eq.${session.userId},addressee_user_id.eq.${session.userId}`)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "You can only remove your own connections." };

  revalidatePath("/m/connections");
  return null;
}
