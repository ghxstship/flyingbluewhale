import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { FinalizeButton, MarkStepDoneButton } from "./AssignmentActions";

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
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
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
      <h1 className="text-xl font-semibold">
        {(flow as { name: string } | null)?.name ?? t("m.onboarding.title", undefined, "Onboarding")}
      </h1>
      {(flow as { description: string | null } | null)?.description && (
        <p className="mt-1 text-xs text-[var(--p-text-2)]">{(flow as { description: string }).description}</p>
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

      {stepList.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            size="compact"
            title={t("m.onboarding.detail.empty.title", undefined, "No Steps Yet")}
            description={t(
              "m.onboarding.detail.empty.description",
              undefined,
              "This onboarding flow has no steps. Check back once your admin publishes them.",
            )}
          />
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {stepList.map((s) => {
            const done = !!progress[s.id];
            return (
              <li key={s.id} className={`surface p-4 ${done ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <Badge variant="muted">{s.step_kind}</Badge>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">#{s.ordinal}</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{s.title}</h2>
                {s.description && <p className="mt-1 text-xs text-[var(--p-text-2)]">{s.description}</p>}
                {!done && a.assignment_phase !== "completed" && (
                  <MarkStepDoneButton assignmentId={a.id} stepId={s.id} />
                )}
                {done && (
                  <p className="mt-2 text-xs text-[var(--p-success)]">
                    {t("m.onboarding.completed", undefined, "✓ Completed")}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      {stepList.length > 0 && requiredDone && a.assignment_phase !== "completed" && (
        <FinalizeButton assignmentId={a.id} />
      )}
    </div>
  );
}
