"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(160),
  country: z.string().max(80).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().max(40).optional(),
});

export type State = { error?: string } | null;

export async function createDelegation(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delegations")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code,
      name: parsed.data.name,
      country: parsed.data.country || null,
      contact_email: parsed.data.contact_email || null,
      contact_phone: parsed.data.contact_phone || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/participants/delegations");
  redirect(`/console/participants/delegations/${data.id}`);
}
