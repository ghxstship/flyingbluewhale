"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { STALE_ROW_MESSAGE } from "@/lib/db/concurrency";
import { PLATFORM_ROLES } from "@/lib/supabase/types";

const Schema = z.object({
  role: z.enum(PLATFORM_ROLES),
  is_developer: z
    .union([z.literal("on"), z.literal("true"), z.literal("false"), z.undefined()])
    .transform((v) => v === "on" || v === "true"),
});

export type State = { error?: string } | null;

export async function updatePerson(userId: string, _: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  // Sea Trial FINDING-022: optimistic concurrency. memberships is keyed by
  // (org_id, user_id) — inline pattern.
  const expectedUpdatedAt = String(fd.get("_updated_at") ?? "");
  if (!expectedUpdatedAt) return { error: STALE_ROW_MESSAGE };
  const { data, error } = await supabase
    .from("memberships")
    .update({
      role: parsed.data.role,
      is_developer: parsed.data.is_developer,
    })
    .eq("user_id", userId)
    .eq("org_id", session.orgId)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: STALE_ROW_MESSAGE };
  revalidatePath(`/console/people/${userId}`);
  revalidatePath("/console/people");
  redirect(`/console/people/${userId}`);
}

export async function removePerson(userId: string): Promise<void> {
  const session = await requireSession();
  const supabase = await createClient();
  await supabase.from("memberships").delete().eq("user_id", userId).eq("org_id", session.orgId);
  revalidatePath("/console/people");
  redirect("/console/people");
}
