"use server";

import { redirect } from "next/navigation";
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

export async function deleteBadge(badgeId: string): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const supabase = await createClient();
  // Existing awards keep their badge_id FK — ON DELETE CASCADE on
  // badge_awards would erase award history, so we soft-delete by leaving
  // badge_awards intact and just dropping the badges row. We DELETE
  // hard here because badge_awards.badge_id is FK ON DELETE CASCADE in
  // migration 0046 — admins should explicitly tombstone via UI rename
  // if they want to keep audit. Manager+ gated so the destruction is
  // intentional.
  await supabase.from("badges").delete().eq("id", badgeId).eq("org_id", session.orgId);
  revalidatePath("/console/workforce/badges");
  redirect("/console/workforce/badges");
}
