import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { completeStep, finalizeAssignment } from "../actions";

export const dynamic = "force-dynamic";

type Step = {
  id: string;
  ordinal: number;
  title: string;
  description: string | null;
  step_kind: string;
  required: boolean;
};

export default async function Page({ params }: { params: Promise<{ assignmentId: string }> }) {
  if (!hasSupabase) return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  const { assignmentId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from("new_hire_assignments")
    .select("id, flow_id, assignment_phase, progress, completed_at")
    .eq("id", assignmentId)
    .eq("assignee_id", session.userId)
    .maybeSingle();
  if (!assignment) notFound();
  const a = assignment as {
    id: string;
    flow_id: string;
    assignment_phase: string;
    progress: Record<string, boolean>;
    completed_at: string | null;
  };

  const [{ data: flow }, { data: steps }] = await Promise.all([
    supabase.from("new_hire_flows").select("name, description").eq("id", a.flow_id).maybeSingle(),
    supabase
      .from("new_hire_flow_steps")
      .select("id, ordinal, title, description, step_kind, required")
      .eq("flow_id", a.flow_id)
      .order("ordinal"),
  ]);
  const stepList = (steps ?? []) as Step[];
  const progress = (a.progress ?? {}) as Record<string, boolean>;
  const requiredDone = stepList.filter((s) => s.required).every((s) => progress[s.id]);

  return (
    <div className="px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold">{(flow as { name: string } | null)?.name ?? "Onboarding"}</h1>
      {(flow as { description: string | null } | null)?.description && (
        <p className="mt-1 text-xs text-[var(--text-secondary)]">{(flow as { description: string }).description}</p>
      )}
      <div className="mt-2">
        <Badge
          variant={
            a.assignment_phase === "completed" ? "success" : a.assignment_phase === "abandoned" ? "muted" : "info"
          }
        >
          {a.assignment_phase}
        </Badge>
      </div>

      <ol className="mt-5 space-y-3">
        {stepList.map((s) => {
          const done = !!progress[s.id];
          return (
            <li key={s.id} className={`surface p-4 ${done ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <Badge variant="muted">{s.step_kind}</Badge>
                <span className="font-mono text-xs text-[var(--text-muted)]">#{s.ordinal}</span>
              </div>
              <h2 className="mt-2 text-sm font-semibold">{s.title}</h2>
              {s.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.description}</p>}
              {!done && a.assignment_phase !== "completed" && (
                <form action={completeStep} className="mt-3 flex justify-end">
                  <input type="hidden" name="assignmentId" value={a.id} />
                  <input type="hidden" name="stepId" value={s.id} />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Mark Done
                  </button>
                </form>
              )}
              {done && <p className="mt-2 text-xs text-[var(--color-success)]">✓ Completed</p>}
            </li>
          );
        })}
      </ol>

      {requiredDone && a.assignment_phase !== "completed" && (
        <form action={finalizeAssignment} className="mt-6">
          <input type="hidden" name="assignmentId" value={a.id} />
          <button type="submit" className="btn btn-primary w-full">
            Finish Onboarding
          </button>
        </form>
      )}
    </div>
  );
}
