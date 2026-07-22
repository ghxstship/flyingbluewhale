"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";
import { urlFor } from "@/lib/urls";
import { dateRangeRefine } from "@/lib/zod/dateRange";

/**
 * Shared `requestTimeOff` action (ADR-0008 Amendment 4).
 *
 * Lifted verbatim from `src/app/(mobile)/m/time-off/actions.ts` so the
 * portal can file a request without deep-linking into COMPVSS. Filing time
 * off needs no geofence and no offline durability — it is a form — so under
 * the capability rule it belongs in both shells (see `shell-contract.ts`).
 *
 * Callers pass a `revalidate` field with the path to re-render, the same
 * contract `feed-action.ts` uses: /m/time-off/new sends "/m/time-off",
 * /p/[slug]/crew/time-off/new sends its own portal path. One action, so the
 * policy-resolution and manager-notify rules cannot drift per shell.
 */

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z
  .object({
    // kit timeoff form field ids
    from: z.string().min(1, "Pick a start date."),
    to: z.string().min(1, "Pick an end date."),
    type: z.string().optional(),
    notes: z.string().optional(),
    revalidate: z.string().min(1).max(200),
    // Optional: a plain <form action> has no way to navigate itself on
    // success, so the portal names where to land. The mobile page drives its
    // own `router.push` from a transition and omits this — which is why the
    // success return stays `null` rather than becoming a redirect for
    // everyone.
    redirectTo: z.string().min(1).max(200).optional(),
  })
  // HP-15: the end>=start rule previously lived as a hand-rolled inline
  // check below — single-sourced through the shared refine (same module
  // the invoice schema uses) so the rule can't drift per form.
  .refine(...dateRangeRefine("from", "to", "End date must be on or after the start date."));

/** Map the kit type select → time_off_policies.policy_kind preference. */
const KIND_HINT: Record<string, string> = {
  Vacation: "vacation",
  Sick: "sick",
  Personal: "personal",
  Unpaid: "unpaid",
};

/** Inclusive whole-day span × 8h — a reasonable default ask. */
function hoursBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00");
  const b = new Date(to + "T00:00:00");
  const days = Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1);
  return days * 8;
}

/**
 * Request time off → inserts a `time_off_requests` row (initial request_state
 * `pending`) against the best-matching org policy, then pings the manager band.
 */
export async function requestTimeOff(_prev: State, fd: FormData): Promise<State> {
  const session = await requireSession();
  const parsed = Input.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) if (i.path[0]) fieldErrors[String(i.path[0])] = i.message;
    return { error: "Please fix the errors below.", fieldErrors };
  }
  const v = parsed.data;

  const supabase = await createClient();

  // Resolve a policy: prefer the kind hinted by the form's Type, else any
  // active policy in the org.
  const { data: policies } = await supabase
    .from("time_off_policies")
    .select("id, policy_kind")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  const list = (policies ?? []) as Array<{ id: string; policy_kind: string | null }>;
  if (list.length === 0) {
    return { error: "No time-off policy is configured for your organization yet." };
  }
  const hint = KIND_HINT[v.type ?? ""] ?? "";
  const policy = list.find((p) => p.policy_kind === hint) ?? list[0]!;

  const { error } = await supabase.from("time_off_requests").insert({
    org_id: session.orgId,
    user_id: session.userId,
    policy_id: policy.id,
    starts_on: v.from,
    ends_on: v.to,
    hours_requested: hoursBetween(v.from, v.to),
    reason: v.notes || null,
    request_state: "pending",
  });
  if (error) return { error: error.message };

  const managers = await managerUserIds(session.orgId, session.userId);
  if (managers.length) {
    await sendPushBulk(managers, {
      title: "Time Off Request",
      body: `${v.from} – ${v.to}`,
      // Absolute via urlFor: pushes open on the compvss service-worker
      // origin, where a relative /studio/... path lands on the wrong host.
      url: urlFor("platform", "/workforce/time-off"),
      kind: "time_off",
      scope: "all",
      orgId: session.orgId,
    });
  }

  revalidatePath(v.revalidate);
  if (v.redirectTo) redirect(v.redirectTo);
  return null;
}
