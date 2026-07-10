"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

const Schema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
  // Optional decision note — collected on deny so the requester's push
  // isn't a bare "denied". Passed through to the RPC / decision_note column
  // and appended to the push body.
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type DecideState = { error?: string; ok?: true } | null;

export async function decideTimeOff(_prev: DecideState, fd: FormData): Promise<DecideState> {
  const session = await requireSession();
  // Time-off approvals are HR-level — manager+ only. Return a visible
  // denial instead of a silent no-op (members clicking Approve used to
  // get nothing).
  if (!isManagerPlus(session)) {
    return { error: "You need manager access to decide time-off requests" };
  }
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid decision" };
  const supabase = await createClient();

  // Load the request first — for state validation and so we can notify
  // the requester after the decision lands.
  const { data: reqRow, error: readErr } = await supabase
    .from("time_off_requests")
    .select("id, user_id, starts_on, ends_on, request_state")
    .eq("id", parsed.data.id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (readErr) return { error: readErr.message };
  if (!reqRow) return { error: "Request not found" };
  if (reqRow.request_state !== "pending") return { error: "This request was already decided" };

  if (parsed.data.decision === "approved") {
    // The RPC flips state + decrements the balance atomically. There is
    // deliberately NO plain-UPDATE fallback: when the RPC rejects (e.g.
    // insufficient balance), falling back to a bare state flip approved
    // the request while skipping the balance decrement — corrupting
    // time_off_balances. Surface the error instead.
    const { error } = await (
      supabase.rpc as unknown as (
        name: string,
        params: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>
    )("approve_time_off_request", {
      p_request_id: parsed.data.id,
      p_decider_id: session.userId,
      p_decision_note: parsed.data.note ?? null,
    });
    if (error) return { error: `Could not approve: ${error.message}` };
  } else {
    // Denials don't touch the balance.
    const { error } = await supabase
      .from("time_off_requests")
      .update({
        request_state: "denied",
        decided_by: session.userId,
        decided_at: new Date().toISOString(),
        decision_note: parsed.data.note ?? null,
      })
      .eq("id", parsed.data.id)
      .eq("org_id", session.orgId)
      .eq("request_state", "pending");
    if (error) return { error: `Could not deny: ${error.message}` };
  }

  // Tell the requester — the approval used to vanish into the void and
  // crew found out by checking the app. A decision note rides along so a
  // denial arrives with the reason, not a bare verdict.
  const verb = parsed.data.decision === "approved" ? "approved" : "denied";
  await sendPushTo(reqRow.user_id as string, {
    title: `Time off ${verb}`,
    body: `Your request for ${reqRow.starts_on} to ${reqRow.ends_on} was ${verb}.${parsed.data.note ? ` Note: ${parsed.data.note}` : ""}`,
    url: "/m/time-off",
    kind: "time_off",
    scope: "mobile",
    orgId: session.orgId,
  });

  revalidatePath("/studio/workforce/time-off");
  return { ok: true };
}

const BulkSchema = z.object({
  decision: z.enum(["approved", "denied"]),
  note: z.string().trim().max(500).nullable(),
  ids: z.array(z.string().uuid()).min(1).max(200),
});

export type BulkDecideResult = { message?: string; error?: string };

/**
 * Bulk approve / deny — the list-table counterpart to `decideTimeOff`.
 * Reuses the same pathway per row: approvals go through the
 * `approve_time_off_request` SECURITY DEFINER RPC (atomic state flip +
 * balance decrement; no plain-UPDATE fallback), denials are a guarded
 * state flip, and the requester gets the same push either way. Rows that
 * are missing or already decided are skipped and reported.
 */
export async function bulkDecideTimeOff(
  decision: "approved" | "denied",
  note: string | null,
  ids: string[],
): Promise<BulkDecideResult> {
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return { error: "You need manager access to decide time-off requests" };
  }
  const parsed = BulkSchema.safeParse({ decision, note, ids });
  if (!parsed.success) return { error: "Invalid bulk decision request" };
  const decisionNote = parsed.data.note || null;
  const supabase = await createClient();

  const { data: rows, error: readErr } = await supabase
    .from("time_off_requests")
    .select("id, user_id, starts_on, ends_on, request_state")
    .in("id", parsed.data.ids)
    .eq("org_id", session.orgId);
  if (readErr) return { error: `Could not load requests: ${readErr.message}` };

  const found = (rows ?? []) as Array<{
    id: string;
    user_id: string;
    starts_on: string;
    ends_on: string;
    request_state: string;
  }>;

  const total = parsed.data.ids.length;
  let decided = 0;
  // Missing / cross-org ids count as skipped too.
  let skipped = total - found.length;
  const verb = parsed.data.decision === "approved" ? "approved" : "denied";

  for (const reqRow of found) {
    if (reqRow.request_state !== "pending") {
      skipped++;
      continue;
    }

    if (parsed.data.decision === "approved") {
      const { error } = await (
        supabase.rpc as unknown as (
          name: string,
          params: Record<string, unknown>,
        ) => Promise<{ error: { message: string } | null }>
      )("approve_time_off_request", {
        p_request_id: reqRow.id,
        p_decider_id: session.userId,
        p_decision_note: decisionNote,
      });
      if (error) {
        skipped++;
        continue;
      }
    } else {
      const { error } = await supabase
        .from("time_off_requests")
        .update({
          request_state: "denied",
          decided_by: session.userId,
          decided_at: new Date().toISOString(),
          decision_note: decisionNote,
        })
        .eq("id", reqRow.id)
        .eq("org_id", session.orgId)
        .eq("request_state", "pending");
      if (error) {
        skipped++;
        continue;
      }
    }

    await sendPushTo(reqRow.user_id, {
      title: `Time off ${verb}`,
      body: `Your request for ${reqRow.starts_on} to ${reqRow.ends_on} was ${verb}.${decisionNote ? ` Note: ${decisionNote}` : ""}`,
      url: "/m/time-off",
      kind: "time_off",
      scope: "mobile",
      orgId: session.orgId,
    });
    decided++;
  }

  revalidatePath("/studio/workforce/time-off");

  const verbLabel = parsed.data.decision === "approved" ? "approved" : "denied";
  if (skipped > 0) {
    return { error: `${skipped} of ${total} could not be ${verbLabel} · ${decided} decided` };
  }
  return { message: `${decided} ${decided === 1 ? "request" : "requests"} ${verbLabel}` };
}
