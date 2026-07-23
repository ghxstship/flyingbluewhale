import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { DECISION_KINDS, DECISION_LABEL, ROUTING_LABEL, type RoutingKind } from "@/lib/approvals/queries";
import { recordDecision } from "./actions";

export const dynamic = "force-dynamic";

type Instance = {
  id: string;
  subject_table: string;
  subject_id: string;
  state: string;
  current_step_id: string | null;
  initiated_at: string;
  closed_at: string | null;
  policy: { id: string; name: string; slug: string } | null;
};
type Step = {
  id: string;
  step_number: number;
  routing_kind: string;
  threshold: number | null;
  sla_hours: number | null;
};
type Decision = {
  id: string;
  decision: string;
  notes: string | null;
  decided_at: string;
  step_id: string;
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { id } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: instanceData } = await supabase
    .from("approval_instances")
    .select(
      "id, subject_table, subject_id, state, current_step_id, initiated_at, closed_at, policy:approval_policies(id, name, slug)",
    )
    .eq("id", id)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!instanceData) notFound();
  const instance = instanceData as unknown as Instance;

  // approval_steps + approval_decisions have no org_id — scope via the parent.
  const [{ data: stepsData }, { data: decisionsData }] = await Promise.all([
    instance.policy
      ? supabase
          .from("approval_steps")
          .select("id, step_number, routing_kind, threshold, sla_hours")
          .eq("policy_id", instance.policy.id)
          .order("step_number")
      : Promise.resolve({ data: [] }),
    supabase
      .from("approval_decisions")
      .select("id, decision, notes, decided_at, step_id")
      .eq("instance_id", instance.id)
      .order("decided_at", { ascending: false }),
  ]);
  const steps = (stepsData ?? []) as Step[];
  const decisions = (decisionsData ?? []) as Decision[];

  const open = !["approved", "rejected", "closed", "cancelled"].includes(instance.state);
  const decisionStepId = instance.current_step_id ?? steps[0]?.id ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.detail.eyebrow", undefined, "Approval")}
        title={instance.policy?.name ?? t("console.governance.approvals.detail.untitled", undefined, "Approval")}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={instance.state} />
            <span className="font-mono text-xs">
              {instance.subject_table}/{instance.subject_id.slice(0, 8)}
            </span>
            <span className="font-mono text-xs">{fmt.dateTime(new Date(instance.initiated_at))}</span>
          </span>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        <section className="surface p-4">
          <h2 className="mb-3 text-sm font-medium text-[var(--p-text-1)]">
            {t("console.governance.approvals.detail.stepsHeading", undefined, "Policy steps")}
          </h2>
          {steps.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.governance.approvals.detail.noSteps", undefined, "This policy has no steps yet.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="muted">#{s.step_number}</Badge>
                  <span>{ROUTING_LABEL[s.routing_kind as RoutingKind] ?? s.routing_kind}</span>
                  {s.threshold != null && (
                    <span className="text-[var(--p-text-2)]">
                      {t("console.governance.approvals.detail.threshold", { n: s.threshold }, "threshold {n}")}
                    </span>
                  )}
                  {s.sla_hours != null && (
                    <span className="text-[var(--p-text-2)]">
                      {t("console.governance.approvals.detail.sla", { n: s.sla_hours }, "SLA {n}h")}
                    </span>
                  )}
                  {instance.current_step_id === s.id && (
                    <Badge variant="brand">
                      {t("console.governance.approvals.detail.current", undefined, "Current")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface p-4">
          <h2 className="mb-3 text-sm font-medium text-[var(--p-text-1)]">
            {t("console.governance.approvals.detail.decisionsHeading", undefined, "Decisions")}
          </h2>
          {decisions.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.governance.approvals.detail.noDecisions", undefined, "No decisions recorded yet.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {decisions.map((d) => (
                <li key={d.id} className="flex flex-col gap-1 border-b border-[var(--p-border)] pb-2 text-xs last:border-0">
                  <span className="flex items-center gap-2">
                    <StatusBadge status={d.decision} />
                    <span className="font-mono text-[var(--p-text-2)]">
                      {fmt.dateTime(new Date(d.decided_at))}
                    </span>
                  </span>
                  {d.notes && <span className="whitespace-pre-wrap text-[var(--p-text-2)]">{d.notes}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {open && decisionStepId && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-[var(--p-text-1)]">
              {t("console.governance.approvals.detail.recordHeading", undefined, "Record a decision")}
            </h2>
            <FormShell action={recordDecision} submitLabel={t("common.submit", undefined, "Submit")}>
              <input type="hidden" name="instance_id" value={instance.id} />
              <input type="hidden" name="step_id" value={decisionStepId} />
              <div>
                <label htmlFor="decision" className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.governance.approvals.detail.decisionLabel", undefined, "Decision")}
                </label>
                <select id="decision" name="decision" required className="ps-input mt-1.5 w-full" defaultValue="approved">
                  {DECISION_KINDS.map((d) => (
                    <option key={d} value={d}>
                      {t(`console.governance.approvals.decision.${d}`, undefined, DECISION_LABEL[d])}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="text-xs font-medium text-[var(--p-text-2)]">
                  {t("console.governance.approvals.detail.notesLabel", undefined, "Notes")}
                </label>
                <textarea id="notes" name="notes" rows={3} maxLength={2000} className="ps-input mt-1.5 w-full" />
              </div>
            </FormShell>
          </section>
        )}
      </div>
    </>
  );
}
