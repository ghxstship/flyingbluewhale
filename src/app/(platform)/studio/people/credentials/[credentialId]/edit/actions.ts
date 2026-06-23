"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateOrgScopedWithCheck, STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { formFail } from "@/lib/forms/fail";

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

export async function updateCredential(credentialId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can edit credentials" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  // Sea Trial FINDING-022: optimistic concurrency.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  const result = await updateOrgScopedWithCheck("credentials", session.orgId, credentialId, expectedUpdatedAt, {
    kind: parsed.data.kind,
    number: parsed.data.number || null,
    issued_on: parsed.data.issued_on || null,
    expires_on: parsed.data.expires_on || null,
  });
  if (!result.ok) {
    return { error: result.reason === "stale" ? STALE_ROW_MESSAGE : "Credential not found." };
  }
  revalidatePath(`/studio/people/credentials/${credentialId}`);
  revalidatePath("/studio/people/credentials");
  redirect(`/studio/people/credentials/${credentialId}`);
}

export async function deleteCredential(credentialId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("credentials").delete().eq("id", credentialId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete credential: ${error.message}`);
  revalidatePath("/studio/people/credentials");
  redirect("/studio/people/credentials");
}
