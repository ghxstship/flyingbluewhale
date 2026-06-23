"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { RESERVATION_STATES, canTransitionReservation, type ReservationState } from "@/lib/reservations";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

const CreateSchema = z.object({
  guest_name: z.string().min(1).max(120),
  party_size: z.coerce.number().int().min(1).max(100),
  reserved_for: z.string().min(1),
  table_id: z.string().uuid().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(2000).optional(),
});

export async function createReservation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create reservations" };
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // If a table was chosen, confirm it belongs to this org.
  if (parsed.data.table_id) {
    const { data: tbl } = await supabase
      .from("venue_tables")
      .select("id")
      .eq("id", parsed.data.table_id)
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .maybeSingle();
    if (!tbl) return actionFail("Table not found in your organization", fd);
  }

  const { data: row, error } = await supabase
    .from("reservations")
    .insert({
      org_id: session.orgId,
      table_id: parsed.data.table_id || null,
      guest_name: parsed.data.guest_name,
      party_size: parsed.data.party_size,
      reserved_for: new Date(parsed.data.reserved_for).toISOString(),
      contact_phone: parsed.data.contact_phone || null,
      contact_email: parsed.data.contact_email || null,
      notes: parsed.data.notes || null,
      reservation_state: "booked",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/operations/reservations");
  redirect(`/studio/operations/reservations/${(row as { id: string }).id}`);
}

const TransitionSchema = z.object({
  reservation_id: z.string().uuid(),
  to_state: z.enum(RESERVATION_STATES),
});

export async function transitionReservation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can update reservations" };
  const parsed = TransitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid transition" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: current } = await supabase
    .from("reservations")
    .select("id, reservation_state")
    .eq("id", parsed.data.reservation_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!current) return { error: "Reservation not found" };

  const from = (current as { reservation_state: ReservationState }).reservation_state;
  const to = parsed.data.to_state;
  if (from !== to && !canTransitionReservation(from, to)) {
    return { error: `Cannot move a reservation from ${from} to ${to}` };
  }

  const { error } = await supabase
    .from("reservations")
    .update({ reservation_state: to })
    .eq("id", parsed.data.reservation_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath("/studio/operations/reservations");
  revalidatePath(`/studio/operations/reservations/${parsed.data.reservation_id}`);
  return { ok: true };
}

export async function deleteReservation(reservationId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase
    .from("reservations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", reservationId)
    .eq("org_id", session.orgId);
  revalidatePath("/studio/operations/reservations");
  redirect("/studio/operations/reservations");
}
