"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Lane = z.enum(["show", "lights", "audio", "video", "talent", "safety", "transport"]);

const Schema = z.object({
  scheduled_at: z.string().min(1),
  lane: Lane.default("show"),
  label: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  duration_seconds: z.coerce.number().int().min(0).max(86400).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCueAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse({
    scheduled_at: fd.get("scheduled_at"),
    lane: fd.get("lane"),
    label: fd.get("label"),
    description: fd.get("description"),
    duration_seconds: fd.get("duration_seconds") || undefined,
  });
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("cues").insert({
    org_id: session.orgId,
    scheduled_at: parsed.data.scheduled_at,
    lane: parsed.data.lane,
    label: parsed.data.label,
    description: parsed.data.description || null,
    duration_seconds: parsed.data.duration_seconds ?? null,
    created_by: session.userId,
  });
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/production/ros");
  revalidatePath("/m/ros");
  return null;
}

const Status = z.enum(["pending", "standby", "live", "done", "skipped"]);

// ROS (Run Of Show) is performance-time — operators legitimately need
// to override / re-fire / skip cues based on what's happening on
// stage, so we deliberately do NOT enforce FSM transition guards
// here. We DO surface validation + DB errors instead of silently
// no-op'ing as before, so a stuck cue badge in the UI matches an
// actual server-side reason rather than vanishing.
export async function setCueStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = Status.safeParse(formData.get("status"));
  if (!id) throw new Error("Missing cue id");
  if (!status.success) throw new Error("Invalid cue status");
  const supabase = await createClient();
  const { error } = await supabase
    .from("cues")
    .update({ status: status.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) throw new Error(error.message);
  revalidatePath("/console/production/ros");
  revalidatePath("/m/ros");
}

export async function deleteCue(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { error } = await supabase.from("cues").delete().eq("id", id).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete cue: ${error.message}`);
  revalidatePath("/console/production/ros");
}
