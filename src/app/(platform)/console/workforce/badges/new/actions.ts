"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  code: z
    .string()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/i, "Lowercase letters, digits, dashes only"),
  name: z.string().min(1).max(80),
  icon: z.string().max(4).optional().or(z.literal("")),
  description: z.string().max(400).optional().or(z.literal("")),
});

export type State = { error?: string } | null;

export async function createBadgeAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can define badges" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("badges")
    .insert({
      org_id: session.orgId,
      code: parsed.data.code.toLowerCase(),
      name: parsed.data.name,
      icon: parsed.data.icon || null,
      description: parsed.data.description || null,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/console/workforce/badges");
  redirect(`/console/workforce/badges/${data.id}`);
}
