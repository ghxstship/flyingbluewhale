import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { updatePerson, type State } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ personId: string }> }) {
  const p = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("memberships")
    .select("id, role, users:users(id, name, email)")
    .eq("org_id", session.orgId)
    .eq("user_id", p.personId)
    .maybeSingle();
  type Row = { id: string; role: string; users: { id: string; name: string | null; email: string } | null };
  const typed = row as unknown as Row | null;
  if (!typed) notFound();
  const action = updatePerson.bind(null, p.personId) as unknown as (state: State, fd: FormData) => Promise<State>;
  return (
    <>
      <ModuleHeader eyebrow="Member" title={`Edit ${typed.users?.name ?? typed.users?.email ?? "member"}`} />
      <div className="page-content max-w-xl">
        <FormShell action={action} cancelHref={`/console/people/${p.personId}`} submitLabel="Save Changes">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">Role</span>
            <select name="role" defaultValue={typed.role} required className="input-base focus-ring w-full">
              <option value="developer">developer</option>
              <option value="owner">owner</option>
              <option value="admin">admin</option>
              <option value="controller">controller</option>
              <option value="collaborator">collaborator</option>
              <option value="contractor">contractor</option>
              <option value="crew">crew</option>
              <option value="client">client</option>
              <option value="viewer">viewer</option>
              <option value="community">community</option>
            </select>
          </label>
          <p className="text-xs text-[var(--text-muted)]">Profile fields (name, email) are managed by the user.</p>
        </FormShell>
      </div>
    </>
  );
}
