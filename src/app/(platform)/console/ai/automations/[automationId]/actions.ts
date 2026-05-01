"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = { error?: string } | null;

export async function toggleAutomationAction(
  automationId: string,
  nextEnabled: boolean,
  _prev: State,
  _form: FormData,
): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({ enabled: nextEnabled })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  revalidatePath("/console/ai/automations");
  return null;
}

export async function recordManualRunAction(automationId: string, _prev: State, _form: FormData): Promise<State> {
  const session = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("automations")
    .update({ last_run_at: new Date().toISOString(), last_run_status: "ok" })
    .eq("id", automationId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/console/ai/automations/${automationId}`);
  revalidatePath("/console/ai/automations");
  return null;
}
