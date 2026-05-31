"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const ClockInSchema = z.object({
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().nonnegative().optional(),
});

const BreadcrumbSchema = z.object({
  entryId: z.string().uuid(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().nonnegative().optional(),
});

export type ClockInResult = { ok: true; entryId: string; startedAt: string } | { ok: false; error: string };

export async function clockInAction(input: z.infer<typeof ClockInSchema>): Promise<ClockInResult> {
  const session = await requireSession();
  const parsed = ClockInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = (await createClient()) as unknown as LooseSupabase;

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

  const initialTrail = meta
    ? [{ lat: meta.lat, lng: meta.lng, accuracy: meta.accuracy ?? null, ts: startedAt }]
    : [];

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
      location_trail: initialTrail,
    })
    .select("id, started_at")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Could not start shift" };

  revalidatePath("/m/crew/clock");
  return { ok: true, entryId: data.id, startedAt: data.started_at };
}

// Appends a single GPS breadcrumb to an open time_entry via a DB function
// that does an atomic jsonb append. Fire-and-forget from the client every
// ~5 minutes while the shift is active.
export async function appendBreadcrumbAction(
  input: z.infer<typeof BreadcrumbSchema>,
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const parsed = BreadcrumbSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = (await createClient()) as unknown as LooseSupabase;
  const crumb = {
    lat: parsed.data.lat,
    lng: parsed.data.lng,
    accuracy: parsed.data.accuracy ?? null,
    ts: new Date().toISOString(),
  };

  await supabase.rpc("append_time_entry_breadcrumb", {
    p_entry_id: parsed.data.entryId,
    p_org_id: session.orgId,
    p_user_id: session.userId,
    p_crumb: crumb,
  });

  return { ok: true };
}

export type BlockingTask = { id: string; title: string };
export type ClockOutResult =
  | { ok: true; durationMinutes: number }
  | { ok: false; error: string }
  | { ok: false; error: "BLOCKED"; blockers: BlockingTask[] };

export async function clockOutAction(): Promise<ClockOutResult> {
  const session = await requireSession();
  const supabase = await createClient();

  // Gate: tasks this user must complete before clocking out.
  const { data: blockers } = await supabase
    .from("tasks")
    .select("id, title")
    .eq("org_id", session.orgId)
    .eq("assigned_to", session.userId)
    .eq("required_before_clockout" as never, true)
    .neq("status", "done");

  if (blockers && blockers.length > 0) {
    return { ok: false, error: "BLOCKED", blockers: blockers as BlockingTask[] };
  }

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
    .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
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
