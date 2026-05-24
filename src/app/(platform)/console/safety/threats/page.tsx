import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Threat } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

const SEVERITY_TONE: Record<Threat["severity"], "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
  critical: "error",
};

const STATUS_TONE: Record<Threat["status"], "muted" | "info" | "success" | "warning"> = {
  draft: "muted",
  active: "info",
  closed: "success",
  superseded: "warning",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Safety" title="Threat Register" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("threats", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  })) as Threat[];

  const active = rows.filter((r) => r.status === "active").length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Safety"
        title="Threat Register"
        subtitle={`${rows.length} entr${rows.length === 1 ? "y" : "ies"} · ${active} Active  · ${critical} critical`}
        action={
          <Button href="/console/safety/threats/new" size="sm">
            + New Threat
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Threat>
          rows={rows}
          emptyLabel="No threats logged"
          emptyDescription="Intel + threat assessments live here. Each entry carries a severity, likelihood, treatment, and classification level so distribution can be scoped."
          emptyAction={
            <Button href="/console/safety/threats/new" size="sm">
              + New Threat
            </Button>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => <span className="font-mono text-xs">{r.code}</span>,
              accessor: (r) => r.code ?? null,
            },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            {
              key: "severity",
              header: "Severity",
              render: (r) => <Badge variant={SEVERITY_TONE[r.severity]}>{toTitle(r.severity)}</Badge>,
              accessor: (r) => r.severity ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "likelihood",
              header: "Likelihood",
              render: (r) => toTitle(r.likelihood),
              accessor: (r) => r.likelihood.replace ?? null,
            },
            { key: "treatment", header: "Treatment", render: (r) => r.treatment, accessor: (r) => r.treatment },
            {
              key: "classification",
              header: "Classification",
              render: (r) => <Badge variant="muted">{r.classification}</Badge>,
              accessor: (r) => r.classification ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
