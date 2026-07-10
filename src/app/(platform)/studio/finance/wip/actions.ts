"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Generate a WIP snapshot for every active project in the org.
 * Calls the PG function generate_wip_snapshot_for_project once per
 * project; UPSERT on (project_id, snapshot_date) makes it idempotent
 * within a single day.
 */
export async function generateOrgWipSnapshots(): Promise<void> {
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;

  const { data: projects } = await supabase
    .from("projects")
    .select("id")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  type Row = { id: string };
  const list = (projects ?? []) as Row[];
  // Batched Promise.all (HP-11): the RPC is per-project by contract (and
  // idempotent via its (project_id, snapshot_date) UPSERT), so calls are
  // independent — run them CHUNK-at-a-time instead of one sequential
  // round trip per project in the org.
  const WIP_RPC_CHUNK = 10;
  for (let i = 0; i < list.length; i += WIP_RPC_CHUNK) {
    const chunk = list.slice(i, i + WIP_RPC_CHUNK);
    await Promise.all(chunk.map((p) => supabase.rpc("generate_wip_snapshot_for_project", { p_project_id: p.id })));
  }

  revalidatePath("/studio/finance/wip");
}
