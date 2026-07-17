"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOfferLetter, markOfferLetterSent } from "@/lib/offer-letters/mutations";
import { ensureLifecyclePacket } from "@/lib/db/onboarding";
import { wouldCreateReportingCycle } from "@/lib/db/reporting";
import { BASIS_LABEL, type CompensationBasis } from "@/lib/offer-letters/types";
import { LIVE_LETTER_STATES } from "../shared";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const BASES = Object.keys(BASIS_LABEL) as [CompensationBasis, ...CompensationBasis[]];

const Input = z
  .object({
    projectId: z.string().uuid(),
    crewMemberId: z.string().uuid("Pick a person."),
    roleId: z.string().uuid("Pick a role."),
    rateCardItemId: z.string().uuid().optional().or(z.literal("")),
    compensationBasis: z.enum(BASES).default("per_day"),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .or(z.literal("")),
    reportsTo: z.string().uuid().optional().or(z.literal("")),
    sendOffer: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date is before the start date." });
    }
  });

/**
 * Kit 30 · mobile Assign To Project — creates the engagement (offer letter)
 * + seeds the 4-doc onboarding packet, optionally sending the offer in the
 * same save. REUSES the shared lib insert path (`createOfferLetter`) — never
 * a parallel insert — and mirrors the console roster action's validation:
 * every FK re-verified org-scoped, the reporting edge cycle-guarded against
 * the project's live letters.
 */
export async function assignPerson(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!can(session, "people:manage")) {
    return { error: "Assigning people requires the people:manage capability." };
  }

  const parsed = Input.safeParse(Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", v.projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found in your workspace." };

  // Re-verify every FK org-scoped — the pickers could be rewritten client-side.
  const { data: person } = await supabase
    .from("crew_members")
    .select("id, engagement_state")
    .eq("org_id", session.orgId)
    .eq("id", v.crewMemberId)
    .maybeSingle();
  if (!person) return { error: "That person is not in this org's directory." };
  if (person.engagement_state === "separated") {
    return { error: "That person is separated. Re-engage them from People before assigning." };
  }

  const { data: role } = await supabase
    .from("org_roles")
    .select("id")
    .eq("org_id", session.orgId)
    .eq("id", v.roleId)
    .maybeSingle();
  if (!role) return { error: "Pick a role from the org's catalog.", fieldErrors: { roleId: "Pick a role." } };

  let rateCardItemId: string | null = null;
  if (v.rateCardItemId) {
    const { data: rate } = await supabase
      .from("rate_card_items")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", v.rateCardItemId)
      .eq("active", true)
      .maybeSingle();
    if (!rate) return { error: "That rate card item is not available." };
    rateCardItemId = rate.id;
  }

  let reportsTo: string | null = null;
  if (v.reportsTo) {
    const { data: manager } = await supabase
      .from("crew_members")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", v.reportsTo)
      .maybeSingle();
    if (!manager) return { error: "Pick a manager from the org's directory." };

    const { data: letters } = await supabase
      .from("offer_letters")
      .select("crew_member_id, reports_to_crew_member_id")
      .eq("org_id", session.orgId)
      .eq("project_id", v.projectId)
      .in("letter_state", [...LIVE_LETTER_STATES]);
    const edges = ((letters ?? []) as Array<{ crew_member_id: string; reports_to_crew_member_id: string | null }>).map(
      (l) => ({ id: l.crew_member_id, reportsTo: l.reports_to_crew_member_id }),
    );
    if (wouldCreateReportingCycle(edges, v.crewMemberId, v.reportsTo)) {
      return {
        error: "That reporting line would create a loop. Pick a different manager.",
        fieldErrors: { reportsTo: "This choice loops back to the person." },
      };
    }
    reportsTo = manager.id;
  }

  const actorLabel = session.email ?? session.userId;
  let letterId: string;
  try {
    const letter = await createOfferLetter(
      session.orgId,
      {
        project_id: v.projectId,
        crew_member_id: v.crewMemberId,
        role_id: v.roleId,
        rate_card_item_id: rateCardItemId,
        compensation_basis: v.compensationBasis,
        onsite_start_date: v.startDate || null,
        onsite_end_date: v.endDate || null,
        reports_to_crew_member_id: reportsTo,
        created_by: session.userId,
      },
      actorLabel,
    );
    letterId = letter.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the engagement." };
  }

  // The 4-doc packet is part of the engagement — idempotent, so a re-save
  // never duplicates docs.
  try {
    await ensureLifecyclePacket(session.orgId, letterId);
  } catch {
    // Non-fatal: the onboarding screen offers a Create Packet action.
  }

  if (v.sendOffer) {
    try {
      await markOfferLetterSent(session.orgId, letterId, actorLabel);
    } catch (e) {
      // The letter exists in draft; surface the partial outcome honestly.
      return {
        error:
          e instanceof Error
            ? `Assigned, but the offer could not be sent: ${e.message}`
            : "Assigned, but the offer could not be sent.",
      };
    }
  }

  revalidatePath("/m/roster");
  revalidatePath(`/studio/projects/${v.projectId}/roster`);
  return null;
}
