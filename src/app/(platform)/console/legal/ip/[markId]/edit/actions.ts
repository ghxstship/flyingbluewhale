"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  mark: z.string().min(1).max(200),
  jurisdiction: z.string().max(120).optional().or(z.literal("")),
  registration_no: z.string().max(120).optional().or(z.literal("")),
  status: z.string().max(60).optional().or(z.literal("")),
  registered_on: z.string().optional().or(z.literal("")),
  expires_on: z.string().optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function updateTrademark(id: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("trademarks")
    .update({
      mark: parsed.data.mark,
      jurisdiction: parsed.data.jurisdiction || null,
      registration_no: parsed.data.registration_no || null,
      status: parsed.data.status || "pending",
      registered_on: parsed.data.registered_on || null,
      expires_on: parsed.data.expires_on || null,
    })
    .eq("id", id)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/legal/ip/${id}`);
  revalidatePath("/console/legal/ip");
  redirect(`/console/legal/ip/${id}`);
}

export async function deleteTrademark(id: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("trademarks").delete().eq("id", id).eq("org_id", session.orgId);
  revalidatePath("/console/legal/ip");
  redirect("/console/legal/ip");
}
