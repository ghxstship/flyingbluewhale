import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { ROUTING_KINDS, ROUTING_LABEL, type RoutingKind } from "@/lib/approvals/queries";
import { addStep } from "./actions";

export const dynamic = "force-dynamic";

type Policy = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  applies_to: string;
  version: number;
  active: boolean;
  created_at: string;
};
type Step = {
  id: string;
  step_number: number;
  routing_kind: string;
  threshold: number | null;
  sla_hours: number | null;
};

export default async function Page({ params }: { params: Promise<{ policyId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.policies.detail.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const { policyId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("approval_policies")
    .select("id, slug, name, description, applies_to, version, active, created_at")
    .eq("id", policyId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) notFound();
  const policy = data as Policy;

  // approval_steps has no org_id — scoped via policy_id.
  const { data: stepsData } = await supabase
    .from("approval_steps")
    .select("id, step_number, routing_kind, threshold, sla_hours")
    .eq("policy_id", policy.id)
    .order("step_number");
  const steps = (stepsData ?? []) as Step[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.policies.detail.eyebrow", undefined, "Approval Policy")}
        title={policy.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={policy.active ? "success" : "muted"}>
              {policy.active
                ? t("console.governance.approvals.policies.detail.active", undefined, "Active")
                : t("console.governance.approvals.policies.detail.inactive", undefined, "Inactive")}
            </Badge>
            <span className="font-mono text-xs">{policy.slug}</span>
            <span className="font-mono text-xs">v{policy.version}</span>
            <Badge variant="muted">{policy.applies_to}</Badge>
          </span>
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {policy.description && (
          <section className="surface p-4 text-sm whitespace-pre-wrap">{policy.description}</section>
        )}

        <section className="surface p-4">
          <h2 className="mb-3 text-sm font-medium text-[var(--p-text-1)]">
            {t("console.governance.approvals.policies.detail.stepsHeading", undefined, "Steps")}
          </h2>
          {steps.length === 0 ? (
            <p className="text-xs text-[var(--p-text-2)]">
              {t("console.governance.approvals.policies.detail.noSteps", undefined, "No steps yet.")}
            </p>
          ) : (
            <ul className="space-y-2">
              {steps.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="muted">#{s.step_number}</Badge>
                  <span>{ROUTING_LABEL[s.routing_kind as RoutingKind] ?? s.routing_kind}</span>
                  {s.threshold != null && (
                    <span className="text-[var(--p-text-2)]">
                      {t("console.governance.approvals.policies.detail.threshold", { n: s.threshold }, "threshold {n}")}
                    </span>
                  )}
                  {s.sla_hours != null && (
                    <span className="text-[var(--p-text-2)]">
                      {t("console.governance.approvals.policies.detail.sla", { n: s.sla_hours }, "SLA {n}h")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-sm font-medium text-[var(--p-text-1)]">
            {t("console.governance.approvals.policies.detail.addStepHeading", undefined, "Add a step")}
          </h2>
          <FormShell action={addStep} submitLabel={t("common.add", undefined, "Add step")}>
            <input type="hidden" name="policy_id" value={policy.id} />
            <Input
              label={t("console.governance.approvals.policies.detail.stepNumberLabel", undefined, "Step number")}
              name="step_number"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={String(steps.length + 1)}
            />
            <div>
              <label className="text-xs font-medium text-[var(--p-text-2)]">
                {t("console.governance.approvals.policies.detail.routingLabel", undefined, "Routing kind")}
              </label>
              <select name="routing_kind" required className="ps-input mt-1.5 w-full" defaultValue="sequential">
                {ROUTING_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`console.governance.approvals.routing.${k}`, undefined, ROUTING_LABEL[k])}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("console.governance.approvals.policies.detail.thresholdLabel", undefined, "Threshold")}
              name="threshold"
              type="number"
              min="0"
              step="1"
              hint={t(
                "console.governance.approvals.policies.detail.thresholdHint",
                undefined,
                "Optional. Approvals required for the threshold routing kind.",
              )}
            />
            <Input
              label={t("console.governance.approvals.policies.detail.slaLabel", undefined, "SLA hours")}
              name="sla_hours"
              type="number"
              min="0"
              step="1"
              hint={t(
                "console.governance.approvals.policies.detail.slaHint",
                undefined,
                "Optional. Hours before this step escalates.",
              )}
            />
          </FormShell>
        </section>
      </div>
    </>
  );
}
