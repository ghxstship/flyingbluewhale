"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createOfferLetter, markOfferLetterSent } from "@/lib/offer-letters/mutations";
import { ensureLifecyclePacket } from "@/lib/db/onboarding";
import { BASIS_LABEL, type CompensationBasis } from "@/lib/offer-letters/types";
import type { FormState } from "@/components/FormShell";
import { actionFail, formFail } from "@/lib/forms/fail";
import { wouldCreateReportingCycle } from "./reporting/cycle";
import { CUSTOM_POSITION_LABEL, CUSTOM_POSITION_SLUG, LIVE_LETTER_STATES } from "./letter-state";

const BASES = Object.keys(BASIS_LABEL) as [CompensationBasis, ...CompensationBasis[]];

const AssignSchema = z
  .object({
    crewMemberId: z.string().uuid("Pick a person"),
    positionMode: z.enum(["catalog", "manual"]),
    roleId: z.string().uuid().optional().or(z.literal("")),
    manualTitle: z.string().trim().max(120).optional().or(z.literal("")),
    rateCardItemId: z.string().uuid().optional().or(z.literal("")),
    compensationBasis: z.enum(BASES),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a start date").optional().or(z.literal("")),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick an end date").optional().or(z.literal("")),
    reportsTo: z.string().uuid().optional().or(z.literal("")),
    sendOffer: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.positionMode === "catalog" && !v.roleId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["roleId"], message: "Pick a position" });
    }
    if (v.positionMode === "manual" && (!v.manualTitle || v.manualTitle.length < 2)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["manualTitle"], message: "Name the position" });
    }
    if (v.startDate && v.endDate && v.endDate < v.startDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date is before the start date" });
    }
  });

/**
 * Resolve the org's fixed system role for manual positions, creating it once
 * per org if missing. The custom TITLE is never written to org_roles — only
 * this single infrastructure row exists (see letter-state.ts).
 */
async function ensureCustomPositionRole(orgId: string): Promise<string> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("org_roles")
    .select("id")
    .eq("org_id", orgId)
    .eq("slug", CUSTOM_POSITION_SLUG)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("org_roles")
    .insert({ org_id: orgId, slug: CUSTOM_POSITION_SLUG, label: CUSTOM_POSITION_LABEL, is_system: true })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function assignPersonAction(projectId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!can(session, "people:manage")) {
    return { error: "You need the people:manage capability to assign people to a project." };
  }

  const parsed = AssignSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return formFail(parsed.error, fd);
  const input = parsed.data;

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) return { error: "Project not found." };

  // The picker could be rewritten client-side — re-verify every FK is an
  // org-scoped, still-engaged record before it lands on a letter.
  const { data: person } = await supabase
    .from("crew_members")
    .select("id, name, engagement_state")
    .eq("org_id", session.orgId)
    .eq("id", input.crewMemberId)
    .maybeSingle();
  if (!person) return actionFail("That person is not in this org's directory.", fd);
  if (person.engagement_state === "separated") {
    return actionFail("That person is separated. Re-engage them from People before assigning.", fd);
  }

  let roleId: string;
  let expectationsOverride: string | null = null;
  if (input.positionMode === "manual") {
    roleId = await ensureCustomPositionRole(session.orgId);
    expectationsOverride = input.manualTitle!.trim();
  } else {
    const { data: role } = await supabase
      .from("org_roles")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", input.roleId!)
      .maybeSingle();
    if (!role) return actionFail("Pick a position from the org's role catalog.", fd);
    roleId = role.id;
  }

  let rateCardItemId: string | null = null;
  if (input.rateCardItemId) {
    const { data: rate } = await supabase
      .from("rate_card_items")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", input.rateCardItemId)
      .eq("active", true)
      .maybeSingle();
    if (!rate) return actionFail("That rate card item is not available.", fd);
    rateCardItemId = rate.id;
  }

  let reportsTo: string | null = null;
  if (input.reportsTo) {
    if (input.reportsTo === input.crewMemberId) {
      return actionFail("A person can't report to themselves.", fd);
    }
    const { data: manager } = await supabase
      .from("crew_members")
      .select("id")
      .eq("org_id", session.orgId)
      .eq("id", input.reportsTo)
      .maybeSingle();
    if (!manager) return actionFail("Pick a manager from the org's directory.", fd);

    // Cycle guard: walk up from the proposed manager through the project's
    // live reporting edges; refuse if the chain reaches the new hire.
    const { data: letters } = await supabase
      .from("offer_letters")
      .select("crew_member_id, reports_to_crew_member_id")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .in("letter_state", [...LIVE_LETTER_STATES]);
    const edges = new Map<string, string | null>(
      ((letters ?? []) as Array<{ crew_member_id: string; reports_to_crew_member_id: string | null }>).map((l) => [
        l.crew_member_id,
        l.reports_to_crew_member_id,
      ]),
    );
    if (wouldCreateReportingCycle(edges, input.crewMemberId, input.reportsTo)) {
      return actionFail("That reporting line would create a loop. Pick a different manager.", fd);
    }
    reportsTo = manager.id;
  }

  const actorLabel = session.email ?? session.userId;
  let letterId: string;
  try {
    const letter = await createOfferLetter(
      session.orgId,
      {
        project_id: projectId,
        crew_member_id: input.crewMemberId,
        role_id: roleId,
        reports_to_crew_member_id: reportsTo,
        rate_card_item_id: rateCardItemId,
        compensation_basis: input.compensationBasis,
        onsite_start_date: input.startDate || null,
        onsite_end_date: input.endDate || null,
        expectations_override: expectationsOverride,
        created_by: session.userId,
      },
      actorLabel,
    );
    letterId = letter.id;
    // Kit-30 parity seam: the mobile assign flow seeds the 4-doc packet on
    // save; the console flow must match (idempotent, so re-assigns no-op).
    await ensureLifecyclePacket(session.orgId, letter.id);
  } catch (e) {
    return actionFail(e instanceof Error ? e.message : "Could not create the offer letter.", fd);
  }

  if (input.sendOffer) {
    try {
      await markOfferLetterSent(session.orgId, letterId, actorLabel);
    } catch (e) {
      // The letter exists in draft; surface the partial outcome honestly.
      return actionFail(
        e instanceof Error
          ? `Assigned, but the offer could not be sent: ${e.message}`
          : "Assigned, but the offer could not be sent.",
        fd,
      );
    }
  }

  revalidatePath(`/studio/projects/${projectId}/roster`);
  redirect(`/studio/projects/${projectId}/roster`);
}
