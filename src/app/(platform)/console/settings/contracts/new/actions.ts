"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(200),
  deposit_pct: z.string().transform((v) => parseInt(v, 10)).pipe(z.number().min(0).max(100)),
  body_markdown: z.string().max(50000).optional().or(z.literal("")),
  is_default: z.string().optional(),
});

export type State = { error?: string } | null;

export async function createContractTemplateAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can create contract templates" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const isDefault = parsed.data.is_default === "on";

  // If setting as default, clear the existing default first
  if (isDefault) {
    await supabase
      .from("contract_templates")
      .update({ is_default: false })
      .eq("org_id", session.orgId)
      .eq("is_default", true);
  }

  const { data, error } = await supabase
    .from("contract_templates")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      deposit_pct: parsed.data.deposit_pct,
      body_markdown: parsed.data.body_markdown ?? "",
      is_default: isDefault,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/console/settings/contracts");
  redirect(`/console/settings/contracts/${data.id}`);
}
