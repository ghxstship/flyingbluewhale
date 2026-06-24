"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
  applies_to: z.string().min(1).max(120),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createPolicy(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create approval policies" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("approval_policies")
    .insert({
      org_id: session.orgId,
      slug: parsed.data.slug.toLowerCase(),
      name: parsed.data.name,
      description: parsed.data.description || null,
      applies_to: parsed.data.applies_to,
      // version defaults 1, active defaults true, conditions nullable
    })
    .select("id")
    .single();
  if (error) return actionFail(error.message, fd);

  revalidatePath("/studio/governance/approvals/policies");
  redirect(`/studio/governance/approvals/policies/${data.id}`);
}
