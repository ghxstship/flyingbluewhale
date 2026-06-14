"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import {
  BOOKING_STATES,
  SPACE_STATES,
  canTransitionBooking,
  type BookingState,
} from "@/lib/function_diary";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

// ── Bookings ─────────────────────────────────────────────────────────
const BookingSchema = z
  .object({
    space_id: z.string().uuid("Pick a space"),
    project_id: z.string().uuid().optional().or(z.literal("")),
    client_id: z.string().uuid().optional().or(z.literal("")),
    title: z.string().min(1, "Title is required").max(200),
    starts_at: z.string().min(1, "Start is required"),
    ends_at: z.string().min(1, "End is required"),
    booking_state: z.enum(BOOKING_STATES),
    headcount: z.coerce.number().int().min(0).optional().or(z.literal("")),
    notes: z.string().max(4000).optional().or(z.literal("")),
  })
  .refine((v) => new Date(v.ends_at) > new Date(v.starts_at), {
    message: "End must be after start",
    path: ["ends_at"],
  });

function normHeadcount(v: number | "" | undefined): number | null {
  return typeof v === "number" ? v : null;
}

export async function createBookingAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create bookings" };
  const parsed = BookingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("function_bookings")
    .insert({
      org_id: session.orgId,
      space_id: parsed.data.space_id,
      project_id: parsed.data.project_id || null,
      client_id: parsed.data.client_id || null,
      title: parsed.data.title,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      booking_state: parsed.data.booking_state,
      headcount: normHeadcount(parsed.data.headcount),
      notes: parsed.data.notes || null,
      created_by: session.userId,
    })
    .select()
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/sales/diary");
  redirect(`/console/sales/diary/${data.id}`);
}

const UpdateBookingSchema = BookingSchema;

export async function updateBookingAction(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit bookings" };
  const parsed = UpdateBookingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase
    .from("function_bookings")
    .update({
      space_id: parsed.data.space_id,
      project_id: parsed.data.project_id || null,
      client_id: parsed.data.client_id || null,
      title: parsed.data.title,
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      booking_state: parsed.data.booking_state,
      headcount: normHeadcount(parsed.data.headcount),
      notes: parsed.data.notes || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) return actionFail(error.message, fd);
  revalidatePath(`/console/sales/diary/${id}`);
  revalidatePath("/console/sales/diary");
  redirect(`/console/sales/diary/${id}`);
}

/** State-machine transition from the detail view (hold → confirmed, etc.). */
export async function transitionBookingAction(id: string, fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) throw new Error("Only manager+ can change booking state");
  const next = String(fd.get("booking_state") ?? "") as BookingState;
  if (!BOOKING_STATES.includes(next)) throw new Error("Unknown booking state");
  const supabase = await createClient();
  const { data: current, error: readErr } = await supabase
    .from("function_bookings")
    .select("booking_state")
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (readErr) throw new Error(readErr.message);
  if (!current) throw new Error("Booking not found");
  const from = current.booking_state as BookingState;
  if (!canTransitionBooking(from, next)) {
    throw new Error(`Illegal transition ${from} → ${next}`);
  }
  const { error } = await supabase
    .from("function_bookings")
    .update({ booking_state: next })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
  revalidatePath(`/console/sales/diary/${id}`);
  revalidatePath("/console/sales/diary");
}

export async function deleteBooking(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("function_bookings")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (error) throw new Error(`Could not delete booking: ${error.message}`);
  revalidatePath("/console/sales/diary");
}

// ── Spaces ───────────────────────────────────────────────────────────
const SpaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  venue: z.string().max(200).optional().or(z.literal("")),
  capacity: z.coerce.number().int().min(0).optional().or(z.literal("")),
  space_state: z.enum(SPACE_STATES),
  notes: z.string().max(4000).optional().or(z.literal("")),
});

export async function createSpaceAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create spaces" };
  const parsed = SpaceSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("function_spaces").insert({
    org_id: session.orgId,
    name: parsed.data.name,
    venue: parsed.data.venue || null,
    capacity: typeof parsed.data.capacity === "number" ? parsed.data.capacity : null,
    space_state: parsed.data.space_state,
    notes: parsed.data.notes || null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/sales/diary");
  revalidatePath("/console/sales/diary/spaces");
  redirect("/console/sales/diary/spaces");
}
