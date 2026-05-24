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
import {
  CATALOG_KIND_LABEL_SINGULAR,
  NEXT_FULFILLMENT_STATES,
  getAssignment,
  type FulfillmentState,
} from "@/lib/db/assignments";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ projectId: string; assignmentId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { projectId, assignmentId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const a = await getAssignment(session.orgId, assignmentId);
  if (!a || a.project_id !== projectId) notFound();

  const [{ data: party }, { data: members }, { data: events }] = await Promise.all([
    a.party_kind === "user" && a.party_user_id
      ? supabase.from("users").select("id, email, name").eq("id", a.party_user_id).maybeSingle()
      : a.party_kind === "crew_member" && a.party_crew_id
        ? supabase.from("crew_members").select("id, name, email").eq("id", a.party_crew_id).maybeSingle()
        : a.party_kind === "external_holder" && a.party_external_id
          ? supabase
              .from("assignment_external_holders")
              .select("id, holder_name, holder_email")
              .eq("id", a.party_external_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
    supabase
      .from("assignment_events")
      .select(
        "id, event_kind, from_state, to_state, body, payload, at, actor_user_id, actor:users!assignment_events_actor_user_id_fkey(name, email)",
      )
      .eq("assignment_id", assignmentId)
      .order("at", { ascending: false }),
  ]);

  const partyLabel =
    a.party_kind === "user"
      ? ((party as { name: string | null; email: string } | null)?.name ??
        (party as { email: string } | null)?.email ??
        "Unassigned")
      : a.party_kind === "crew_member"
        ? ((party as { name: string } | null)?.name ?? "Unknown crew")
        : ((party as { holder_name: string | null; holder_email: string | null } | null)?.holder_name ??
          (party as { holder_email: string | null } | null)?.holder_email ??
          "Guest");

  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u)
    .sort((x, y) => (x.name ?? x.email).localeCompare(y.name ?? y.email));

  type EventRow = {
    id: string;
    event_kind: string;
    from_state: string | null;
    to_state: string | null;
    body: string | null;
    payload: Record<string, unknown> | null;
    at: string;
    actor_user_id: string | null;
    actor: { name: string | null; email: string | null } | null;
  };
  const eventRows = (events ?? []) as unknown as EventRow[];
  const commentRows = eventRows.filter((e) => e.event_kind === "comment" && e.body);
  const auditRows = eventRows.filter((e) => e.event_kind !== "comment");

  const allowed = NEXT_FULFILLMENT_STATES[a.fulfillment_state as FulfillmentState] ?? [];
  const notes = (a.data as { notes?: string } | null)?.notes ?? a.notes ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow={CATALOG_KIND_LABEL_SINGULAR[a.catalog_kind]}
        title={a.title ?? "Untitled"}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={a.fulfillment_state} />
            <Badge variant="muted">{partyLabel}</Badge>
            {a.deadline && <span className="font-mono text-xs">due {fmt.date(a.deadline)}</span>}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <Link href={`/console/projects/${projectId}/advancing/assignments`} className="btn btn-ghost btn-sm">
              Back
            </Link>
            <DeleteForm
              action={deleteAssignment.bind(null, projectId, a.id)}
              confirm="Cancel this assignment? The assignee will no longer see it on their advancing surface."
            />
          </div>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {notes && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Notes</h2>
            <p className="mt-2 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{notes}</p>
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
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="next_state" value={next} />
                  <Button type="submit" variant="secondary" size="sm">
                    → {toTitle(next)}
                  </Button>
                </form>
              ))}
            </div>
          </section>
        )}

        {a.party_kind === "user" && (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">Reassign</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Hand this off to a different person. The new assignee is push-notified.
            </p>
            <form action={reassignAssignment} className="mt-3 flex items-end gap-2">
              <input type="hidden" name="projectId" value={projectId} />
              <input type="hidden" name="assignmentId" value={a.id} />
              <select name="party_user_id" required defaultValue={a.party_user_id ?? ""} className="input-base flex-1">
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
        )}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Comments</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Back-and-forth between the assignee and the project team. The assignee is push-notified on every new
            comment.
          </p>
          <ol className="mt-3 space-y-3">
            {commentRows.length === 0 ? (
              <li className="text-xs text-[var(--text-muted)]">No comments.</li>
            ) : (
              commentRows.map((c) => (
                <li key={c.id} className="surface-inset rounded-md p-3">
                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {c.actor?.name ?? c.actor?.email ?? "Unknown"}
                    </span>
                    <span className="font-mono">{fmt.date(c.at)}</span>
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{c.body}</p>
                </li>
              ))
            )}
          </ol>
          <form action={postComment} className="mt-3 space-y-2">
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="assignmentId" value={a.id} />
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
            Every state transition + scan + comment, in reverse chronological order. One log for everything.
          </p>
          <ol className="mt-3 space-y-2 text-xs">
            {auditRows.length === 0 ? (
              <li className="text-[var(--text-muted)]">No activity recorded.</li>
            ) : (
              auditRows.map((e) => {
                const actor = e.actor?.name ?? e.actor?.email ?? "system";
                return (
                  <li
                    key={e.id}
                    className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 last:border-0"
                  >
                    <span>
                      <Badge variant="muted">{toTitle(e.event_kind)}</Badge>{" "}
                      {e.from_state && e.to_state ? (
                        <>
                          <Badge variant="muted">{toTitle(e.from_state)}</Badge> →{" "}
                          <Badge variant="info">{toTitle(e.to_state)}</Badge>{" "}
                        </>
                      ) : null}
                      <span className="text-[var(--text-muted)]">by {actor}</span>
                    </span>
                    <span className="font-mono text-[var(--text-muted)]">{fmt.date(e.at)}</span>
                  </li>
                );
              })
            )}
          </ol>
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Created {fmt.date(a.created_at)} · Last updated {fmt.date(a.updated_at)}
        </p>
      </div>
    </>
  );
}
