import { ShieldCheck } from "lucide-react";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import {
  isFindingOutstanding,
  RUN_STATE_LABELS,
  SEVERITY_LABELS,
  type ComplianceSeverity,
} from "@/lib/xmce_engine";
import type { ComplianceFindingRow, ComplianceRunRow } from "./types";

export const dynamic = "force-dynamic";

export default async function EngineHubPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND" title="Compliance Engine" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const db = (await createClient()) as unknown as LooseSupabase;

  const [{ count: rulesActive }, { count: runsTotal }, { data: findingData }, { data: runData }] =
    await Promise.all([
      db
        .from("compliance_rules")
        .select("id", { count: "exact", head: true })
        .eq("org_id", session.orgId)
        .eq("rule_state", "active")
        .is("deleted_at", null),
      db.from("compliance_runs").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
      db
        .from("compliance_findings")
        .select("id, severity, finding_state")
        .eq("org_id", session.orgId)
        .limit(1000),
      db
        .from("compliance_runs")
        .select("id, org_id, scope_kind, scope_ref, run_state, summary, started_at, finished_at, created_at, updated_at")
        .eq("org_id", session.orgId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const findings = (findingData ?? []) as Pick<ComplianceFindingRow, "id" | "severity" | "finding_state">[];
  const recentRuns = (runData ?? []) as ComplianceRunRow[];
  const outstanding = findings.filter((f) => isFindingOutstanding(f.finding_state));
  const critical = outstanding.filter((f) => f.severity === "critical" || f.severity === "high").length;

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · XMCE"
        title="Compliance Engine"
        subtitle="Author compliance rules, run checks, and triage findings."
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/engine/rules" variant="secondary">
              Rules
            </Button>
            <Button href="/legend/engine/runs">Runs</Button>
          </div>
        }
      />
      <div className="page-content space-y-6">
        <div className="metric-grid">
          <MetricCard label="Active rules" value={rulesActive ?? 0} icon={<ShieldCheck size={16} />} />
          <MetricCard label="Total runs" value={runsTotal ?? 0} />
          <MetricCard label="Outstanding findings" value={outstanding.length} />
          <MetricCard label="High / critical open" value={critical} accent={critical > 0} />
        </div>

        <SeverityBreakdown findings={outstanding} />

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--p-text-1)]">Recent runs</h2>
            <Button href="/legend/engine/runs" variant="ghost" size="sm">
              View all
            </Button>
          </div>
          {recentRuns.length === 0 ? (
            <EmptyState
              title="No runs yet"
              description="Run the compliance engine against your org or a project to produce findings."
              action={<Button href="/legend/engine/runs">Go to runs</Button>}
            />
          ) : (
            <div className="surface divide-y divide-[var(--p-border)]">
              {recentRuns.map((r) => (
                <a
                  key={r.id}
                  href={`/legend/engine/runs/${r.id}`}
                  className="hover-lift flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--p-text-1)]">
                      {RUN_STATE_LABELS[r.run_state]} · {r.scope_kind}
                    </div>
                    <div className="text-xs text-[var(--p-text-2)]">{timeAgo(r.created_at)}</div>
                  </div>
                  <StatusBadge status={r.run_state} />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function SeverityBreakdown({ findings }: { findings: Array<{ severity: ComplianceSeverity }> }) {
  const order: ComplianceSeverity[] = ["critical", "high", "medium", "low", "info"];
  const counts = order.map((sev) => ({ sev, n: findings.filter((f) => f.severity === sev).length }));
  return (
    <section className="surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-[var(--p-text-1)]">Outstanding by severity</h2>
      <div className="flex flex-wrap gap-2">
        {counts.map(({ sev, n }) => (
          <span
            key={sev}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--p-border)] px-3 py-1.5 text-xs"
          >
            <StatusBadge status={sev} />
            <span className="tabular-nums font-medium text-[var(--p-text-1)]">{n}</span>
            <span className="sr-only">{SEVERITY_LABELS[sev]} findings</span>
          </span>
        ))}
      </div>
    </section>
  );
}
