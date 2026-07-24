"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { actionError, actionErrorMessage } from "@/lib/errors";
import { actionFail, formFail } from "@/lib/forms/fail";
import { SESSION_KINDS, SESSION_STATES } from "@/lib/legend_live";
import { NEXT_SESSION_STATES, canTransition } from "@/lib/legend_teach";

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

/**
 * LEG3ND live-session authoring (PERSONA_MATRIX blocker B-2) — schedule /
 * edit / run / cancel the sessions the existing /legend/live registration
 * UX consumes. Manager+ band; LDP `session_state` transitions are forward-
 * only (scheduled → live → ended; cancel from scheduled/live) per
 * NEXT_SESSION_STATES.
 */

const SCHEDULE_GATE = () =>
  actionError("auth.manager-plus.schedule-live-sessions", "Only manager+ can schedule live sessions");

async function requireHost() {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { session, denied: SCHEDULE_GATE() };
  return { session, denied: null };
}

const SessionSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(160),
    description: z.string().max(4000).optional().or(z.literal("")),
    kind: z.enum(SESSION_KINDS),
    course_id: z.string().uuid().optional().or(z.literal("")),
    starts_at: z.string().min(1, "Start time is required"),
    duration_minutes: z.coerce.number().int().min(1).max(1440).default(60),
    capacity: z
      .union([z.literal(""), z.coerce.number().int().min(1).max(100000)])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    location: z.string().max(300).optional().or(z.literal("")),
    join_url: z.string().url().optional().or(z.literal("")),
    host_id: z.string().uuid().optional().or(z.literal("")),
    host_name: z.string().max(160).optional().or(z.literal("")),
  })
  .superRefine((d, ctx) => {
    if (Number.isNaN(new Date(d.starts_at).getTime())) {
      ctx.addIssue({ code: "custom", path: ["starts_at"], message: "Enter a valid date and time" });
    }
  });

function sessionRow(d: z.infer<typeof SessionSchema>) {
  return {
    title: d.title,
    description: d.description || null,
    kind: d.kind,
    course_id: d.course_id || null,
    starts_at: new Date(d.starts_at).toISOString(),
    duration_minutes: d.duration_minutes,
    capacity: d.capacity,
    location: d.location || null,
    join_url: d.join_url || null,
    host_id: d.host_id || null,
    host_name: d.host_name || null,
  };
}

export async function createSessionAction(_: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireHost();
  if (denied) return denied;
  const parsed = SessionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_live_sessions")
    .insert({
      org_id: session.orgId,
      ...sessionRow(parsed.data),
      session_state: "scheduled",
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/legend/teach/sessions");
  revalidatePath("/legend/live");
  redirect(`/legend/teach/sessions/${data.id}`);
}

export async function updateSessionAction(sessionId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireHost();
  if (denied) return denied;
  const parsed = SessionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data, error } = await db
    .from("legend_live_sessions")
    .update(sessionRow(parsed.data))
    .eq("id", sessionId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return actionFail(error.message, fd);
  if (!data)
    return actionFail(actionErrorMessage("not-found.live-session-in-org", "Live session not found in your organization"), fd);
  revalidatePath("/legend/teach/sessions");
  revalidatePath(`/legend/teach/sessions/${sessionId}`);
  revalidatePath("/legend/live");
  redirect(`/legend/teach/sessions/${sessionId}`);
}

const SessionStateSchema = z.enum(SESSION_STATES);

/** LDP transition — scheduled → live → ended; cancel from scheduled/live (`fd["next"]`). */
export async function setSessionStateAction(sessionId: string, _: State, fd: FormData): Promise<State> {
  const { session, denied } = await requireHost();
  if (denied) return denied;
  const parsedNext = SessionStateSchema.safeParse(fd.get("next"));
  if (!parsedNext.success)
    return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: live } = await db
    .from("legend_live_sessions")
    .select("id, session_state")
    .eq("id", sessionId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!live) return actionError("not-found.live-session-in-org", "Live session not found in your organization");
  if (!canTransition(NEXT_SESSION_STATES, live.session_state, parsedNext.data)) {
    return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  }
  const { data: updated, error } = await db
    .from("legend_live_sessions")
    .update({ session_state: parsedNext.data })
    .eq("id", sessionId)
    .eq("org_id", session.orgId)
    .eq("session_state", live.session_state)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!updated) return actionError("that-state-change-is-not-allowed", "That state change isn't allowed from the current state");
  revalidatePath("/legend/teach/sessions");
  revalidatePath(`/legend/teach/sessions/${sessionId}`);
  revalidatePath("/legend/live");
  return { ok: true };
}
