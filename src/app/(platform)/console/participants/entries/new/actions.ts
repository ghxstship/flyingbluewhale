"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  delegation_id: z.string().uuid(),
  participant_name: z.string().min(1).max(200),
  discipline: z.string().max(120).optional(),
  event: z.string().max(120).optional(),
  status: z.string().max(40).optional(),
});

export type State = { error?: string } | null;

export async function createEntry(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  // Cross-tenant FK guard on delegation_id.
  const { data: delegation } = await supabase
    .from("delegations")
    .select("id")
    .eq("id", parsed.data.delegation_id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!delegation) return { error: "Delegation not found in your organization" };

  const { data, error } = await supabase
    .from("delegation_entries")
    .insert({
      org_id: session.orgId,
      delegation_id: parsed.data.delegation_id,
      participant_name: parsed.data.participant_name,
      discipline: parsed.data.discipline || null,
      event: parsed.data.event || null,
      status: parsed.data.status || "nominated",
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/participants/entries");
  redirect(`/console/participants/entries/${data.id}`);
}
