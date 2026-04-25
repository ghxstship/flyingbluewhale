"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  trigger_kind: z.enum(["manual", "schedule", "webhook", "event"]).default("manual"),
});

export type State = { error?: string } | null;

export async function createAutomationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automations")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      trigger_kind: parsed.data.trigger_kind,
      created_by: session.userId,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/console/ai/automations");
  redirect(`/console/ai/automations/${data.id}`);
}
