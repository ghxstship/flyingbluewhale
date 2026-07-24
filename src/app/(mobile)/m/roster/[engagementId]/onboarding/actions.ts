"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ensureLifecyclePacket,
  recordStepReminder,
  setStepState,
  unblockDependentSteps,
  type OnboardingStep,
} from "@/lib/db/onboarding";
import { getOfferLetter } from "@/lib/offer-letters/queries";
import { sendPushTo } from "@/lib/push/send";

export type State = { error?: string; ok?: true } | null;

const Ids = z.object({ engagementId: z.string().uuid(), stepId: z.string().uuid() });

/**
 * Org-checked step read. `setStepState` trusts its caller for tenancy (RLS is
 * the backstop), so the action proves the step belongs to a letter in the
 * session's org BEFORE mutating — a foreign UUID must 404, not no-op.
 */
async function getOrgStep(orgId: string, engagementId: string, stepId: string): Promise<OnboardingStep | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_steps")
    .select("*")
    .eq("id", stepId)
    .eq("org_id", orgId)
    .eq("offer_letter_id", engagementId)
    .maybeSingle();
  return (data ?? null) as unknown as OnboardingStep | null;
}

/** Seed the 4-doc packet onto an engagement that predates the assign flow. */
export async function createPacket(engagementId: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!can(session, "people:manage")) return { error: "Requires the people:manage capability." };
    const letter = await getOfferLetter(session.orgId, engagementId);
    if (!letter) return { error: "Engagement not found." };
    await ensureLifecyclePacket(session.orgId, engagementId);
    revalidatePath(`/m/roster/${engagementId}/onboarding`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the packet." };
  }
}

/** Waive a doc — terminal, ledgered, and it releases anything blocked on it. */
export async function waiveDoc(engagementId: string, stepId: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!can(session, "people:manage")) return { error: "Requires the people:manage capability." };
    const parsed = Ids.safeParse({ engagementId, stepId });
    if (!parsed.success) return { error: "Invalid request." };
    const step = await getOrgStep(session.orgId, engagementId, stepId);
    if (!step) return { error: "Doc not found." };
    if (step.step_state === "done" || step.step_state === "waived") {
      return { error: "This doc is already complete." };
    }
    await setStepState(stepId, "waived", session.userId);
    await unblockDependentSteps(engagementId, step.step_key);
    revalidatePath(`/m/roster/${engagementId}/onboarding`);
    revalidatePath("/m/roster");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not waive the doc." };
  }
}

/**
 * Send Reminder — nudges the recipient about one open doc. Stamps
 * `metadata.last_reminded_at` (what the doc card renders) and pushes to the
 * recipient's claimed account, kind `onboarding` (in the catalog since
 * migration 20260724152000) so the nudge respects the opt-out matrix.
 */
export async function remindDoc(engagementId: string, stepId: string, _prev: State, _fd: FormData): Promise<State> {
  try {
    const session = await requireSession();
    if (!can(session, "people:manage")) return { error: "Requires the people:manage capability." };
    const parsed = Ids.safeParse({ engagementId, stepId });
    if (!parsed.success) return { error: "Invalid request." };
    const step = await getOrgStep(session.orgId, engagementId, stepId);
    if (!step) return { error: "Doc not found." };
    if (step.step_state === "done" || step.step_state === "waived") {
      return { error: "This doc is already complete." };
    }
    const letter = await getOfferLetter(session.orgId, engagementId);
    if (!letter) return { error: "Engagement not found." };
    const recipientUserId = letter.resolved.recipient_user_id;
    if (!recipientUserId) {
      return { error: "This person has no app account yet. Reminders need a claimed profile." };
    }
    await recordStepReminder(stepId);
    await sendPushTo(recipientUserId, {
      title: "Onboarding Doc Waiting",
      body: `${step.title} · ${letter.resolved.project_name}`,
      url: "/m/onboarding",
      scope: "mobile",
      kind: "onboarding",
      orgId: session.orgId,
      projectId: letter.raw.project_id,
    });
    revalidatePath(`/m/roster/${engagementId}/onboarding`);
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not send the reminder." };
  }
}
