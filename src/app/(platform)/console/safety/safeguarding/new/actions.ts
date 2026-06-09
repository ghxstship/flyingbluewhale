"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  narrative: z.string().min(1).max(5000),
  subject_ref: z.string().max(120).optional(),
  status: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createSafeguardingReport(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("safeguarding_reports")
    .insert({
      org_id: session.orgId,
      narrative: parsed.data.narrative,
      subject_ref: parsed.data.subject_ref || null,
      status: parsed.data.status || "received",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/safety/safeguarding");
  redirect(`/console/safety/safeguarding/${data.id}`);
}
