"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type State = {
  error?: string;
  ok?: true;
} | null;

/**
 * Flip the `enabled` flag on a field agent. Mirrors the automations
 * toggle: org-scoped UPDATE under RLS (owner/admin per `ai_agents_admin_update`).
 */
export async function toggleAgentAction(
  agentId: string,
  nextEnabled: boolean,
  _prev: State,
  _form: FormData,
): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not authorized" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_agents")
    .update({ enabled: nextEnabled })
    .eq("id", agentId)
    .eq("org_id", session.orgId);
  if (error) return { error: error.message };
  revalidatePath(`/studio/ai/agents/${agentId}`);
  revalidatePath("/studio/ai/agents");
  return null;
}

/**
 * Delete a field agent. `ai_agents` has no `deleted_at` column, so this is a
 * hard DELETE (gated by RLS `ai_agents_admin_delete` → owner/admin). Bound to
 * the id and called from DeleteForm, which redirects after the action returns.
 */
export async function deleteAgentAction(agentId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  const { error } = await supabase.from("ai_agents").delete().eq("id", agentId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete field agent: ${error.message}`);
  revalidatePath("/studio/ai/agents");
  redirect("/studio/ai/agents");
}
