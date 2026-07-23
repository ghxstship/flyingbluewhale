"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";
import { actionErrorMessage } from "@/lib/errors";

const Schema = z.object({
  delegation_id: z.string().uuid(),
  participant_name: z.string().min(1).max(200),
  discipline: z.string().max(120).optional(),
  event: z.string().max(120).optional(),
  entry_state: z.string().max(40).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createEntry(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  // Cross-tenant FK guard on delegation_id.
  const { data: delegation } = await supabase
    .from("delegations")
    .select("id")
    .eq("id", parsed.data.delegation_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!delegation) return { error: actionErrorMessage("not-found.delegation-in-org", "Delegation not found in your organization") };

  const { data, error } = await supabase
    .from("delegation_entries")
    .insert({
      org_id: session.orgId,
      delegation_id: parsed.data.delegation_id,
      participant_name: parsed.data.participant_name,
      discipline: parsed.data.discipline || null,
      event: parsed.data.event || null,
      entry_state: parsed.data.entry_state || "nominated",
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);
  revalidatePath("/studio/participants/entries");
  redirect(`/studio/participants/entries/${data.id}`);
}
