"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendPushTo } from "@/lib/push/send";

const Schema = z.object({
  badgeId: z.string().uuid(),
  user_id: z.string().uuid(),
  note: z.string().max(300).optional().or(z.literal("")),
});

export async function awardBadge(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.parse(Object.fromEntries(fd));
  const supabase = await createClient();

  // Badge must be in the org.
  const { data: badge } = await supabase
    .from("badges")
    .select("id, name, icon")
    .eq("id", parsed.badgeId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!badge) return;

  // Recipient must be an org member.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  await supabase.from("badge_awards").insert({
    org_id: session.orgId,
    badge_id: parsed.badgeId,
    user_id: parsed.user_id,
    awarded_by: session.userId,
    note: parsed.note || null,
  });

  // Push notify the recipient.
  const b = badge as { name: string; icon: string | null };
  void sendPushTo(parsed.user_id, {
    title: `${b.icon ?? "🏅"} ${b.name}`,
    body: parsed.note || "You earned a badge.",
    url: "/m/kudos",
    tag: `badge:${parsed.badgeId}:${parsed.user_id}:${Date.now()}`,
  });

  revalidatePath(`/console/workforce/badges/${parsed.badgeId}`);
}
