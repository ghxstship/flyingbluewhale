"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  kind: z.string().min(1).max(60),
  severity: z.string().min(1).max(40),
  started_at: z.string().optional(),
  ended_at: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEnvEvent(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("environmental_events")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      severity: parsed.data.severity,
      started_at: parsed.data.started_at || new Date().toISOString(),
      ended_at: parsed.data.ended_at || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/safety/environmental");
  redirect(`/studio/safety/environmental/${data.id}`);
}
