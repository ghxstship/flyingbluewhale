"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({
  policy_id: z.string().uuid(),
  starts_on: z.string().min(1),
  ends_on: z.string().min(1),
  hours_requested: z.string().refine((v) => Number(v) > 0, "Hours must be positive"),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export async function createTimeOffRequest(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Cross-tenant guard on policy_id — RLS would block but the form-replay
  // check here surfaces it before the insert.
  const { data: policy } = await supabase
    .from("time_off_policies")
    .select("id")
    .eq("id", parsed.policy_id)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!policy) return;

  await supabase.from("time_off_requests").insert({
    org_id: session.orgId,
    user_id: session.userId,
    policy_id: parsed.policy_id,
    starts_on: parsed.starts_on,
    ends_on: parsed.ends_on,
    hours_requested: Number(parsed.hours_requested),
    reason: parsed.reason || null,
  });

  revalidatePath("/m/time-off");
  redirect("/m/time-off");
}
