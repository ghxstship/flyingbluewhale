import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { advanceState, deleteAssignment, reassignAssignment } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  credential_assignment: "Credential",
  catering_assignment: "Catering",
  radio_assignment: "Radio",
  tool_assignment: "Tool",
  equipment_assignment: "Equipment",
  uniform_assignment: "Uniform",
  travel_assignment: "Travel",
  lodging_assignment: "Lodging",
  vehicle_assignment: "Vehicle",
};

// Sequential state arc — what state.deliverable_state can transition to.
const NEXT_STATES: Record<string, string[]> = {
  briefed: ["draft", "submitted"],
  draft: ["submitted"],
  submitted: ["in_review", "approved", "revision_requested", "rejected"],
  in_review: ["approved", "revision_requested", "rejected"],
  revision_requested: ["submitted", "rejected"],
  approved: ["delivered"],
  delivered: [],
  rejected: [],
};

export default async function Page({ params }: { params: Promise<{ projectId: string; deliverableId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { projectId, deliverableId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: row } = await supabase
    .from("deliverables")
    .select("id, type, title, deliverable_state, deadline, assignee_id, data, updated_at, created_at")
    .eq("id", deliverableId)
    .eq("org_id", session.orgId)
    .eq("project_id", projectId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) notFound();
  const d = row as {
    id: string;
    type: string;
    title: string | null;
    deliverable_state: string;
    deadline: string | null;
    assignee_id: string | null;
    data: { notes?: string } | null;
    updated_at: string;
    created_at: string;
  };

  // Hydrate assignee + org members for reassignment dropdown.
  const [{ data: assignee }, { data: members }] = await Promise.all([
    d.assignee_id
      ? supabase.from("users").select("id, email, name").eq("id", d.assignee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);
  const a = assignee as { email: string; name: string | null } | null;
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((x, y) => (x.name ?? x.email).localeCompare(y.name ?? y.email));

  const allowed = NEXT_STATES[d.deliverable_state] ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={KIND_LABEL[d.type] ?? d.type.replace(/_/g, " ")}
        title={d.title ?? "Untitled"}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={d.deliverable_state} />
            <Badge variant="muted">{a?.name ?? a?.email ?? "Unassigned"}</Badge>
            {d.deadline && <span className="font-mono text-xs">due {fmt.date(d.deadline)}</span>}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/projects/${projectId}/advancing/assignments`} variant="ghost" size="sm">
              Back
            </Button>
            <DeleteForm
              action={deleteAssignment.bind(null, projectId, d.id)}
              confirm="Cancel this assignment? The assignee will no longer see it on their advancing surface."
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {d.data?.notes && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Notes</h2>
            <p className="mt-2 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{d.data.notes}</p>
          </section>
        )}

        {allowed.length > 0 && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Advance State</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Move the assignment forward in the advancing → fulfillment → tracking lifecycle.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {allowed.map((next) => (
                <form key={next} action={advanceState}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="deliverableId" value={d.id} />
                  <input type="hidden" name="next_state" value={next} />
                  <Button type="submit" variant="secondary" size="sm">
                    → {next.replace(/_/g, " ")}
                  </Button>
                </form>
              ))}
            </div>
          </section>
        )}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Reassign</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Hand this off to a different person. The new assignee is push-notified.
          </p>
          <form action={reassignAssignment} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="deliverableId" value={d.id} />
            <select name="assignee_id" required defaultValue={d.assignee_id ?? ""} className="input-base flex-1">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary" size="sm">
              Save
            </Button>
          </form>
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Created {fmt.date(d.created_at)} · Last updated {fmt.date(d.updated_at)}
        </p>
      </div>
    </>
  );
}
