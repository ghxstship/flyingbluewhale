"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: string } | null;

/**
 * Register the caller for a live session. Honors capacity — when the session is
 * full the registration is recorded as `waitlisted` instead of `registered`.
 * Idempotent per (session, user) via the unique constraint → upsert.
 */
export async function registerForSessionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ session_id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid session" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { data: live } = await db
    .from("legend_live_sessions")
    .select("id, capacity, session_state")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.session_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!live) return { error: "Session not found" };
  if (live.session_state === "ended" || live.session_state === "cancelled") {
    return { error: "This session is closed" };
  }

  let registrationState = "registered";
  if (live.capacity != null) {
    const { count } = await db
      .from("legend_session_registrations")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("session_id", live.id)
      .eq("registration_state", "registered");
    if ((count ?? 0) >= live.capacity) registrationState = "waitlisted";
  }

  const { error } = await db
    .from("legend_session_registrations")
    .upsert(
      {
        org_id: session.orgId,
        session_id: live.id,
        user_id: session.userId,
        registration_state: registrationState,
      },
      { onConflict: "session_id,user_id" },
    );
  if (error) return { error: error.message };
  revalidatePath("/legend/live");
  return { ok: registrationState === "waitlisted" ? "Added to the waitlist" : "Registered" };
}

/** Cancel the caller's registration for a session. */
export async function cancelRegistrationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z.object({ session_id: z.string().uuid() }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid session" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { error } = await db
    .from("legend_session_registrations")
    .update({ registration_state: "cancelled" })
    .eq("org_id", session.orgId)
    .eq("session_id", parsed.data.session_id)
    .eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/legend/live");
  return { ok: "Registration cancelled" };
}
