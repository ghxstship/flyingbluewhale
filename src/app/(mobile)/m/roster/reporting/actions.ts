"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setOfferLetterReportsTo } from "@/lib/offer-letters/mutations";
import { wouldCreateReportingCycle } from "@/lib/db/reporting";
import { LIVE_LETTER_STATES } from "../shared";

export type State = { error?: string; ok?: true } | null;

const Input = z.object({
  projectId: z.string().uuid(),
  personCrewId: z.string().uuid("Pick a person."),
  managerCrewId: z.string().uuid().optional().or(z.literal("")),
});

/**
 * Kit 30 · Edit Reports — repoint one person's reporting edge on the active
 * project. Cycle-guarded in the action (the DB deliberately is not), then
 * written through the shared `setOfferLetterReportsTo` so every touched
 * letter gets its activity row.
 */
export async function updateReports(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!can(session, "people:manage")) {
    return { error: "Editing reporting lines requires the people:manage capability." };
  }

  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  const v = parsed.data;
  const managerCrewId = v.managerCrewId || null;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", v.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your workspace." };

  // The project's live reporting edges — both the cycle-guard input and the
  // proof that person + manager are actually on this roster.
  const { data: letters } = await supabase
    .from("offer_letters")
    .select("crew_member_id, reports_to_crew_member_id")
    .eq("org_id", session.orgId)
    .eq("project_id", v.projectId)
    .in("letter_state", [...LIVE_LETTER_STATES]);
  const rows = (letters ?? []) as Array<{ crew_member_id: string; reports_to_crew_member_id: string | null }>;
  const onRoster = new Set(rows.map((r) => r.crew_member_id));
  if (!onRoster.has(v.personCrewId)) return { error: "That person is not on this project's roster." };
  if (managerCrewId && !onRoster.has(managerCrewId)) {
    return { error: "Pick a manager who is on this project's roster." };
  }

  if (managerCrewId) {
    const edges = rows.map((r) => ({ id: r.crew_member_id, reportsTo: r.reports_to_crew_member_id }));
    if (wouldCreateReportingCycle(edges, v.personCrewId, managerCrewId)) {
      return { error: "That reporting line would create a loop. Pick a different manager." };
    }
  }

  try {
    await setOfferLetterReportsTo(
      session.orgId,
      v.projectId,
      [v.personCrewId],
      managerCrewId,
      session.email ?? session.userId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not update the reporting line." };
  }

  revalidatePath("/m/roster/reporting");
  revalidatePath("/m/roster");
  revalidatePath(`/studio/projects/${v.projectId}/roster/reporting`);
  return { ok: true };
}
