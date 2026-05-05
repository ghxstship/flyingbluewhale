"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { SUBMISSION_STATUSES } from "@/lib/marketplace";

const Transition = z.object({
  submission_id: z.string().uuid(),
  status: z.enum(SUBMISSION_STATUSES),
  internal_notes: z.string().max(4000).optional().or(z.literal("")),
  score: z.string().optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

export async function transitionSubmissionAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Transition.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const score = parsed.data.score ? Math.min(100, Math.max(0, Math.round(Number(parsed.data.score)))) : null;
  const { error } = await supabase
    .from("open_call_submissions")
    .update({
      status: parsed.data.status,
      internal_notes: parsed.data.internal_notes || null,
      score,
      reviewed_by: session.userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.submission_id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/marketplace/calls`);
  return { ok: true };
}
