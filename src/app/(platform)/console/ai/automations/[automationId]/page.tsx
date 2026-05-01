import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { AutomationControls } from "./AutomationControls";

export const dynamic = "force-dynamic";

type AutomationRow = {
  id: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  trigger_config: Json;
  steps: Json;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  created_at: string;
  updated_at: string;
};

const TRIGGER_TONE: Record<string, "muted" | "info" | "success"> = {
  manual: "muted",
  schedule: "info",
  webhook: "info",
  event: "success",
};

const RUN_TONE: Record<string, "muted" | "success" | "warning" | "error"> = {
  ok: "success",
  success: "success",
  failed: "error",
  error: "error",
  running: "warning",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stepCount(steps: Json): number {
  return Array.isArray(steps) ? steps.length : 0;
}

export default async function Page({ params }: { params: Promise<{ automationId: string }> }) {
  const { automationId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Automations" title="Automation" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("automations")
    .select(
      "id, name, description, trigger_kind, trigger_config, steps, enabled, last_run_at, last_run_status, created_at, updated_at",
    )
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const automation = data as unknown as AutomationRow | null;
  if (!automation) notFound();

  const steps = stepCount(automation.steps);
  const triggerTone = TRIGGER_TONE[automation.trigger_kind] ?? "muted";

  return (
    <>
      <ModuleHeader
        eyebrow="Automations"
        title={automation.name}
        subtitle={
          <span className="font-mono text-xs">
            {automation.trigger_kind} · updated {fmt(automation.updated_at)}
          </span>
        }
        breadcrumbs={[{ label: "Automations", href: "/console/ai/automations" }, { label: automation.name }]}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={automation.enabled ? "success" : "muted"}>
              {automation.enabled ? "Enabled" : "Disabled"}
            </Badge>
            <Badge variant={triggerTone}>{automation.trigger_kind}</Badge>
          </div>
        }
      />
      <div className="page-content space-y-5">
        {automation.description && <p className="text-sm text-[var(--text-secondary)]">{automation.description}</p>}

        <div className="metric-grid-3">
          <MetricCard label="Steps" value={steps.toLocaleString()} />
          <MetricCard label="Last run" value={automation.last_run_at ? fmt(automation.last_run_at) : "Never"} />
          <MetricCard
            label="Last status"
            value={automation.last_run_status ?? "—"}
            accent={automation.last_run_status === "ok" || automation.last_run_status === "success"}
          />
        </div>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Controls</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Toggle the automation on or off. Manual triggers can be invoked from this page.
          </p>
          <div className="mt-3">
            <AutomationControls
              automationId={automation.id}
              enabled={automation.enabled}
              isManual={automation.trigger_kind === "manual"}
            />
          </div>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Trigger config</h3>
          <pre className="mt-3 max-h-72 overflow-auto rounded bg-[var(--bg-secondary)] p-3 font-mono text-xs">
            {JSON.stringify(automation.trigger_config, null, 2)}
          </pre>
        </section>

        <section className="surface p-4">
          <h3 className="text-sm font-semibold">Steps</h3>
          {steps === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No steps defined. Add steps via the editor (coming via the new-automation flow).
            </p>
          ) : (
            <pre className="mt-3 max-h-96 overflow-auto rounded bg-[var(--bg-secondary)] p-3 font-mono text-xs">
              {JSON.stringify(automation.steps, null, 2)}
            </pre>
          )}
        </section>

        {automation.last_run_status && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Last run</h3>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <Badge variant={RUN_TONE[automation.last_run_status] ?? "muted"}>{automation.last_run_status}</Badge>
              <span className="font-mono text-xs text-[var(--text-muted)]">{fmt(automation.last_run_at)}</span>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
