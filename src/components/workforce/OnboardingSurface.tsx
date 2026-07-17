import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import {
  FinalizeButton,
  MarkStepDoneButton,
  ReadStepGate,
  SignStepForm,
  UploadStepForm,
} from "@/app/(mobile)/m/onboarding/[assignmentId]/AssignmentActions";
import { isNewHireStepDone, type NewHireStepProgress } from "@/lib/workforce";

/**
 * Shared onboarding-assignment surface (ADR-0008 Amendment 4).
 *
 * `/p/[slug]/tasks` lists a portal user's onboarding assignment and then
 * linked them to `/m/onboarding/[id]` to actually do it — a cross-shell
 * bounce out of the page that had just told them the task existed, and for
 * vendors, a bounce into an app they can't open.
 *
 * Nothing here needs the field shell: ticking a step is a form. The page was
 * already built on portal-neutral primitives (`Badge`, `EmptyState`,
 * `surface`), so this is the same component in both shells with different
 * padding.
 *
 * `AssignmentActions` is imported from the mobile module rather than moved —
 * the same call `DocsSurface` makes for `DocDownloadLink`. They're small
 * client islands with no shell coupling, and the underlying actions
 * revalidate `/m/onboarding*`, which is harmless here: both routes are
 * `force-dynamic`, so there's no cache entry either path could stale.
 */

type Step = {
  id: string;
  ordinal: number;
  title: string;
  description: string | null;
  step_kind: string;
  required: boolean;
};

export async function OnboardingSurface({
  assignmentId,
  variant,
}: {
  assignmentId: string;
  variant: "mobile" | "portal";
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  // Self-scoped: you can only ever open your own assignment.
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
    progress: Record<string, NewHireStepProgress>;
    completed_at: string | null;
  };

  const [{ data: flow }, { data: steps }] = await Promise.all([
    // soft-delete-exempt: resolves the flow named by an assignment the caller
    // already holds. Archiving a flow retires it from new assignments; it must
    // not blank the header of one already in progress.
    supabase.from("new_hire_flows").select("name, description").eq("id", a.flow_id).maybeSingle(),
    supabase
      .from("new_hire_flow_steps")
      .select("id, ordinal, title, description, step_kind, required")
      .eq("flow_id", a.flow_id)
      .order("ordinal"),
  ]);
  const stepList = (steps ?? []) as Step[];
  const progress = (a.progress ?? {}) as Record<string, NewHireStepProgress>;
  const requiredDone = stepList.filter((s) => s.required).every((s) => isNewHireStepDone(progress[s.id]));

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";

  return (
    <div className={containerClass}>
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
            const done = isNewHireStepDone(progress[s.id]);
            const actionable = !done && a.assignment_phase !== "completed";
            // A read step's description IS the content behind the scroll
            // gate — don't render it twice while the gate is up.
            const gatedRead = actionable && s.step_kind === "read";
            return (
              <li key={s.id} className={`surface p-4 ${done ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between">
                  <Badge variant="muted">{s.step_kind}</Badge>
                  <span className="font-mono text-xs text-[var(--p-text-2)]">#{s.ordinal}</span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{s.title}</h2>
                {s.description && !gatedRead && <p className="mt-1 text-xs text-[var(--p-text-2)]">{s.description}</p>}
                {actionable &&
                  (s.step_kind === "upload" ? (
                    <UploadStepForm assignmentId={a.id} stepId={s.id} />
                  ) : s.step_kind === "sign" ? (
                    <SignStepForm assignmentId={a.id} stepId={s.id} />
                  ) : s.step_kind === "read" ? (
                    <ReadStepGate assignmentId={a.id} stepId={s.id} content={s.description ?? ""} />
                  ) : (
                    <MarkStepDoneButton assignmentId={a.id} stepId={s.id} />
                  ))}
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
