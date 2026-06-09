"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionFail, formFail } from "@/lib/forms/fail";

const Schema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export type State = {
  error?: string;
  ok?: true;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
} | null;

export async function createCostCode(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const supabase = await createClient();
  const { error } = await supabase.from("cost_codes").insert({
    org_id: session.orgId,
    code: parsed.data.code,
    name: parsed.data.name,
    description: parsed.data.description || null,
  } as never);
  if (error) {
    if (error.code === "23505") return { error: `Code "${parsed.data.code}" already in use.` };
    return actionFail(error.message, fd);
  }
  revalidatePath("/console/finance/cost-codes");
  redirect("/console/finance/cost-codes");
}
