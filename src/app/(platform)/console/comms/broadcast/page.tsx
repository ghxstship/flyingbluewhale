import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { BroadcastDmForm } from "./BroadcastDmForm";

export const dynamic = "force-dynamic";

export default async function BroadcastDmPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Comms" title="Broadcast DM" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, users:users!inner(id, name, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .neq("user_id", session.userId)
    .order("user_id");

  type Member = { id: string; name: string | null; email: string };
  const people: Member[] = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; name: string | null; email: string } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is Member => !!u);

  return (
    <>
      <ModuleHeader
        eyebrow="Comms"
        title="Broadcast DM"
        subtitle="Send a private message to multiple individuals simultaneously. Each recipient receives their own private thread."
      />
      <div className="page-content max-w-2xl">
        <BroadcastDmForm people={people} />
      </div>
    </>
  );
}
