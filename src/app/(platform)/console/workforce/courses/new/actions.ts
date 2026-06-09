"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(200),
  summary: z.string().max(2000).optional().or(z.literal("")),
  duration_minutes: z.string().optional().or(z.literal("")),
  required_for_role: z.string().max(80).optional().or(z.literal("")),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCourseAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  // Course creation is a content-authoring action — manager+ only.
  if (!isManagerPlus(session)) return { error: "Only manager+ can author courses" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const dur = parsed.data.duration_minutes ? Number(parsed.data.duration_minutes) : null;
  const { data, error } = await supabase
    .from("courses")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      summary: parsed.data.summary || null,
      duration_minutes: Number.isFinite(dur as number) ? dur : null,
      required_for_role: parsed.data.required_for_role || null,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/console/workforce/courses");
  redirect(`/console/workforce/courses/${data.id}`);
}
