"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { ensureLifecyclePacket, setStepState, unblockDependentSteps } from "@/lib/db/onboarding";

/**
 * Kit 30 — packet-table row actions. All ride the EXISTING onboarding step
 * engine (`setStepState` + the transition ledger); Remind additionally
 * writes an offer_letter_activity row (the letter's legacy log of record)
 * and an inbox ping when the recipient has a platform account.
 */

const Ids = z.object({ letterId: z.string().uuid(), stepId: z.string().uuid() });

async function guardLetter(letterId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("offer_letters_resolved")
    .select("id, recipient_name, recipient_user_id, sent_at")
    .eq("id", letterId)
    .eq("org_id", orgId)
    .maybeSingle();
  return data as { id: string; recipient_name: string | null; recipient_user_id: string | null; sent_at: string | null } | null;
}

async function guardStep(letterId: string, stepId: string, orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("onboarding_steps")
    .select("id, step_key, title, step_state")
    .eq("id", stepId)
    .eq("offer_letter_id", letterId)
    .eq("org_id", orgId)
    .maybeSingle();
  return data as { id: string; step_key: string; title: string; step_state: string } | null;
}

function packetPath(letterId: string): string {
  return `/studio/people/offer-letters/${letterId}/onboarding`;
}

/** Empty-state CTA — idempotently seed the 4-doc lifecycle packet. */
export async function seedPacketAction(letterId: string): Promise<void> {
  const session = await requireSession();
  if (!can(session, "people:manage")) return;
  if (!z.string().uuid().safeParse(letterId).success) return;
  const letter = await guardLetter(letterId, session.orgId);
  if (!letter) return;
  await ensureLifecyclePacket(session.orgId, letterId);
  revalidatePath(packetPath(letterId));
}

/** Remind — nudge the recipient about an open doc. */
export async function remindStepAction(letterId: string, stepId: string): Promise<void> {
  const session = await requireSession();
  if (!can(session, "people:manage")) return;
  const parsed = Ids.safeParse({ letterId, stepId });
  if (!parsed.success) return;
  const [letter, step] = await Promise.all([
    guardLetter(letterId, session.orgId),
    guardStep(letterId, stepId, session.orgId),
  ]);
  if (!letter || !step) return;
  if (step.step_state === "done" || step.step_state === "waived") return;

  const supabase = await createClient();
  await supabase.from("offer_letter_activity").insert({
    org_id: session.orgId,
    offer_letter_id: letterId,
    kind: "reminder_sent",
    actor_label: null,
    summary: `Reminder sent · ${step.title}`,
  });

  if (letter.recipient_user_id) {
    void writeInbox({
      userId: letter.recipient_user_id,
      orgId: session.orgId,
      kind: "assignment",
      sourceType: "onboarding_steps",
      sourceId: step.id,
      actorId: session.userId,
      title: `Onboarding reminder · ${step.title}`,
      body: "An onboarding doc is waiting on you.",
      href: "/m/onboarding",
    });
  }

  revalidatePath(packetPath(letterId));
  revalidatePath(`/studio/people/offer-letters/${letterId}`);
}

/** Waive — mark a doc waived; anything blocked on it unlocks. */
export async function waiveStepAction(letterId: string, stepId: string): Promise<void> {
  const session = await requireSession();
  if (!can(session, "people:manage")) return;
  const parsed = Ids.safeParse({ letterId, stepId });
  if (!parsed.success) return;
  const step = await guardStep(letterId, stepId, session.orgId);
  if (!step) return;
  if (step.step_state === "done" || step.step_state === "waived") return;

  await setStepState(step.id, "waived", session.userId);
  await unblockDependentSteps(letterId, step.step_key);
  revalidatePath(packetPath(letterId));
  revalidatePath(`/studio/people/offer-letters/${letterId}`);
}
