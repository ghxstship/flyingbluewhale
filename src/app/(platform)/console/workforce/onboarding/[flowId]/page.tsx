import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { addStep, publishFlow, assignFlow } from "./actions";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Step = {
  id: string;
  ordinal: number;
  title: string;
  description: string | null;
  step_kind: string;
  required: boolean;
};

type Assignment = {
  id: string;
  assignee_id: string;
  assignment_phase: string;
  assigned_at: string;
  completed_at: string | null;
};

export default async function Page({ params }: { params: Promise<{ flowId: string }> }) {
  if (!hasSupabase) return <div className="page-content">Configure Supabase.</div>;
  const { flowId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();

  const { data: flow } = await supabase
    .from("new_hire_flows")
    .select("id, name, description, target_role, publish_state")
    .eq("id", flowId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!flow) notFound();
  const f = flow as {
    id: string;
    name: string;
    description: string | null;
    target_role: string | null;
    publish_state: string;
  };

  const [{ data: steps }, { data: assignments }, { data: members }] = await Promise.all([
    supabase
      .from("new_hire_flow_steps")
      .select("id, ordinal, title, description, step_kind, required")
      .eq("flow_id", flowId)
      .order("ordinal"),
    supabase
      .from("new_hire_assignments")
      .select("id, assignee_id, assignment_phase, assigned_at, completed_at")
      .eq("flow_id", flowId)
      .order("assigned_at", { ascending: false }),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const stepList = (steps ?? []) as Step[];
  const assignmentList = (assignments ?? []) as Assignment[];
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u);
  const memberMap = new Map(memberList.map((m) => [m.id, m.name ?? m.email]));
  const assigned = new Set(assignmentList.map((a) => a.assignee_id));

  return (
    <>
      <ModuleHeader
        eyebrow="Onboarding Flow"
        title={f.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={f.publish_state === "published" ? "success" : "info"}>{f.publish_state}</Badge>
            {f.target_role && <span className="font-mono text-xs">{f.target_role}</span>}
            <span className="font-mono text-xs">
              {stepList.length} steps · {assignmentList.length} assignees
            </span>
          </span>
        }
        action={
          f.publish_state === "draft" ? (
            <form action={publishFlow}>
              <input type="hidden" name="flowId" value={f.id} />
              <Button type="submit" size="sm">
                Publish
              </Button>
            </form>
          ) : null
        }
      />
      <div className="page-content grid gap-4 lg:grid-cols-2">
        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Steps</h2>
          <ol className="mt-3 space-y-2">
            {stepList.map((s) => (
              <li key={s.id} className="rounded-md border border-[var(--border-color)] p-3">
                <div className="flex items-center justify-between">
                  <Badge variant="muted">{s.step_kind}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">#{s.ordinal}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{s.title}</div>
                {s.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.description}</p>}
              </li>
            ))}
          </ol>
          {f.publish_state === "draft" && (
            <form action={addStep} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
              <input type="hidden" name="flowId" value={f.id} />
              <input
                type="text"
                name="title"
                placeholder="Step title"
                required
                maxLength={200}
                className="input-base w-full"
              />
              <textarea
                name="description"
                rows={2}
                placeholder="What the new hire needs to do"
                maxLength={2000}
                className="input-base w-full"
              />
              <select name="step_kind" className="input-base w-full" defaultValue="read">
                <option value="read">Read</option>
                <option value="sign">Sign</option>
                <option value="upload">Upload</option>
                <option value="quiz">Quiz</option>
                <option value="course">Course</option>
                <option value="form">Form</option>
              </select>
              <button type="submit" className="btn btn-secondary btn-sm">
                + Add Step
              </button>
            </form>
          )}
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">Assignees</h2>
          <ul className="mt-3 space-y-2">
            {assignmentList.map((a) => {
              const tone =
                a.assignment_phase === "completed"
                  ? "success"
                  : a.assignment_phase === "abandoned"
                    ? "muted"
                    : a.assignment_phase === "in_progress"
                      ? "info"
                      : "warning";
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-md border border-[var(--border-color)] p-3"
                >
                  <div>
                    <div className="text-sm font-semibold">{memberMap.get(a.assignee_id) ?? "Unknown"}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      assigned {fmtIntl.date(a.assigned_at)}
                    </div>
                  </div>
                  <Badge variant={tone}>{a.assignment_phase}</Badge>
                </li>
              );
            })}
          </ul>
          {f.publish_state === "published" && (
            <form action={assignFlow} className="mt-4 space-y-2 border-t border-[var(--border-color)] pt-4">
              <input type="hidden" name="flowId" value={f.id} />
              <select name="assignee_id" required className="input-base w-full">
                {memberList
                  .filter((m) => !assigned.has(m.id))
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name ?? m.email}
                    </option>
                  ))}
              </select>
              <button type="submit" className="btn btn-secondary btn-sm">
                + Assign
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
