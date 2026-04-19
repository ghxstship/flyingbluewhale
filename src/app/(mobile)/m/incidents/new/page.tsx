export const dynamic = "force-dynamic";

import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { IncidentForm } from "@/components/incidents/IncidentForm";

export default async function IncidentNew() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--color-error)]">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Incident report</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Log a safety issue — admin and EHS lead are notified immediately.
      </p>
      <div className="mt-6">
        <IncidentForm projects={projects ?? []} returnHref="/m" />
      </div>
    </div>
  );
}
