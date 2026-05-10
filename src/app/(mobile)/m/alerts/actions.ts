"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const Schema = z.object({ alertId: z.string().uuid() });

export async function acknowledgeAlert(fd: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Cross-tenant FK guard on alert_id. Without this, a member of org A
  // could acknowledge an alert from org B by passing its UUID, polluting
  // org B's acknowledgement audit trail.
  const { data: alert } = await supabase
    .from("crisis_alerts")
    .select("id")
    .eq("id", parsed.alertId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!alert) return;

  // Upsert receipt for (alert_id, user_id) and stamp acknowledged_at.
  await (
    supabase.from("crisis_alert_receipts") as unknown as {
      upsert: (
        p: Record<string, unknown>,
        opts?: Record<string, unknown>,
      ) => Promise<{ error: { message: string } | null }>;
    }
  ).upsert(
    {
      org_id: session.orgId,
      alert_id: parsed.alertId,
      user_id: session.userId,
      acknowledged_at: new Date().toISOString(),
    },
    { onConflict: "alert_id,user_id" },
  );
  revalidatePath("/m/alerts");
}
