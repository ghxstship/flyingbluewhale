"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(160),
  day_of: z.string().min(1),
  state: z.enum(["draft", "published", "locked"]).default("draft"),
});

export type State = { error?: string } | null;

export async function createRoster(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rosters")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      day_of: parsed.data.day_of,
      state: parsed.data.state,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/workforce/rosters");
  redirect(`/console/workforce/rosters/${data.id}`);
}
