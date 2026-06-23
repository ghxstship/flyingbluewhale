"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { writeInbox } from "@/lib/inbox";

const Schema = z.object({
  badgeId: z.string().uuid(),
  user_id: z.string().uuid(),
  note: z.string().max(300).optional().or(z.literal("")),
});

export async function awardBadge(fd: FormData): Promise<void> {
  const session = await requireSession();
  if (!isManagerPlus(session)) return;
  const parsed = Schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  const supabase = await createClient();

  // Badge must be in the org.
  const { data: badge } = await supabase
    .from("badges")
    .select("id, name, icon")
    .eq("id", parsed.data.badgeId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!badge) return;

  // Recipient must be an org member.
  const { data: member } = await supabase
    .from("memberships")
    .select("user_id")
    .eq("org_id", session.orgId)
    .eq("user_id", parsed.data.user_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return;

  const { error, data: award } = await supabase
    .from("badge_awards")
    .insert({
      org_id: session.orgId,
      badge_id: parsed.data.badgeId,
      user_id: parsed.data.user_id,
      awarded_by: session.userId,
      note: parsed.data.note || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Could not create badge award: ${error.message}`);

  // Notify the recipient — lands in /me/notifications/inbox AND fires push.
  const b = badge as { name: string; icon: string | null };
  if (award) {
    void writeInbox({
      userId: parsed.data.user_id,
      orgId: session.orgId,
      kind: "badge",
      sourceType: "badge_awards",
      sourceId: (award as { id: string }).id,
      actorId: session.userId,
      title: `${b.icon ?? "🏅"} ${b.name}`,
      body: parsed.data.note || "You earned a badge.",
      href: "/m/feed",
    });
  }

  revalidatePath(`/studio/workforce/badges/${parsed.data.badgeId}`);
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
  const { error } = await supabase.from("badges").delete().eq("id", badgeId).eq("org_id", session.orgId);
  if (error) throw new Error(`Could not delete badge: ${error.message}`);
  revalidatePath("/studio/workforce/badges");
  redirect("/studio/workforce/badges");
}
