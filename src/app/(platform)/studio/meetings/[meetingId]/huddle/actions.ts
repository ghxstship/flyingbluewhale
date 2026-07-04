"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { canTransitionCall, type VideoCallState } from "@/lib/video";

export type State = { error?: string } | null;

const IdSchema = z.object({ meetingId: z.string().uuid(), callId: z.string().uuid() });

function huddlePath(meetingId: string) {
  return `/studio/meetings/${meetingId}/huddle`;
}

/**
 * Ensure a video_call row exists for this meeting and return its id. The
 * detail page calls this on render via getOrCreateCall; this action is the
 * write path for the "Start huddle" control when no call exists yet.
 * RLS enforces org membership + manager role on insert.
 */
export async function ensureCall(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager role required" };
  const meetingId = String(fd.get("meetingId") ?? "");
  if (!z.string().uuid().safeParse(meetingId).success) return { error: "Invalid meeting" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  // Confirm the meeting event belongs to the caller's org.
  const { data: meeting } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", meetingId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!meeting) return { error: "Meeting not found in your organization" };

  const { data: existing } = await supabase
    .from("video_calls")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("meeting_id", meetingId)
    .is("deleted_at", null)
    .maybeSingle();
  if (existing) {
    revalidatePath(huddlePath(meetingId));
    return null;
  }

  const { error } = await supabase.from("video_calls").insert({
    org_id: session.orgId,
    meeting_id: meetingId,
    title: (meeting as { name?: string }).name ?? "Huddle",
    call_state: "scheduled",
    created_by: session.userId,
  });
  if (error) return { error: error.message };

  revalidatePath(huddlePath(meetingId));
  return null;
}

/** Move a call along its lifecycle (scheduled → live → ended), guarded by NEXT_VIDEO_CALL_STATES. */
export async function transitionCall(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager role required" };
  const parsed = IdSchema.safeParse({ meetingId: fd.get("meetingId"), callId: fd.get("callId") });
  if (!parsed.success) return { error: "Invalid request" };
  const to = String(fd.get("to") ?? "") as VideoCallState;
  if (!(["scheduled", "live", "ended"] as const).includes(to)) return { error: "Invalid state" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: call } = await supabase
    .from("video_calls")
    .select("id, call_state")
    .eq("id", parsed.data.callId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!call) return { error: "Call not found" };
  const from = (call as { call_state: VideoCallState }).call_state;
  if (!canTransitionCall(from, to)) return { error: `Cannot move from ${from} to ${to}` };

  const patch: Record<string, unknown> = { call_state: to };
  if (to === "live") patch.started_at = new Date().toISOString();
  if (to === "ended") patch.ended_at = new Date().toISOString();

  const { error } = await supabase
    .from("video_calls")
    .update(patch)
    .eq("id", parsed.data.callId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };

  revalidatePath(huddlePath(parsed.data.meetingId));
  return null;
}

/** Join the room — idempotent upsert on (org, call, user); clears any prior left_at. */
export async function joinCall(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = IdSchema.safeParse({ meetingId: fd.get("meetingId"), callId: fd.get("callId") });
  if (!parsed.success) return { error: "Invalid request" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: call } = await supabase
    .from("video_calls")
    .select("id, call_state, created_by")
    .eq("id", parsed.data.callId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!call) return { error: "Call not found" };
  if ((call as { call_state: VideoCallState }).call_state === "ended") return { error: "This call has ended" };

  const role = (call as { created_by: string | null }).created_by === session.userId ? "host" : "participant";

  const { error } = await supabase.from("video_call_participants").upsert(
    {
      org_id: session.orgId,
      call_id: parsed.data.callId,
      user_id: session.userId,
      role,
      joined_at: new Date().toISOString(),
      left_at: null,
    },
    { onConflict: "org_id,call_id,user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath(huddlePath(parsed.data.meetingId));
  return null;
}

/** Leave the room — stamps left_at on the caller's participant row. */
export async function leaveCall(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = IdSchema.safeParse({ meetingId: fd.get("meetingId"), callId: fd.get("callId") });
  if (!parsed.success) return { error: "Invalid request" };
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { error } = await supabase
    .from("video_call_participants")
    .update({ left_at: new Date().toISOString() })
    .eq("org_id", session.orgId)
    .eq("call_id", parsed.data.callId)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };

  revalidatePath(huddlePath(parsed.data.meetingId));
  return null;
}
