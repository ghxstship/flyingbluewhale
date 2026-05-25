import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";
import { AutomationControls } from "./AutomationControls";
import { WebhookSection } from "./WebhookSection";
import { getRequestFormatters } from "@/lib/i18n/request";
import { urlFor } from "@/lib/urls";
import { StepBuilder, type AutomationStep } from "@/components/automations/StepBuilder";
// Side-effect import — registers all built-in actions with the in-memory
// `actionRegistry` so `listActions()` returns the full inventory before this
// server component renders the client builder.
import "@/lib/automations/actions";
import { listActions } from "@/lib/automations/registry";
import { saveStepsAction, saveTriggerAction } from "./actions";
import { formatDateParts } from "@/lib/i18n/format";

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
  return formatDateParts(iso, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function stepCount(steps: Json): number {
  return Array.isArray(steps) ? steps.length : 0;
}

/**
 * Coerce the JSONB `steps` column to the AutomationStep[] shape the builder
 * expects. Defensive: any malformed entry is dropped rather than crashing the
 * page. The runner already tolerates unknown shapes so this is a UX-only filter.
 */
function coerceSteps(raw: Json): AutomationStep[] {
  if (!Array.isArray(raw)) return [];
  const out: AutomationStep[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    if (!s || typeof s !== "object" || Array.isArray(s)) continue;
    const obj = s as Record<string, unknown>;
    const type = typeof obj.type === "string" ? obj.type : "";
    if (!type) continue;
    const id = typeof obj.id === "string" ? obj.id : `step_${i}`;
    const config =
      obj.config && typeof obj.config === "object" && !Array.isArray(obj.config)
        ? (obj.config as Record<string, unknown>)
        : obj.input && typeof obj.input === "object" && !Array.isArray(obj.input)
          ? (obj.input as Record<string, unknown>)
          : {};
    out.push({ id, type, config, condition: obj.condition });
  }
  return out;
}

function coerceTriggerConfig(raw: Json): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
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

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("automations")
    .select(
      "id, name, description, trigger_kind, trigger_config, steps, enabled, last_run_at, last_run_status, created_at, updated_at, webhook_secret",
    )
    .eq("id", automationId)
    .eq("org_id", session.orgId)
    .maybeSingle();

  const automation = data as unknown as (AutomationRow & { webhook_secret: string | null }) | null;
  if (!automation) notFound();

  const steps = stepCount(automation.steps);
  const triggerTone = TRIGGER_TONE[automation.trigger_kind] ?? "muted";

  // Snapshot of the action inventory after the side-effect import has
  // registered every built-in. Server-side, so the registry state is
  // deterministic per request.
  const registeredActions = listActions();
  const initialSteps = coerceSteps(automation.steps);
  const initialTriggerConfig = coerceTriggerConfig(automation.trigger_config);

  // Bind the server actions to the current automation id so the client builder
  // can call them with just (prev, formData). The .bind() returns a fresh
  // server-action reference Next can serialize over the wire.
  const boundSaveSteps = saveStepsAction.bind(null, automation.id);
  const boundSaveTrigger = saveTriggerAction.bind(null, automation.id);

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
          <MetricCard label="Steps" value={fmtIntl.number(steps)} />
          <MetricCard label="Last Run" value={automation.last_run_at ? fmt(automation.last_run_at) : "Never"} />
          <MetricCard
            label="Last Status"
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
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Builder</h3>
            <span className="text-[11px] text-[var(--text-muted)]">Auto-saves on change</span>
          </div>
          <StepBuilder
            automationId={automation.id}
            initialSteps={initialSteps}
            initialTrigger={{ kind: automation.trigger_kind, config: initialTriggerConfig }}
            registeredActions={registeredActions}
            saveStepsAction={boundSaveSteps}
            saveTriggerAction={boundSaveTrigger}
            webhookUrl={
              automation.trigger_kind === "webhook" ? `/api/v1/automations/${automation.id}/webhook` : undefined
            }
          />
        </section>

        {automation.trigger_kind === "webhook" && (
          <WebhookSection
            automationId={automation.id}
            webhookUrl={urlFor("platform", `/api/v1/automations/${automation.id}/webhook`)}
            hasSecret={Boolean(automation.webhook_secret)}
          />
        )}

        {automation.last_run_status && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Last Run</h3>
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
