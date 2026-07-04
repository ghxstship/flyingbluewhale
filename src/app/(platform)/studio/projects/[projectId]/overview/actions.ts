"use server";

import { revalidatePath } from "next/cache";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { generateProjectRiskReport } from "@/lib/ai/risk-report";

export type State = { error?: string; ok?: true } | null;

/**
 * Generate (or refresh) the AI risk report for a project. Manager+ only —
 * mirrors the /api/v1/ai/propose posture: the call spends real model credit
 * and writes an org-visible artifact.
 */
export async function generateRiskReport(projectId: string, _: State, __: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Manager role or higher required." };

  const result = await generateProjectRiskReport({
    orgId: session.orgId,
    projectId,
    userId: session.userId,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath(`/studio/projects/${projectId}/overview`);
  return { ok: true };
}
