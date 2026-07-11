"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NEXT_BOOKING_STATES, setBookingState, type SchedulerBookingState } from "@/lib/db/scheduler";

function detailPath(eventTypeId: string): string {
  return `/studio/scheduler/${eventTypeId}`;
}

async function guardEventType(eventTypeId: string): Promise<{ orgId: string; userId: string } | null> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduler_event_types")
    .select("id")
    .eq("id", eventTypeId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  return { orgId: session.orgId, userId: session.userId };
}

const WindowSchema = z.object({
  kind: z.enum(["weekly", "override"]),
  weekday: z.coerce.number().int().min(0).max(6).optional(),
  override_date: z.string().optional(),
  start_minute: z.coerce.number().int().min(0).max(1439),
  end_minute: z.coerce.number().int().min(1).max(1440),
  is_open: z.string().optional(),
});

export async function addAvailabilityAction(eventTypeId: string, fd: FormData): Promise<void> {
  const guard = await guardEventType(eventTypeId);
  if (!guard) return;
  const parsed = WindowSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const { kind, weekday, override_date, start_minute, end_minute } = parsed.data;
  if (start_minute >= end_minute) return;
  if (kind === "weekly" && weekday == null) return;
  if (kind === "override" && !override_date) return;
  const supabase = await createClient();
  await supabase.from("scheduler_availability").insert({
    org_id: guard.orgId,
    event_type_id: eventTypeId,
    weekday: kind === "weekly" ? weekday : null,
    override_date: kind === "override" ? override_date : null,
    start_minute,
    end_minute,
    is_open: parsed.data.is_open !== "off",
  } as never);
  revalidatePath(detailPath(eventTypeId));
}

export async function removeAvailabilityAction(eventTypeId: string, fd: FormData): Promise<void> {
  const guard = await guardEventType(eventTypeId);
  if (!guard) return;
  const windowId = String(fd.get("window_id") ?? "");
  if (!windowId) return;
  const supabase = await createClient();
  await supabase
    .from("scheduler_availability")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", windowId)
    .eq("org_id", guard.orgId)
    .eq("event_type_id", eventTypeId);
  revalidatePath(detailPath(eventTypeId));
}

export async function toggleActiveAction(eventTypeId: string, fd: FormData): Promise<void> {
  const guard = await guardEventType(eventTypeId);
  if (!guard) return;
  const next = String(fd.get("next") ?? "") === "true";
  const supabase = await createClient();
  await supabase
    .from("scheduler_event_types")
    .update({ is_active: next })
    .eq("id", eventTypeId)
    .eq("org_id", guard.orgId);
  revalidatePath(detailPath(eventTypeId));
  revalidatePath("/studio/scheduler");
}

const BookingTransitionSchema = z.object({
  booking_id: z.string().uuid(),
  from: z.enum(["booked", "rescheduled", "cancelled", "no_show"]),
  to: z.enum(["booked", "rescheduled", "cancelled", "no_show"]),
});

export async function transitionBookingAction(eventTypeId: string, fd: FormData): Promise<void> {
  const guard = await guardEventType(eventTypeId);
  if (!guard) return;
  const parsed = BookingTransitionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  const from = parsed.data.from as SchedulerBookingState;
  const to = parsed.data.to as SchedulerBookingState;
  if (!NEXT_BOOKING_STATES[from].includes(to)) return;
  await setBookingState(parsed.data.booking_id, from, to, guard.userId, "operator transition");
  revalidatePath(detailPath(eventTypeId));
}
