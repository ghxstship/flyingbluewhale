import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DeleteForm } from "@/components/DeleteForm";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { advanceState, deleteAssignment, postComment, reassignAssignment } from "./actions";
import { toTitle } from "@/lib/format";

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

  // Hydrate assignee + org members + activity ledger + comment thread.
  // History and comments were previously orphaned tables (existed in
  // schema, never rendered) — surfacing them turns this page into the
  // single source of truth for the assignment lifecycle.
  const [{ data: assignee }, { data: members }, { data: history }, { data: comments }] = await Promise.all([
    d.assignee_id
      ? supabase.from("users").select("id, email, name").eq("id", d.assignee_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("deliverable_history")
      .select(
        "id, version, data, changed_at, changed_by, changed_by_user:users!deliverable_history_changed_by_fkey(name, email)",
      )
      .eq("deliverable_id", deliverableId)
      .order("changed_at", { ascending: false }),
    supabase
      .from("deliverable_comments")
      .select("id, body, created_at, user:users!deliverable_comments_user_id_fkey(name, email)")
      .eq("deliverable_id", deliverableId)
      .order("created_at", { ascending: true }),
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

  type HistoryRow = {
    id: string;
    version: number;
    data: { kind?: string; from?: string; to?: string } | null;
    changed_at: string;
    changed_by_user: { name: string | null; email: string | null } | null;
  };
  type CommentRow = {
    id: string;
    body: string;
    created_at: string;
    user: { name: string | null; email: string | null } | null;
  };
  const historyRows = (history ?? []) as unknown as HistoryRow[];
  const commentRows = (comments ?? []) as unknown as CommentRow[];

  const allowed = NEXT_STATES[d.deliverable_state] ?? [];

  return (
    <>
      <ModuleHeader
        eyebrow={KIND_LABEL[d.type] ?? toTitle(d.type)}
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
            <Link href={`/console/projects/${projectId}/advancing/assignments`} className="btn btn-ghost btn-sm">
              Back
            </Link>
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
                    → {toTitle(next)}
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

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Comments</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Back-and-forth between the assignee and the project team. The assignee is push-notified on every new
            comment.
          </p>
          <ol className="mt-3 space-y-3">
            {commentRows.length === 0 ? (
              <li className="text-xs text-[var(--text-muted)]">No comments yet.</li>
            ) : (
              commentRows.map((c) => (
                <li key={c.id} className="surface-inset rounded-md p-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {c.user?.name ?? c.user?.email ?? "Unknown"}
                    </span>
                    <span className="font-mono">{fmt.date(c.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{c.body}</p>
                </li>
              ))
            )}
          </ol>
          <form action={postComment} className="mt-3 space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="deliverableId" value={d.id} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={4000}
              placeholder="Add a comment for the assignee…"
              className="input-base w-full resize-y"
            />
            <div className="flex justify-end">
              <Button type="submit" variant="secondary" size="sm">
                Post Comment
              </Button>
            </div>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Every state transition, in reverse chronological order.
          </p>
          <ol className="mt-3 space-y-2 text-xs">
            {historyRows.length === 0 ? (
              <li className="text-[var(--text-muted)]">No transitions recorded yet.</li>
            ) : (
              historyRows.map((h) => {
                const from = h.data?.from;
                const to = h.data?.to;
                const actor = h.changed_by_user?.name ?? h.changed_by_user?.email ?? "system";
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
                  >
                    <span>
                      <span className="font-mono text-[var(--text-muted)]">v{h.version}</span>{" "}
                      {from && to ? (
                        <>
                          <Badge variant="muted">{toTitle(from)}</Badge> → <Badge variant="info">{toTitle(to)}</Badge>
                        </>
                      ) : (
                        <span className="text-[var(--text-secondary)]">snapshot</span>
                      )}{" "}
                      <span className="text-[var(--text-muted)]">by {actor}</span>
                    </span>
                    <span className="font-mono text-[var(--text-muted)]">{fmt.date(h.changed_at)}</span>
                  </li>
                );
              })
            )}
          </ol>
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Created {fmt.date(d.created_at)} · Last updated {fmt.date(d.updated_at)}
        </p>
      </div>
    </>
  );
}
