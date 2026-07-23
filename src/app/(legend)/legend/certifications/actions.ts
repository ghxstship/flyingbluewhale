"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { assertLegendWrite } from "@/lib/legend_access";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: true } | null;

/**
 * Request a recertification for one of the caller's certification holdings.
 * Writes an append-only `certification_recerts` row (state=requested) — the
 * recert matrix / admin then advances it through review.
 */
export async function requestRecertAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const denied = assertLegendWrite(session);
  if (denied) return denied;
  const parsed = z
    .object({ holder_id: z.string().uuid(), note: z.string().max(2000).optional().or(z.literal("")) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request" };
  const db = (await createClient()) as unknown as LooseSupabase;

  // Confirm the holding belongs to the caller.
  const { data: holder } = await db
    .from("certification_holders")
    .select("id, user_id")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.holder_id)
    .maybeSingle();
  if (!holder || holder.user_id !== session.userId) return { error: "Not your certification" };

  const { error } = await db.from("certification_recerts").insert({
    org_id: session.orgId,
    holder_id: parsed.data.holder_id,
    user_id: session.userId,
    recert_state: "requested",
    note: parsed.data.note || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/legend/certifications");
  return { ok: true };
}
