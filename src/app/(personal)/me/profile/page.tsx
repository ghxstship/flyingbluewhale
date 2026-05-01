import { Avatar } from "@/components/ui/Avatar";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updateProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!hasSupabase) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Configure Supabase.</p>
      </div>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data: user } = await supabase.from("users").select("*").eq("id", session.userId).maybeSingle();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Your display name and avatar are visible to teammates across all workspaces.
      </p>
      <div className="surface mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name ?? user?.email} src={user?.avatar_url ?? undefined} size="lg" />
          <div>
            <div className="text-sm font-semibold">{user?.name ?? "Unnamed"}</div>
            <div className="font-mono text-xs text-[var(--text-muted)]">{user?.email}</div>
          </div>
        </div>
      </div>
      <div className="surface mt-6 p-6">
        <h2 className="text-sm font-semibold">Edit Profile</h2>
        <div className="mt-4 max-w-md">
          <FormShell action={updateProfile} submitLabel="Save Profile">
            <Input label="Display Name" name="name" maxLength={120} defaultValue={user?.name ?? ""} required />
            <Input
              label="Avatar URL"
              name="avatar_url"
              type="url"
              maxLength={500}
              defaultValue={user?.avatar_url ?? ""}
              placeholder="https://…"
            />
          </FormShell>
        </div>
      </div>
    </div>
  );
}
