"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient, createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";
import { sendPushBulk } from "@/lib/push/send";
import { log } from "@/lib/log";

const Schema = z
  .object({
    policy_id: z.string().uuid(),
    starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be a valid date"),
    ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be a valid date"),
    hours_requested: z
      .string()
      .refine((v) => Number(v) > 0, "Hours must be positive")
      .refine((v) => Number(v) <= 2000, "Hours requested is too large"),
    reason: z.string().max(1000).optional().or(z.literal("")),
  })
  .refine((v) => v.starts_on <= v.ends_on, {
    message: "End date must be on or after the start date",
    path: ["ends_on"],
  });

export async function createTimeOffRequest(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Cross-tenant guard on policy_id — RLS would block but the form-replay
  // check here surfaces it before the insert.
  const { data: policy } = await supabase
    .from("time_off_policies")
    .select("id")
    .eq("id", parsed.data.policy_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!policy) return;

  const { error } = await supabase.from("time_off_requests").insert({
    org_id: session.orgId,
    user_id: session.userId,
    policy_id: parsed.data.policy_id,
    starts_on: parsed.data.starts_on,
    ends_on: parsed.data.ends_on,
    hours_requested: Number(parsed.data.hours_requested),
    reason: parsed.data.reason || null,
  });
  if (error) throw new Error(`Could not submit time-off request: ${error.message}`);

  // Tell the approvers — the console decision→requester direction was
  // already wired, but submissions used to land silently and managers
  // only found them by visiting /console/workforce/time-off.
  // Best-effort: a notify failure never rolls back the request.
  try {
    if (isServiceClientAvailable()) {
      const service = createServiceClient();
      const { data: approvers } = await service
        .from("memberships")
        .select("user_id")
        .eq("org_id", session.orgId)
        .in("role", ["owner", "admin", "manager"])
        .is("deleted_at", null);
      const approverIds = ((approvers ?? []) as Array<{ user_id: string }>)
        .map((a) => a.user_id)
        .filter((id) => id !== session.userId);
      if (approverIds.length > 0) {
        await sendPushBulk(approverIds, {
          title: "Time Off Requested",
          body: `${parsed.data.starts_on} – ${parsed.data.ends_on}${parsed.data.reason ? ` · ${parsed.data.reason}` : ""}`,
          url: "/console/workforce/time-off",
          kind: "time_off",
          scope: "platform",
          orgId: session.orgId,
        });
      }
    }
  } catch (e) {
    log.warn("time_off.request_notify_failed", { err: e instanceof Error ? e.message : String(e) });
  }

  revalidatePath("/m/time-off");
  redirect("/m/time-off");
}
