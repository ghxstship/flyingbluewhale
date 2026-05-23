import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { AtomPicker } from "@/components/xpms/AtomPicker";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { createAssignmentAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const [{ data: members }, { data: atoms }, { data: catalog }] = await Promise.all([
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("xpms_atoms")
      .select("id, identifier, name")
      .eq("org_id", session.orgId)
      .eq("project_id", projectId)
      .order("identifier", { ascending: true }),
    supabase
      .from("master_catalog_items")
      .select("id, kind, code, name")
      .eq("org_id", session.orgId)
      .eq("active", true)
      .order("kind", { ascending: true })
      .order("name", { ascending: true })
      .limit(500),
  ]);
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
  const atomOptions = (atoms ?? []).map((a) => ({ id: a.id, identifier: a.identifier, name: a.name }));
  const catalogItems = (catalog ?? []) as Array<{ id: string; kind: string; code: string; name: string }>;

  return (
    <>
      <ModuleHeader eyebrow={(project as { name: string }).name} title="New Individual Assignment" />
      <div className="page-content max-w-2xl">
        <FormShell
          action={createAssignmentAction.bind(null, projectId)}
          cancelHref={`/console/projects/${projectId}/advancing/assignments`}
          submitLabel="Create Assignment"
        >
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Kind</label>
            <select name="type" required className="input-base mt-1.5 w-full" defaultValue="credential_assignment">
              <option value="credential_assignment">Credential (badge, pass, NDA)</option>
              <option value="catering_assignment">Catering (meal, dietary accommodation)</option>
              <option value="radio_assignment">Radio</option>
              <option value="tool_assignment">Tool</option>
              <option value="equipment_assignment">Equipment (incl. forklift, golf cart)</option>
              <option value="uniform_assignment">Uniform</option>
              <option value="travel_assignment">Travel (flight, train, rideshare)</option>
              <option value="lodging_assignment">Lodging (hotel, housing)</option>
              <option value="vehicle_assignment">Vehicle</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Catalog Item (optional)</label>
            <select name="catalog_item_id" className="input-base mt-1.5 w-full" defaultValue="">
              <option value="">— Free-text title —</option>
              {catalogItems.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.kind}] {c.code} · {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--text-muted)]">
              Pick a master-catalog SKU to anchor cost rollup + inventory; leave blank to author free-text.
            </p>
          </div>
          <Input
            label="Title"
            name="title"
            required
            maxLength={200}
            placeholder="e.g. Crew Pass · Bay 4 Forklift · Hotel Suite A"
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Assignee</label>
            <select name="assignee_id" required className="input-base mt-1.5 w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
          </div>
          <Input label="Deadline" name="deadline" type="date" hint="When the assignment must be fulfilled by." />
          <AtomPicker
            name="atom_id"
            atoms={atomOptions}
            hint="Pin this assignment to a WBS atom so it rolls up on the project Tracker."
          />
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)]">Notes (optional)</label>
            <textarea name="notes" rows={3} maxLength={2000} className="input-base mt-1.5 w-full" />
          </div>
        </FormShell>
      </div>
    </>
  );
}
