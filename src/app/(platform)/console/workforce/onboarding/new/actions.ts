"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  target_role: z.string().max(80).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createFlowAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can author onboarding flows" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("new_hire_flows")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      target_role: parsed.data.target_role || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/workforce/onboarding");
  redirect(`/console/workforce/onboarding/${data.id}`);
}
