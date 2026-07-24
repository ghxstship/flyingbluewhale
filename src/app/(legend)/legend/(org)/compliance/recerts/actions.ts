"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { sendPushTo } from "@/lib/push/send";
import {
  DECIDABLE_RECERT_STATES,
  grantCertificationHolder,
  planRecertDecision,
} from "@/lib/legend_recert";

/**
 * Recert decision action (L-P6b, blocker B-3). Closes the dead letter:
 * `certification_recerts` was insert-only — requests vanished with no queue,
 * no decision, no artifact. Approve issues the renewed certification through
 * the SAME issuance path the assessment auto-certify flow uses
 * (`grantCertificationHolder` — the canonical `certification_holders` upsert
 * on (org, certification, user)), so the holder's existing artifact +
 * public verify record refresh in place. Deny flips the state and notifies;
 * no artifact is touched.
 */
const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type DecideState = { error?: string; ok?: true } | null;

export async function decideRecertAction(_prev: DecideState, fd: FormData): Promise<DecideState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Only manager+ can decide recert requests" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid decision" };
  const db = (await createClient()) as unknown as LooseSupabase;

  // Load the request + the holding + the credential's validity window.
  // select("*") so the read tolerates the decision_note column not yet being
  // applied (migration 20260723120000).
  const { data: recertRow } = await db
    .from("certification_recerts")
    .select("*")
    .eq("org_id", session.orgId)
    .eq("id", parsed.data.id)
    .maybeSingle();
  const recert = recertRow as
    | { id: string; holder_id: string; user_id: string; recert_state: string }
    | null;
  if (!recert) return { error: "Recert request not found" };

  const { data: holderRow } = await db
    .from("certification_holders")
    .select("id, org_id, certification_id, user_id, source_course_id")
    .eq("org_id", session.orgId)
    .eq("id", recert.holder_id)
    .maybeSingle();
  const holder = holderRow as
    | { id: string; org_id: string; certification_id: string; user_id: string; source_course_id: string | null }
    | null;
  if (!holder) return { error: "Certification holding not found" };

  const { data: certRow } = await db
    .from("legend_certifications")
    .select("id, name, code, validity_months")
    .eq("org_id", session.orgId)
    .eq("id", holder.certification_id)
    .maybeSingle();
  const cert = certRow as { id: string; name: string; code: string; validity_months: number | null } | null;
  if (!cert) return { error: "Certification type not found" };

  const plan = planRecertDecision({
    decision: parsed.data.decision,
    currentState: recert.recert_state,
    deciderId: session.userId,
    note: parsed.data.note ?? null,
    holder,
    validityMonths: cert.validity_months,
    now: new Date(),
  });
  if ("error" in plan) return { error: plan.error };

  // Omit a null decision_note so the write also succeeds before migration
  // 20260723120000 (which adds the column) is applied.
  const { decision_note, ...basePatch } = plan.update;
  const patch = decision_note === null ? basePatch : plan.update;

  // Double-decision guard at the write: the state filter makes a concurrent
  // second decision a no-op, and the read-back detects it (an RLS/filter
  // no-op returns NO error — repo canon says read the row back).
  const { data: updated, error: updateErr } = await db
    .from("certification_recerts")
    .update(patch)
    .eq("id", recert.id)
    .eq("org_id", session.orgId)
    .in("recert_state", [...DECIDABLE_RECERT_STATES])
    .select("id")
    .maybeSingle();
  if (updateErr) return { error: updateErr.message };
  if (!updated) return { error: "Request was already decided" };

  // Approve → exactly one artifact, through the canonical issuance path.
  if (plan.grant) {
    const { error: grantErr } = await grantCertificationHolder(db, plan.grant);
    if (grantErr) return { error: `Decision saved but issuance failed: ${grantErr.message}` };
  }

  // Tell the requester — the request used to vanish into the void. `kind:
  // "certification"` rides the /m/settings/notifications opt-out matrix
  // (catalog row in migration 20260723120000).
  const approved = parsed.data.decision === "approved";
  await sendPushTo(recert.user_id, {
    title: approved ? "Recertification approved" : "Recertification denied",
    body: `${cert.name} (${cert.code}): your recert request was ${approved ? "approved and your certificate renewed" : "denied"}.${parsed.data.note ? ` Note: ${parsed.data.note}` : ""}`,
    url: "/legend/certifications",
    kind: "certification",
    orgId: session.orgId,
  });

  revalidatePath("/legend/compliance/recerts");
  revalidatePath("/legend/compliance");
  revalidatePath("/legend/certifications");
  return { ok: true };
}
