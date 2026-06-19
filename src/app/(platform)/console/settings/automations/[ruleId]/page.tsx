import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

function fmtTrigger(event: string) {
  return event
    .split(".")
    .map((s) => s.replace(/_/g, " "))
    .join(" → ");
}

export default async function AutomationDetailPage({ params }: { params: Promise<{ ruleId: string }> }) {
  const { ruleId } = await params;
  const { t } = await getRequestT();

  if (!hasSupabase) notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const { data: rule } = await supabase
    .from("automation_rules")
    .select("id, name, description, trigger_event, trigger_conditions, actions, is_active, run_count, last_run_at, created_at, updated_at")
    .eq("id", ruleId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!rule) notFound();

  const typedRule = rule as {
    id: string;
    name: string;
    description: string | null;
    trigger_event: string;
    trigger_conditions: Record<string, unknown>;
    actions: unknown[];
    is_active: boolean;
    run_count: number;
    last_run_at: string | null;
    created_at: string;
    updated_at: string;
  };

  return (
    <>
      <ModuleHeader
        eyebrow="Settings · Automations"
        title={typedRule.name}
        subtitle={typedRule.description ?? undefined}
        action={
          <Link href="/console/settings/automations" className="ps-btn ps-btn--ghost ps-btn--sm">
            ← Automations
          </Link>
        }
      />
      <div className="page-content max-w-2xl space-y-6">
        {/* Status strip */}
        <div className="surface flex flex-wrap items-center gap-4 p-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-[var(--p-text-2)]">Status</span>
            {typedRule.is_active ? (
              <Badge variant="success">Active</Badge>
            ) : (
              <Badge variant="muted">Inactive</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--p-text-2)]">Trigger</span>
            <code className="rounded bg-[var(--p-surface-2)] px-1.5 py-0.5 text-xs">{typedRule.trigger_event}</code>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[var(--p-text-2)]">Runs</span>
            <span className="font-mono">{typedRule.run_count}</span>
          </div>
          {typedRule.last_run_at && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--p-text-2)]">Last run</span>
              <span className="font-mono text-xs">{new Date(typedRule.last_run_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Trigger detail */}
        <section>
          <h2 className="ps-h mb-2 text-xs uppercase tracking-widest text-[var(--p-text-2)]">Trigger</h2>
          <div className="surface-raised p-4">
            <div className="text-sm font-medium">{fmtTrigger(typedRule.trigger_event)}</div>
            {Object.keys(typedRule.trigger_conditions).length > 0 && (
              <pre className="mt-3 overflow-auto rounded bg-[var(--p-surface)] p-3 font-mono text-xs">
                {JSON.stringify(typedRule.trigger_conditions, null, 2)}
              </pre>
            )}
          </div>
        </section>

        {/* Actions */}
        <section>
          <h2 className="ps-h mb-2 text-xs uppercase tracking-widest text-[var(--p-text-2)]">
            Actions ({typedRule.actions.length})
          </h2>
          <div className="surface-raised p-4">
            {typedRule.actions.length === 0 ? (
              <p className="text-sm text-[var(--p-text-2)]">
                No actions configured. Actions can be added via the API or by editing the rule.
              </p>
            ) : (
              <pre className="overflow-auto font-mono text-xs">
                {JSON.stringify(typedRule.actions, null, 2)}
              </pre>
            )}
          </div>
        </section>

        {/* Meta */}
        <div className="surface p-4 text-xs text-[var(--p-text-2)]">
          <div className="flex gap-6">
            <span>Created {new Date(typedRule.created_at).toLocaleDateString()}</span>
            <span>Updated {new Date(typedRule.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </>
  );
}
