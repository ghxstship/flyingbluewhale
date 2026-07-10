"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionFail, formFail } from "@/lib/forms/fail";
import { emitAudit } from "@/lib/audit";
import { RESERVATION_STATES, canTransitionReservation, type ReservationState } from "@/lib/reservations";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

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

/**
 * v7.8 record action — "Confirm → Create Event". A booked reservation
 * confirms into a live event: creates a projects row pre-filled from
 * the reservation (name, start date, guest context) and patches the
 * source with a `[project:<id>]` marker in its notes (reservations has
 * no project FK; the marker is both the back-link and the idempotency
 * probe). The reservation's own FSM is untouched — booked IS the
 * confirmed state in that lifecycle.
 */
export async function confirmReservationCreateEventAction(reservationId: string): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create events" };
  const supabase = await createClient();

  const { data: res } = await supabase
    .from("reservations")
    .select("id, guest_name, party_size, reserved_for, reservation_state, notes, contact_email, contact_phone")
    .eq("org_id", session.orgId)
    .eq("id", reservationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!res) return { error: "Reservation not found" };

  // Idempotency: a prior conversion left its project marker in notes.
  const linkedProjectId = res.notes?.match(/\[project:([0-9a-f-]{36})\]/)?.[1];
  if (linkedProjectId) {
    const { data: linked } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", linkedProjectId)
      .is("deleted_at", null)
      .maybeSingle();
    if (linked) redirect(`/studio/projects/${linked.id}`);
  }

  if (res.reservation_state !== "booked") {
    return { error: `Only a booked reservation can become an event (currently ${res.reservation_state})` };
  }

  const eventDate = res.reserved_for.slice(0, 10);
  const name = `${res.guest_name} · ${eventDate}`;
  const baseSlug = slugify(name) || `event-${reservationId.slice(0, 8)}`;
  let slug = baseSlug;
  for (let suffix = 2; suffix <= 99; suffix++) {
    const { data: clash } = await supabase
      .from("projects")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("slug", slug)
      .maybeSingle();
    if (!clash) break;
    slug = `${baseSlug}-${suffix}`;
    if (suffix === 99) return { error: "Could not derive a unique event slug" };
  }

  const descriptionLines = [
    `Created from reservation ${reservationId}`,
    `Guest: ${res.guest_name} · Party of ${res.party_size}`,
    res.contact_email ? `Email: ${res.contact_email}` : null,
    res.contact_phone ? `Phone: ${res.contact_phone}` : null,
  ].filter(Boolean);

  const { data: project, error: insertError } = await supabase
    .from("projects")
    .insert({
      org_id: session.orgId,
      slug,
      name,
      description: descriptionLines.join("\n"),
      project_state: "active",
      xpms_phase: "Discovery",
      start_date: eventDate,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  // Patch the source with the back-link marker.
  const patchedNotes = [res.notes?.trim() || null, `[project:${project.id}]`].filter(Boolean).join("\n");
  await supabase
    .from("reservations")
    .update({ notes: patchedNotes })
    .eq("org_id", session.orgId)
    .eq("id", reservationId);

  await emitAudit({
    actorId: session.userId,
    orgId: session.orgId,
    actorEmail: session.email,
    action: "reservation.event_created",
    targetTable: "projects",
    targetId: project.id,
    metadata: { reservationId },
  });

  revalidatePath("/studio/operations/reservations");
  revalidatePath(`/studio/operations/reservations/${reservationId}`);
  revalidatePath("/studio/projects");
  redirect(`/studio/projects/${project.id}`);
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
  // No redirect — DeleteForm's undo flow navigates client-side after
  // showing the "Deleted" toast with its Undo action (REC-14).
}
