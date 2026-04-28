"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(120),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
});

export type State = { error?: string; ok?: true } | null;

export async function updateProfile(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      name: parsed.data.name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/me/profile");
  revalidatePath("/me");
  return { ok: true };
}
