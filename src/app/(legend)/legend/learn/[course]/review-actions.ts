"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: string } | null;

/**
 * Submit (or update) the caller's review for a course. One review per learner
 * per course (unique org/course/user) → upsert. Only enrolled learners' reviews
 * are meaningful, but RLS scopes writes to org members.
 */
export async function submitReviewAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = z
    .object({
      course_id: z.string().uuid(),
      rating: z.coerce.number().int().min(1).max(5),
      body: z.string().max(2000).optional().or(z.literal("")),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a rating (1–5)" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { error } = await db.from("legend_course_reviews").upsert(
    {
      org_id: session.orgId,
      course_id: parsed.data.course_id,
      user_id: session.userId,
      rating: parsed.data.rating,
      body: parsed.data.body || null,
      review_state: "published",
    },
    { onConflict: "org_id,course_id,user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath(`/legend/learn/${parsed.data.course_id}`);
  return { ok: "Thanks — your review is posted" };
}
