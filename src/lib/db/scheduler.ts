import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Bespoke scheduler domain lib (kit 27, Phase 4). Read helpers +
 * ledgered booking transitions; slot math lives in
 * `src/lib/scheduler/slots.ts` (pure) and the anonymous /book/[token]
 * flow goes through the service-role client in its server actions.
 */

export const SCHEDULER_LOCATION_KINDS = ["call", "on_site"] as const;
export type SchedulerLocationKind = (typeof SCHEDULER_LOCATION_KINDS)[number];

export const SCHEDULER_BOOKING_STATES = ["booked", "rescheduled", "cancelled", "no_show"] as const;
export type SchedulerBookingState = (typeof SCHEDULER_BOOKING_STATES)[number];

export const NEXT_BOOKING_STATES: Record<SchedulerBookingState, SchedulerBookingState[]> = {
  booked: ["rescheduled", "cancelled", "no_show"],
  rescheduled: ["rescheduled", "cancelled", "no_show"],
  cancelled: [],
  no_show: [],
};

export type SchedulerEventType = {
  id: string;
  org_id: string;
  owner_id: string | null;
  name: string;
  description: string | null;
  duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_per_day: number | null;
  location_kind: SchedulerLocationKind;
  round_robin_pool: string[];
  redirect_url: string | null;
  timezone: string;
  is_active: boolean;
  public_token: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SchedulerAvailability = {
  id: string;
  org_id: string;
  event_type_id: string;
  weekday: number | null;
  override_date: string | null;
  start_minute: number;
  end_minute: number;
  is_open: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type SchedulerBooking = {
  id: string;
  org_id: string;
  event_type_id: string;
  recipient_id: string | null;
  assigned_host_id: string | null;
  invitee_name: string | null;
  invitee_email: string;
  invitee_timezone: string | null;
  starts_at: string;
  ends_at: string;
  booking_state: SchedulerBookingState;
  reschedule_token: string;
  cancel_token: string;
  external_calendar_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export async function listEventTypes(orgId: string): Promise<SchedulerEventType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduler_event_types")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as SchedulerEventType[];
}

export async function getEventType(orgId: string, id: string): Promise<SchedulerEventType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduler_event_types")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as SchedulerEventType) ?? null;
}

export async function listAvailability(eventTypeId: string): Promise<SchedulerAvailability[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scheduler_availability")
    .select("*")
    .eq("event_type_id", eventTypeId)
    .is("deleted_at", null)
    .order("weekday", { ascending: true })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as unknown as SchedulerAvailability[];
}

export async function listBookings(orgId: string, eventTypeId?: string): Promise<SchedulerBooking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("scheduler_bookings")
    .select("*")
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: false })
    .limit(500);
  if (eventTypeId) query = query.eq("event_type_id", eventTypeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as SchedulerBooking[];
}

/**
 * Ledgered booking transition. Conditional update on the read state so a
 * concurrent transition no-ops; every real edge appends one ledger row.
 */
export async function setBookingState(
  bookingId: string,
  from: SchedulerBookingState,
  to: SchedulerBookingState,
  userId?: string,
  reason?: string,
): Promise<boolean> {
  const supabase = await createClient();
  // soft-delete-exempt: state-guarded transition update returning org_id, not a read
  const { data, error } = await supabase
    .from("scheduler_bookings")
    .update({ booking_state: to })
    .eq("id", bookingId)
    .eq("booking_state", from)
    .select("org_id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return false;
  await supabase.from("scheduler_booking_state_transitions").insert({
    org_id: (data as { org_id: string }).org_id,
    booking_id: bookingId,
    from_state: from,
    to_state: to,
    transitioned_by: userId ?? null,
    reason: reason ?? null,
  });
  return true;
}
