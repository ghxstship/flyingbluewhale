"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  title: z.string().min(1).max(160),
  quantity: z.coerce.number().int().min(0).max(1_000_000).default(1),
  due_by: z.string().optional(),
  entitlement_state: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEntitlement(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsor_entitlements")
    .insert({
      org_id: session.orgId,
      title: parsed.data.title,
      quantity: parsed.data.quantity,
      due_by: parsed.data.due_by || null,
      entitlement_state: parsed.data.entitlement_state || "open",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/commercial/sponsors");
  redirect(`/studio/commercial/sponsors/${data.id}`);
}
