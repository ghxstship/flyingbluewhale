import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createChange } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("accreditations")
    .select("id, person_name, person_email")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(500);
  const accreditations = (data ?? []) as Array<{ id: string; person_name: string | null; person_email: string | null }>;

  if (accreditations.length === 0) {
    return (
      <>
        <ModuleHeader eyebrow="Accreditation · Changes" title="New Change Request" />
        <div className="page-content max-w-xl">
          <div className="surface space-y-3 p-6 text-sm">
            <p>You need at least one accreditation on file before you can request a change.</p>
            <Button href="/console/accreditation" size="sm">
              Go to accreditation
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ModuleHeader eyebrow="Accreditation · Changes" title="New Change Request" />
      <div className="page-content max-w-xl">
        <FormShell action={createChange} cancelHref="/console/accreditation/changes" submitLabel="Request change">
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Accreditation</label>
            <select name="accreditation_id" className="input-base mt-1.5 w-full" required>
              {accreditations.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.person_name ?? a.person_email ?? a.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="kind" defaultValue="reissue" className="input-base mt-1.5 w-full" required>
              <option value="reissue">Re-issue</option>
              <option value="role_change">Role change</option>
              <option value="zone_change">Zone change</option>
              <option value="revocation">Revocation</option>
              <option value="lost">Lost / replacement</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Note</label>
            <textarea
              name="note"
              rows={3}
              maxLength={2000}
              className="input-base mt-1.5 w-full"
              placeholder="Reason / detail"
            />
          </div>
        </FormShell>
      </div>
    </>
  );
}
