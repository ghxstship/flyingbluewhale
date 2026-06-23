"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

export type State = { error?: string; ok?: string } | null;

/**
 * Assign a course to a learner — creates an `enrolled` course_enrollments row
 * (idempotent per org/course/user). Manager+ only; RLS also enforces the role.
 */
export async function assignCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not authorized" };
  const parsed = z
    .object({ user_id: z.string().uuid(), course_id: z.string().uuid() })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Pick a member and a course" };
  const db = (await createClient()) as unknown as LooseSupabase;

  const { error } = await db.from("course_enrollments").upsert(
    {
      org_id: session.orgId,
      course_id: parsed.data.course_id,
      user_id: parsed.data.user_id,
      enrollment_state: "enrolled",
      progress_pct: 0,
    },
    { onConflict: "org_id,course_id,user_id", ignoreDuplicates: true },
  );
  if (error) return { error: error.message };
  revalidatePath("/legend/console");
  return { ok: "Course assigned" };
}
