"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  name: z.string().min(1).max(200),
  kind: z.string().max(40).optional(),
  scheduled_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createExercise(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("readiness_exercises")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      kind: parsed.data.kind || "tabletop",
      scheduled_at: parsed.data.scheduled_at || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/programs/readiness");
  redirect(`/studio/programs/readiness/${data.id}`);
}
