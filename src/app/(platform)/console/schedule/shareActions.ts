"use server";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

type TokenRow = { token: string };

export async function createScheduleShareToken(
  orgId: string,
): Promise<{ url?: string; error?: string }> {
  const session = await requireSession();
  if (session.orgId !== orgId) return { error: "Unauthorized." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schedule_share_tokens")
    .insert({
      org_id: orgId,
      title: "Schedule",
      view_type: "events",
      created_by: session.userId,
    })
    .select("token")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create share link." };

  const row = data as TokenRow;
  const hdrs = await headers();
  const host = hdrs.get("host") ?? "atlvs.pro";
  const proto = host.includes("localhost") || host.includes("lvh.me") ? "http" : "https";
  const url = `${proto}://${host}/schedule-share/${encodeURIComponent(row.token)}`;
  return { url };
}
