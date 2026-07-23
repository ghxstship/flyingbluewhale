"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  kind: z.string().min(1).max(80),
  number: z.string().max(120).optional(),
  issued_on: z.string().optional(),
  expires_on: z.string().optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCredential(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: actionErrorMessage("auth.manager-plus.record-credentials", "Only manager+ can record credentials") };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("credentials")
    .insert({
      org_id: session.orgId,
      kind: parsed.data.kind,
      number: parsed.data.number || null,
      issued_on: parsed.data.issued_on || null,
      expires_on: parsed.data.expires_on || null,
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/people/credentials");
  redirect(`/studio/people/credentials/${data.id}`);
}
