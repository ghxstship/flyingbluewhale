import { Avatar } from "@/components/ui/Avatar";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!hasSupabase) {
    return <div><h1 className="text-2xl font-semibold">Profile</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Configure Supabase.</p></div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: user } = await supabase.from("users").select("*").eq("id", session.userId).maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <div className="surface mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? user?.email} size="lg" />
          <div>
            <div className="text-sm font-semibold">{user?.name ?? "Unnamed"}</div>
            <div className="font-mono text-xs text-[var(--text-muted)]">{user?.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
