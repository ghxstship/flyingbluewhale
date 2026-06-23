"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  mark: z.string().min(1).max(160),
  jurisdiction: z.string().max(80).optional(),
  registration_no: z.string().max(120).optional(),
  registered_on: z.string().optional(),
  expires_on: z.string().optional(),
  trademark_state: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createTrademark(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trademarks")
    .insert({
      org_id: session.orgId,
      mark: parsed.data.mark,
      jurisdiction: parsed.data.jurisdiction || null,
      registration_no: parsed.data.registration_no || null,
      registered_on: parsed.data.registered_on || null,
      expires_on: parsed.data.expires_on || null,
      trademark_state: parsed.data.trademark_state || "active",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/legal/ip");
  redirect(`/studio/legal/ip/${data.id}`);
}
