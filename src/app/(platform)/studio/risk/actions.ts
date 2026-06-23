"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";

/**
 * Run the risk-scoring batch for the caller's org. Writes risk_scores
 * rows for every active project across the schedule / safety / cash_flow
 * categories (others extensible via the underlying PG function).
 */
export async function runRiskBatch(): Promise<void> {
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  await supabase.rpc("compute_risk_scores_for_org", { org: session.orgId });
  revalidatePath("/studio/risk");
}
