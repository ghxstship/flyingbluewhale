"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  kind: z.string().min(1).max(80),
  number: z.string().max(120).optional(),
  issued_on: z.string().optional(),
  expires_on: z.string().optional(),
});

export type State = { error?: string } | null;

export async function updateCredential(credentialId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("credentials")
    .update({
      kind: parsed.data.kind,
      number: parsed.data.number || null,
      issued_on: parsed.data.issued_on || null,
      expires_on: parsed.data.expires_on || null,
    })
    .eq("id", credentialId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/people/credentials/${credentialId}`);
  revalidatePath("/console/people/credentials");
  redirect(`/console/people/credentials/${credentialId}`);
}

export async function deleteCredential(credentialId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("credentials").delete().eq("id", credentialId).eq("org_id", session.orgId);
  revalidatePath("/console/people/credentials");
  redirect("/console/people/credentials");
}
