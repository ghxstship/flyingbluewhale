import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { NewMessageView, type MemberOption } from "./NewMessageView";

/**
 * COMPVSS · New Message — the inbox FAB's target (kit 28: "FAB = New
 * Message").
 *
 * This is also parity gap G15 closing: the field inbox was reply-only —
 * a crew member could only talk in rooms someone on a desktop had already
 * created for them. Channel creation and DM find-or-create go through
 * src/lib/db/chat-rooms.ts, the same logic the console uses.
 */
export const dynamic = "force-dynamic";

export default async function NewMessagePage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("m.inbox.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  // Everyone in the org except the caller — DM candidates.
  const { data: memberRows } = await supabase
    .from("memberships")
    .select("user_id, users(email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("user_id", session.userId)
    .limit(500);

  const members: MemberOption[] = (
    (memberRows ?? []) as unknown as Array<{
      user_id: string;
      users: { email?: string | null; name?: string | null } | null;
    }>
  )
    .map((m) => ({
      id: m.user_id,
      name: m.users?.name || m.users?.email || m.user_id,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <NewMessageView
      members={members}
      eyebrow={t("m.inbox.eyebrow", undefined, "Inbox")}
      title={t("m.inbox.newTitle", undefined, "New Message")}
    />
  );
}
