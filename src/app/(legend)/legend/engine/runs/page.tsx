import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { AccessDenied } from "@/components/ui/AccessDenied";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { RUN_STATE_LABELS, type ComplianceRunSummary } from "@/lib/xmce_engine";
import type { ComplianceRunRow } from "../types";
import { RunEngineButton } from "./RunEngineButton";

export const dynamic = "force-dynamic";

function findingsCount(summary: Record<string, unknown> | null): number {
  const s = summary as Partial<ComplianceRunSummary> | null;
  return typeof s?.findings_total === "number" ? s.findings_total : 0;
}

export default async function RunsPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · XMCE" title="Compliance Runs" />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return <AccessDenied requiredRole="Manager" backHref="/legend" />;
  }
  const db = (await createClient()) as unknown as LooseSupabase;
  const { data } = await db
    .from("compliance_runs")
    .select("id, org_id, scope_kind, scope_ref, run_state, summary, started_at, finished_at, created_at, updated_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as ComplianceRunRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="LEG3ND · XMCE"
        title="Compliance Runs"
        subtitle={rows.length === 1 ? "1 run" : `${rows.length} runs`}
        action={
          <div className="flex items-center gap-2">
            <Button href="/legend/engine/rules" variant="ghost">
              Rules
            </Button>
            <RunEngineButton />
          </div>
        }
      />
      <div className="page-content">
        <DataView<ComplianceRunRow>
          rows={rows}
          rowHref={(r) => `/legend/engine/runs/${r.id}`}
          emptyLabel="No compliance runs yet"
          emptyDescription="Run the engine against your org or a project to produce findings."
          emptyAction={<RunEngineButton />}
          columns={[
            {
              key: "run_state",
              header: "State",
              filterable: true,
              render: (r) => <StatusBadge status={r.run_state} />,
              accessor: (r) => RUN_STATE_LABELS[r.run_state],
            },
            {
              key: "scope",
              header: "Scope",
              filterable: true,
              render: (r) => r.scope_kind,
              accessor: (r) => r.scope_kind,
            },
            {
              key: "findings",
              header: "Findings",
              tabular: true,
              sortable: true,
              render: (r) => findingsCount(r.summary),
              accessor: (r) => findingsCount(r.summary),
            },
            {
              key: "finished",
              header: "Finished",
              render: (r) => (r.finished_at ? timeAgo(r.finished_at) : "—"),
              accessor: (r) => r.finished_at ?? null,
            },
            {
              key: "created",
              header: "Started",
              sortable: true,
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
