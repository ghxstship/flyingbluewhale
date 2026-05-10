"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Field-shell clock-in / clock-out for crew.
 *
 * Persists to `public.time_entries`:
 *   - clockIn  → INSERT row with started_at=now(), ended_at=null
 *   - clockOut → UPDATE the user's most recent open row (ended_at IS NULL)
 *                with ended_at=now() + computed duration_minutes
 *
 * The "open shift" check is the crew-shell's source of truth for whether
 * a user is currently clocked in — page mount calls getOpenShift() to
 * restore state across reloads instead of trusting client memory.
 */

const ClockInSchema = z.object({
  // Optional geo coordinates from the browser (privacy-respecting; the
  // mobile UI prompts before sending). Stored in the metadata JSONB.
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional(),
});

export type ClockInResult = { ok: true; entryId: string; startedAt: string } | { ok: false; error: string };

export async function clockInAction(input: z.infer<typeof ClockInSchema>): Promise<ClockInResult> {
  const session = await requireSession();
  const parsed = ClockInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();

  // Idempotency: if the user already has an open shift, return it instead
  // of inserting a second row. Two rapid taps shouldn't create two rows.
  const { data: existing } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, entryId: existing.id, startedAt: existing.started_at };
  }

  const startedAt = new Date().toISOString();
  const meta =
    parsed.data.lat !== undefined && parsed.data.lng !== undefined
      ? { lat: parsed.data.lat, lng: parsed.data.lng, accuracy: parsed.data.accuracy ?? null }
      : null;

  const { data, error } = await supabase
    .from("time_entries")
    .insert({
      org_id: session.orgId,
      user_id: session.userId,
      started_at: startedAt,
      ended_at: null,
      duration_minutes: null,
      description: meta ? `Clock-in @ ${meta.lat.toFixed(4)},${meta.lng.toFixed(4)}` : "Clock-in",
      billable: true,
    })
    .select("id, started_at")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not start shift" };

  revalidatePath("/m/crew/clock");
  return { ok: true, entryId: data.id, startedAt: data.started_at };
}

export type ClockOutResult = { ok: true; durationMinutes: number } | { ok: false; error: string };

export async function clockOutAction(): Promise<ClockOutResult> {
  const session = await requireSession();
  const supabase = await createClient();

  // Find the user's most recent open shift. If there is none we treat
  // this as a no-op (the user is already clocked out — same outcome).
  const { data: open } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!open) return { ok: true, durationMinutes: 0 };

  const endedAt = new Date();
  const startedAt = new Date(open.started_at);
  const durationMinutes = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000));

  const { error } = await supabase
    .from("time_entries")
    .update({
      ended_at: endedAt.toISOString(),
      duration_minutes: durationMinutes,
    })
    .eq("id", open.id)
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/m/crew/clock");
  return { ok: true, durationMinutes };
}

export type OpenShift = { entryId: string; startedAt: string } | null;

export async function getOpenShiftAction(): Promise<OpenShift> {
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("time_entries")
    .select("id, started_at")
    .eq("org_id", session.orgId)
    .eq("user_id", session.userId)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { entryId: data.id, startedAt: data.started_at };
}
