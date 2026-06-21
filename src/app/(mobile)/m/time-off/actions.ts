"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { managerUserIds } from "@/lib/db/managers";

export type State = { error?: string; fieldErrors?: Record<string, string> } | null;

const Input = z.object({
  // kit timeoff form field ids
  from: z.string().min(1, "Pick a start date."),
  to: z.string().min(1, "Pick an end date."),
  type: z.string().optional(),
  notes: z.string().optional(),
});

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
  if (v.to < v.from) return { error: "End date must be on or after the start date.", fieldErrors: { to: "Invalid range" } };

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
      url: "/console/workforce/time-off",
      kind: "time_off",
      scope: "all",
      orgId: session.orgId,
    });
  }

  revalidatePath("/m/time-off");
  return null;
}
