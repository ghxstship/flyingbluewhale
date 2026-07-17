"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

const Ack = z.object({ sopId: z.string().uuid() });

/**
 * Acknowledge a must-read SOP (kit 28 Knowledge: "Must-read articles require
 * acknowledgement").
 *
 * Append-only, one row per (sop, user) — `sop_acknowledgements`, migration
 * 20260716120000. RLS holds the real line (insert only as yourself, in your
 * org); a duplicate ack reads as success because the button was stale, not
 * because anything went wrong.
 */
export async function acknowledgeSop(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Ack.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();

  const { data: sop } = await supabase
    .from("sops")
    .select("id")
    .eq("id", parsed.data.sopId)
    .eq("org_id", session.orgId)
    .eq("sop_state", "published")
    .is("deleted_at", null)
    .maybeSingle();
  if (!sop) return { error: "Article not found." };

  const { error } = await supabase.from("sop_acknowledgements").insert({
    sop_id: parsed.data.sopId,
    user_id: session.userId,
    org_id: session.orgId,
  });
  if (error && !/duplicate key/i.test(error.message)) return { error: error.message };

  revalidatePath("/m/docs");
  revalidatePath(`/m/docs/${parsed.data.sopId}`);
  return null;
}
