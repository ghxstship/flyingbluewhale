"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const TRIGGER_EVENTS = [
  "assignment.created",
  "assignment.state_changed",
  "proposal.approved",
  "invoice.paid",
  "deliverable.submitted",
  "crew.checked_in",
  "time_entry.flagged",
] as const;

const Schema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().or(z.literal("")),
  trigger_event: z.enum(TRIGGER_EVENTS),
  is_active: z.string().optional().transform((v) => v === "on"),
});

export type State = { error?: string; ok?: true } | null;

export async function createAutomationAction(_: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isAdmin(session)) return { error: "Only admin+ can manage automations" };

  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("automation_rules")
    .insert({
      org_id: session.orgId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      trigger_event: parsed.data.trigger_event,
      is_active: parsed.data.is_active,
      trigger_conditions: {},
      actions: [],
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/console/settings/automations");
  redirect(`/console/settings/automations/${data.id}`);
}
