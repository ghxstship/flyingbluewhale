"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { computeSlots } from "@/lib/scheduler/slots";
import { buildIcs } from "@/lib/scheduler/ics";
import { sendEmail } from "@/lib/email";
import { urlFor } from "@/lib/urls";
import { formatDateParts } from "@/lib/i18n/format";
import { schedulerBookingEmail } from "@/components/email/templates";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Anonymous booking actions (kit 27, Phase 4). The event type's
 * public_token is the only credential; all writes go through the
 * service-role client with the token re-resolved server-side. Slot
 * legality is recomputed at write time so a stale page can't book a
 * window that closed.
 */

export type BookState = { error?: string } | null;

const BookingSchema = z.object({
  slot: z.string().min(10),
  invitee_name: z.string().min(1).max(200),
  invitee_email: z.string().email().max(320),
  invitee_timezone: z.string().max(64).optional(),
  notes: z.string().max(1000).optional(),
  recipient_token: z.string().max(80).optional(),
  reschedule_token: z.string().max(80).optional(),
});

type EventTypeRow = {
  id: string;
  org_id: string;
  name: string;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_per_day: number | null;
  location_kind: string;
  round_robin_pool: string[];
  redirect_url: string | null;
  timezone: string;
  is_active: boolean;
  public_token: string;
};

async function resolveEventType(svc: LooseSupabase, token: string): Promise<EventTypeRow | null> {
  const { data } = (await svc
    .from("scheduler_event_types")
    .select(
      "id, org_id, name, duration_minutes, buffer_before_minutes, buffer_after_minutes, min_notice_minutes, max_per_day, location_kind, round_robin_pool, redirect_url, timezone, is_active, public_token",
    )
    .eq("public_token", token)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle()) as { data: EventTypeRow | null };
  return data;
}

export async function createBookingAction(token: string, _: BookState, fd: FormData): Promise<BookState> {
  if (!isServiceClientAvailable()) return { error: "Booking is unavailable right now" };
  const parsed = BookingSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Check the form: name, email, and a time slot are required" };
  const svc = createServiceClient() as unknown as LooseSupabase;
  const eventType = await resolveEventType(svc, token);
  if (!eventType) return { error: "This booking link is no longer active" };

  const start = new Date(parsed.data.slot);
  if (Number.isNaN(start.getTime())) return { error: "Pick a time slot" };
  const end = new Date(start.getTime() + eventType.duration_minutes * 60000);

  // Recompute legality against live availability + bookings.
  const [{ data: windows }, { data: bookings }] = (await Promise.all([
    svc
      .from("scheduler_availability")
      .select("weekday, override_date, start_minute, end_minute, is_open")
      .eq("event_type_id", eventType.id)
      .is("deleted_at", null)
      .limit(200),
    svc
      .from("scheduler_bookings")
      .select("starts_at, ends_at, booking_state")
      .eq("event_type_id", eventType.id)
      .gte("starts_at", new Date(Date.now() - 86400000).toISOString())
      .is("deleted_at", null)
      .limit(1000),
  ])) as [
    { data: Array<{ weekday: number | null; override_date: string | null; start_minute: number; end_minute: number; is_open: boolean }> | null },
    { data: Array<{ starts_at: string; ends_at: string; booking_state: string }> | null },
  ];
  const open = computeSlots({
    eventType,
    windows: windows ?? [],
    bookings: bookings ?? [],
    from: new Date(start.getTime() - 86400000),
    days: 3,
  });
  if (!open.some((s) => s.getTime() === start.getTime())) {
    return { error: "That slot was just taken. Pick another time" };
  }

  // Round-robin host assignment: least-loaded member of the pool.
  let hostId: string | null = null;
  if (eventType.round_robin_pool.length > 0) {
    const loads = new Map<string, number>(eventType.round_robin_pool.map((id) => [id, 0]));
    const { data: hostLoads } = (await svc
      .from("scheduler_bookings")
      .select("assigned_host_id")
      .eq("event_type_id", eventType.id)
      .in("booking_state", ["booked", "rescheduled"])
      .is("deleted_at", null)
      .limit(1000)) as { data: Array<{ assigned_host_id: string | null }> | null };
    for (const row of hostLoads ?? []) {
      if (row.assigned_host_id && loads.has(row.assigned_host_id)) {
        loads.set(row.assigned_host_id, (loads.get(row.assigned_host_id) ?? 0) + 1);
      }
    }
    hostId = [...loads.entries()].sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
  }

  // Advance-recipient linkage (per-audience booking links from the packet).
  let recipientId: string | null = null;
  if (parsed.data.recipient_token) {
    const { data: recipient } = (await svc
      .from("advance_send_recipients")
      .select("id, org_id")
      .eq("portal_token", parsed.data.recipient_token)
      .eq("org_id", eventType.org_id)
      .is("deleted_at", null)
      .maybeSingle()) as { data: { id: string } | null };
    recipientId = recipient?.id ?? null;
  }

  // soft-delete-exempt: insert returning tokens, not a read
  const { data: booking, error } = (await svc
    .from("scheduler_bookings")
    .insert({
      org_id: eventType.org_id,
      event_type_id: eventType.id,
      recipient_id: recipientId,
      assigned_host_id: hostId,
      invitee_name: parsed.data.invitee_name,
      invitee_email: parsed.data.invitee_email.toLowerCase(),
      invitee_timezone: parsed.data.invitee_timezone || null,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      notes: parsed.data.notes || null,
    })
    .select("id, reschedule_token, cancel_token")
    .single()) as { data: { id: string; reschedule_token: string; cancel_token: string } | null; error: { message: string } | null };
  if (error || !booking) return { error: error?.message ?? "Booking failed" };
  await svc.from("scheduler_booking_state_transitions").insert({
    org_id: eventType.org_id,
    booking_id: booking.id,
    from_state: null,
    to_state: "booked",
    reason: "public booking",
  });

  // Rescheduling closes out the prior booking on the same ledger.
  if (parsed.data.reschedule_token) {
    const { data: prior } = (await svc
      .from("scheduler_bookings")
      .select("id, booking_state")
      .eq("reschedule_token", parsed.data.reschedule_token)
      .eq("org_id", eventType.org_id)
      .neq("id", booking.id)
      .is("deleted_at", null)
      .maybeSingle()) as { data: { id: string; booking_state: string } | null };
    if (prior && (prior.booking_state === "booked" || prior.booking_state === "rescheduled")) {
      await svc.from("scheduler_bookings").update({ booking_state: "rescheduled" }).eq("id", prior.id);
      await svc.from("scheduler_booking_state_transitions").insert({
        org_id: eventType.org_id,
        booking_id: prior.id,
        from_state: prior.booking_state,
        to_state: "rescheduled",
        reason: `superseded by ${booking.id}`,
      });
    }
  }

  // Confirmation email with ICS + reschedule/cancel links (Calendly parity).
  const displayTz = parsed.data.invitee_timezone || eventType.timezone;
  const whenLabel = formatDateParts(
    start,
    { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" },
    { timezone: displayTz },
  );
  const baseUrl = urlFor("marketing", `/book/${eventType.public_token}`);
  const rescheduleUrl = `${baseUrl}?reschedule=${booking.reschedule_token}`;
  const cancelUrl = `${baseUrl}?cancel=${booking.cancel_token}`;
  const rendered = schedulerBookingEmail({
    inviteeName: parsed.data.invitee_name,
    eventName: eventType.name,
    whenLabel,
    durationMinutes: eventType.duration_minutes,
    locationLabel: eventType.location_kind === "call" ? "Call" : "On Site",
    rescheduleUrl,
    cancelUrl,
  });
  const ics = buildIcs({
    uid: `${booking.id}@atlvs.pro`,
    start,
    end,
    summary: eventType.name,
    description: `Booked via ATLVS. Reschedule: ${rescheduleUrl}`,
    location: eventType.location_kind === "call" ? "Call" : "On Site",
    attendeeEmail: parsed.data.invitee_email,
    attendeeName: parsed.data.invitee_name,
    url: rescheduleUrl,
  });
  await sendEmail({
    to: parsed.data.invitee_email,
    subject: rendered.subject,
    html: rendered.html,
    attachments: [{ filename: "booking.ics", content: Buffer.from(ics, "utf8"), contentType: "text/calendar" }],
  });

  revalidatePath(`/book/${token}`);
  if (eventType.redirect_url) redirect(eventType.redirect_url);
  redirect(`/book/${token}?booked=1`);
}

export async function cancelBookingAction(token: string, cancelToken: string): Promise<void> {
  if (!isServiceClientAvailable()) return;
  const svc = createServiceClient() as unknown as LooseSupabase;
  const eventType = await resolveEventType(svc, token);
  if (!eventType) return;
  const { data: booking } = (await svc
    .from("scheduler_bookings")
    .select("id, booking_state")
    .eq("cancel_token", cancelToken)
    .eq("org_id", eventType.org_id)
    .is("deleted_at", null)
    .maybeSingle()) as { data: { id: string; booking_state: string } | null };
  if (!booking || (booking.booking_state !== "booked" && booking.booking_state !== "rescheduled")) return;
  await svc.from("scheduler_bookings").update({ booking_state: "cancelled" }).eq("id", booking.id);
  await svc.from("scheduler_booking_state_transitions").insert({
    org_id: eventType.org_id,
    booking_id: booking.id,
    from_state: booking.booking_state,
    to_state: "cancelled",
    reason: "cancelled by invitee",
  });
  redirect(`/book/${token}?cancelled=1`);
}
