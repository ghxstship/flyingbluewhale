"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

const Create = z.object({
  kind: z.enum(["rfq", "gig", "talent_call", "talent", "crew", "vendor"]),
  name: z.string().min(1).max(200),
  query: z.string().max(4000).optional().or(z.literal("")),
  alert_email: z.string().optional(),
  alert_push: z.string().optional(),
});

export type State = { error?: string; ok?: true } | null;

export async function createSavedSearchAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Create.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  let query: Record<string, unknown> = {};
  if (parsed.data.query) {
    try {
      query = JSON.parse(parsed.data.query) as Record<string, unknown>;
    } catch {
      return { error: "Query must be valid JSON" };
    }
  }
  const { error } = await supabase.from("saved_searches").insert({
    user_id: session.userId,
    org_id: session.orgId || null,
    kind: parsed.data.kind,
    name: parsed.data.name,
    query,
    alert_email: parsed.data.alert_email === "on",
    alert_push: parsed.data.alert_push === "on",
  });
  if (error) return { error: error.message };
  revalidatePath("/me/saved-searches");
  return { ok: true };
}

export async function deleteSavedSearchAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const id = String(fd.get("search_id") ?? "");
  if (!id) return { error: "Missing search" };
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const { error } = await supabase.from("saved_searches").delete().eq("id", id).eq("user_id", session.userId);
  if (error) return { error: error.message };
  revalidatePath("/me/saved-searches");
  return { ok: true };
}
