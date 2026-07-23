"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionErrorMessage } from "@/lib/errors";

/**
 * Stage transition for the pipeline board (audit A-23) — the server half
 * of the drag-and-drop kanban. Org-pinned, kind-pinned to deals, and the
 * destination stage must belong to the deal's own pipeline (a cross-
 * pipeline stage id would corrupt the funnel).
 */
export async function moveOpportunityStage(
  opportunityId: string,
  stageId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await requireSession();
  const ids = z.object({ opp: z.string().uuid(), stage: z.string().uuid() }).safeParse({
    opp: opportunityId,
    stage: stageId,
  });
  if (!ids.success) return { error: actionErrorMessage("invalid.ids", "Invalid ids") };
  const supabase = await createClient();

  const { data: opp } = await supabase
    .from("opportunities")
    .select("id, pipeline_id")
    .eq("org_id", session.orgId)
    .eq("kind", "deal")
    .eq("id", ids.data.opp)
    .maybeSingle();
  if (!opp) return { error: actionErrorMessage("not-found.deal", "Deal not found") };

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id")
    .eq("id", ids.data.stage)
    .maybeSingle();
  if (!stage || stage.pipeline_id !== opp.pipeline_id) {
    return { error: actionErrorMessage("stage-does-not-belong-to-this-pipeline", "Stage does not belong to this pipeline") };
  }

  const { error } = await supabase
    .from("opportunities")
    .update({ current_stage_id: ids.data.stage })
    .eq("org_id", session.orgId)
    .eq("id", ids.data.opp);
  if (error) return { error: error.message };

  revalidatePath("/studio/pipeline");
  revalidatePath("/studio/crm");
  return { ok: true };
}
