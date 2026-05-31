"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MoveSchema = z.object({
  opportunityId: z.string().uuid(),
  newStageId: z.string().uuid(),
});

export async function moveOpportunityAction(fd: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const parsed = MoveSchema.safeParse({
    opportunityId: fd.get("opportunityId"),
    newStageId: fd.get("newStageId"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };

  const supabase = await createClient();

  // Verify the new stage belongs to the same org's pipeline.
  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id, pipeline_id, is_won, is_terminal")
    .eq("id", parsed.data.newStageId)
    .single();
  if (!stage) return { ok: false, error: "Stage not found" };

  const updatePayload: Record<string, unknown> = { current_stage_id: parsed.data.newStageId };
  if ((stage as { is_won: boolean }).is_won || (stage as { is_terminal: boolean }).is_terminal) {
    updatePayload.closed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("opportunities")
    .update(updatePayload)
    .eq("id", parsed.data.opportunityId)
    .eq("org_id", session.orgId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/console/pipeline");
  return { ok: true };
}
