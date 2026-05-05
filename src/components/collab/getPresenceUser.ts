import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Session } from "@/lib/auth";

/**
 * Resolve the minimum public-profile data needed to broadcast on a presence
 * channel. Falls back to the email handle so the avatar always renders
 * something legible even if `users.name` is missing.
 *
 * Used by detail pages to pass `currentUser` into `<Presence>` without each
 * caller hand-rolling the same `users` SELECT.
 */
export async function getPresenceUser(
  session: Session,
): Promise<{ userId: string; displayName: string; avatarUrl?: string }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("name, email, avatar_url")
    .eq("id", session.userId)
    .maybeSingle();

  const fallbackName = session.email.split("@")[0] || "User";
  return {
    userId: session.userId,
    displayName: data?.name?.trim() || fallbackName,
    avatarUrl: data?.avatar_url ?? undefined,
  };
}
