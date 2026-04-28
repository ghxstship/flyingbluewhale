"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  carrier: z.string().min(1).max(160),
  policy_no: z.string().min(1).max(120),
  kind: z.string().min(1).max(60),
  effective_on: z.string().optional(),
  expires_on: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createPolicy(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insurance_policies")
    .insert({
      org_id: session.orgId,
      carrier: parsed.data.carrier,
      policy_no: parsed.data.policy_no,
      kind: parsed.data.kind,
      effective_on: parsed.data.effective_on || null,
      expires_on: parsed.data.expires_on || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/legal/insurance");
  redirect(`/console/legal/insurance/${data.id}`);
}
