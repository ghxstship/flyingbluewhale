"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { actionErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { sendNotificationEmailToUsers } from "@/lib/email";

/**
 * Bulk casting invite v1 — invite N claimed talent profiles to apply to a
 * published job posting. Fan-out is one inbox row (+ preference-gated
 * push, kind `marketplace`) and one kit email per invitee. Idempotent per
 * (invitee, posting): the inbox upsert collapses on
 * source (job_postings, posting id), so re-inviting refreshes the one row
 * instead of stacking dupes; the email re-sends deliberately (a nudge is
 * the point of a re-invite).
 *
 * v1 boundaries, on purpose: claimed profiles only (user_id set — an
 * unclaimed EPK has nobody to notify), the org's own roster only, no
 * per-invitee tracking table. A full merge-send with a delivery funnel is
 * the advance engine's pattern and tracked as follow-up in
 * reports/COMMS_AUDIT_2026-07/.
 */

const Schema = z.object({
  posting_id: z.string().uuid(),
  talent_ids: z.array(z.string().uuid()).min(1).max(100),
});

export type State = { error?: string; ok?: true; invited?: number } | null;

export async function inviteTalentAction(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: actionErrorMessage("auth.manager-plus.invite-talent", "Only manager+ can invite talent") };
  }
  const parsed = Schema.safeParse({
    posting_id: fd.get("posting_id"),
    talent_ids: fd.getAll("talent_ids").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pick at least one act" };
  const supabase = await createClient();

  const { data: posting } = await supabase
    .from("job_postings")
    .select("id, title, public_slug, job_posting_phase")
    .eq("id", parsed.data.posting_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!posting) return { error: actionErrorMessage("not-found.posting", "Posting not found") };
  const p = posting as { id: string; title: string; public_slug: string; job_posting_phase: string };
  if (p.job_posting_phase !== "published") {
    return { error: actionErrorMessage("publish-the-posting-before-inviting-talent", "Publish the posting before inviting talent") };
  }

  const { data: talent } = await supabase
    .from("talent_profiles")
    .select("id, act_name, user_id")
    .eq("org_id", session.orgId)
    .in("id", parsed.data.talent_ids)
    .not("user_id", "is", null)
    .is("deleted_at", null);
  const invitees = (talent ?? []) as Array<{ id: string; act_name: string; user_id: string }>;
  if (invitees.length === 0) {
    return { error: actionErrorMessage("none-of-the-selected-acts-have-a-claimed-account", "None of the selected acts have a claimed account to notify") };
  }

  const href = `/marketplace/gigs/${p.public_slug}`;
  const title = `Invited to Apply: ${p.title}`;
  const body = "You were invited to apply for this gig. Tap through to see the details and apply.";
  await Promise.all(
    invitees.map(async (inv) => {
      await writeInbox({
        userId: inv.user_id,
        orgId: session.orgId,
        kind: "marketplace",
        sourceType: "job_postings",
        sourceId: p.id,
        actorId: session.userId,
        title,
        body,
        href,
      });
      await sendNotificationEmailToUsers({
        userIds: [inv.user_id],
        title,
        body,
        url: href,
        eyebrow: "Marketplace",
      });
    }),
  );

  revalidatePath(`/studio/marketplace/postings/${p.id}`);
  return { ok: true, invited: invitees.length };
}
