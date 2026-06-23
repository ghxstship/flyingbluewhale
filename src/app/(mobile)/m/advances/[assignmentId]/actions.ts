"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";
import { toTitle } from "@/lib/format";
import { FULFILLMENT_STATES, NEXT_FULFILLMENT_STATES, type FulfillmentState } from "@/lib/db/assignments";

export type FulfillState = { error?: string; ok?: boolean } | null;

const Schema = z.object({
  assignmentId: z.string().uuid(),
  nextState: z.enum(FULFILLMENT_STATES),
});

/**
 * Manager-driven advance fulfillment transition — the field-side of the kit
 * "Assign Assets → Scan To Fulfill" flow. Mirrors the ATLVS-admin `advanceState`
 * exactly: manager+ gate, server-side `NEXT_FULFILLMENT_STATES` validation,
 * an optimistic-concurrency update (CAS on the prior state so a stale tab can't
 * double-apply), one `assignment_events` state_change row, and an inbox ping to
 * the holder. The per-unit scan-to-fulfill itself runs through `/m/check-in` →
 * `scanAssignment`; this advances the assignment along its lifecycle.
 */
export async function fulfillAssignment(_prev: FulfillState, fd: FormData): Promise<FulfillState> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return { error: "Not allowed" };
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { data: a } = await supabase
    .from("assignments")
    .select("id, title, party_kind, party_user_id, fulfillment_state")
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!a) return { error: "Not found" };

  const cur = a.fulfillment_state as FulfillmentState;
  if (!NEXT_FULFILLMENT_STATES[cur]?.includes(parsed.data.nextState)) {
    return { error: "Illegal transition" };
  }

  const { data: updated, error: upErr } = await supabase
    .from("assignments")
    .update({ fulfillment_state: parsed.data.nextState })
    .eq("id", parsed.data.assignmentId)
    .eq("org_id", session.orgId)
    .eq("fulfillment_state", cur) // optimistic concurrency
    .select("id")
    .maybeSingle();
  if (upErr) return { error: upErr.message };
  if (!updated) return { error: "State changed elsewhere — reload" };

  const { error: evErr } = await supabase.from("assignment_events").insert({
    assignment_id: parsed.data.assignmentId,
    org_id: session.orgId,
    event_kind: "state_change",
    actor_user_id: session.userId,
    from_state: cur,
    to_state: parsed.data.nextState,
  });
  if (evErr) return { error: evErr.message };

  if (a.party_kind === "user" && a.party_user_id && a.party_user_id !== session.userId) {
    void writeInbox({
      userId: a.party_user_id,
      orgId: session.orgId,
      kind: "assignment_state",
      sourceType: "assignments",
      sourceId: crypto.randomUUID(),
      actorId: session.userId,
      title: `Assignment ${toTitle(parsed.data.nextState)}`,
      body: a.title ?? "",
      href: "/m/advances",
    });
  }

  revalidatePath(`/m/advances/${parsed.data.assignmentId}`);
  revalidatePath("/m/advances");
  return { ok: true };
}
