"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  requester_email: z.string().email(),
  kind: z.enum(["access", "deletion", "correction", "portability", "objection"]),
  due_by: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createDsar(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dsar_requests")
    .insert({
      org_id: session.orgId,
      requester_email: parsed.data.requester_email,
      kind: parsed.data.kind,
      due_by: parsed.data.due_by || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/console/legal/privacy/dsar");
  redirect(`/console/legal/privacy/dsar/${data.id}`);
}
