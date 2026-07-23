"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setOfferLetterReportsTo } from "@/lib/offer-letters/mutations";
import type { FormState } from "@/components/FormShell";
import { actionFail, zodFieldErrors } from "@/lib/forms/fail";
import { LIVE_LETTER_STATES } from "../letter-state";
import { findReportingCycle } from "./cycle";
import { actionErrorMessage } from "@/lib/errors";

const EditSchema = z.object({
  managerId: z.string().uuid("Pick a manager"),
  reportIds: z.array(z.string().uuid()).min(1, "Pick at least one report"),
});

export async function setReportsAction(projectId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!can(session, "people:manage")) {
    return { error: actionErrorMessage("auth.capability.people-manage-2", "You need the people:manage capability to edit reporting lines.") };
  }

  const parsed = EditSchema.safeParse({
    managerId: fd.get("managerId"),
    reportIds: fd.getAll("reportIds").filter((v): v is string => typeof v === "string"),
  });
  if (!parsed.success) {
    return { error: actionErrorMessage("check-the-fields-below", "Check the fields below"), fieldErrors: zodFieldErrors(parsed.error) };
  }
  const { managerId, reportIds } = parsed.data;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: actionErrorMessage("not-found.project-3", "Project not found.") };

  // Everyone involved must hold a live engagement on this project — the
  // reporting edge lives on the letter, so an off-roster id has no home.
  const { data: letters } = await supabase
    .from("offer_letters")
    .select("crew_member_id, reports_to_crew_member_id")
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .in("letter_state", [...LIVE_LETTER_STATES]);
  const edges = new Map<string, string | null>();
  for (const l of (letters ?? []) as Array<{ crew_member_id: string; reports_to_crew_member_id: string | null }>) {
    if (!edges.has(l.crew_member_id)) edges.set(l.crew_member_id, l.reports_to_crew_member_id);
  }

  if (!edges.has(managerId)) return actionFail(actionErrorMessage("the-manager-must-be-on-this-project-s-roster", "The manager must be on this project's roster."), fd);
  for (const r of reportIds) {
    if (!edges.has(r)) return actionFail(actionErrorMessage("every-report-must-be-on-this-project-s-roster", "Every report must be on this project's roster."), fd);
    if (r === managerId) return actionFail(actionErrorMessage("a-person-can-t-report-to-themselves", "A person can't report to themselves."), fd);
  }

  // Cycle guard — walk up from the proposed manager through the proposed
  // edge set; refuse the batch if any chain loops back on itself.
  const offender = findReportingCycle(
    edges,
    reportIds.map((personId) => ({ personId, managerId })),
  );
  if (offender) {
    return actionFail(actionErrorMessage("that-change-would-create-a-reporting-loop-pick-a", "That change would create a reporting loop. Pick a different manager."), fd);
  }

  try {
    await setOfferLetterReportsTo(session.orgId, projectId, reportIds, managerId, session.email);
  } catch (e) {
    return actionFail(e instanceof Error ? e.message : "Could not update the reporting lines.", fd);
  }

  const base = `/studio/projects/${projectId}/roster`;
  revalidatePath(base);
  revalidatePath(`${base}/reporting`);
  redirect(`${base}/reporting`);
}
