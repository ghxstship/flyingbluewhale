"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const CreateSchema = z.object({
  kind: z.enum(["hold", "confirm", "block"]),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  label: z.string().max(200).optional().or(z.literal("")),
  all_day: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function addAvailabilityAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = CreateSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("availability_slots").insert({
    user_id: session.userId,
    kind: parsed.data.kind,
    starts_at: parsed.data.starts_at,
    ends_at: parsed.data.ends_at,
    all_day: parsed.data.all_day === "on",
    label: parsed.data.label || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/me/availability");
  return { ok: true };
}

export async function deleteAvailabilityAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("slot_id") ?? "");
  if (!id) return { error: "Missing slot" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("availability_slots").delete().eq("id", id).eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/me/availability");
  return { ok: true };
}
