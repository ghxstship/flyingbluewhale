import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { TalentOnboardForm } from "./TalentOnboardForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!hasSupabase) return notFound();

  const supabase = await createClient();

  const { data: invite } = await supabase
    .from("talent_invite_tokens")
    .select("id, email, role_hint, message, expires_at, used_at, org_id")
    .eq("token", token)
    .maybeSingle();

  if (!invite) return notFound();
  if (invite.used_at || new Date(invite.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="surface max-w-md w-full space-y-4 p-8 text-center">
          <h1 className="text-xl font-semibold">Link Expired</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            This talent invite link has expired or already been used. Contact the person who invited you for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { data: org } = await supabase.from("orgs").select("name").eq("id", invite.org_id).maybeSingle();

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {org?.name ?? "ATLVS Technologies"}
          </p>
          <h1 className="text-2xl font-bold">You&apos;re invited</h1>
          {invite.role_hint && (
            <p className="text-sm text-[var(--text-secondary)]">Role: {invite.role_hint}</p>
          )}
          {invite.message && (
            <p className="mt-2 text-sm text-[var(--text-secondary)] italic">&ldquo;{invite.message}&rdquo;</p>
          )}
        </div>
        <TalentOnboardForm token={token} prefillEmail={invite.email} />
      </div>
    </div>
  );
}
