import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { DueDateBadge } from "@/components/ui/DueDateBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type TransmittalState = "draft" | "sent" | "acknowledged" | "closed" | "voided";

type Row = {
  id: string;
  code: string;
  subject: string;
  transmittal_state: TransmittalState;
  due_at: string | null;
  sent_at: string | null;
  closed_at: string | null;
  created_at: string;
  project: { name: string | null } | null;
};

const STATE_TONE: Record<TransmittalState, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  sent: "info",
  acknowledged: "success",
  closed: "muted",
  voided: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Operations" title="Transmittals" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("transmittals")
    .select("id, code, subject, transmittal_state, due_at, sent_at, closed_at, created_at, project:project_id(name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const sentCount = rows.filter((r) => r.transmittal_state === "sent").length;
  const acknowledgedCount = rows.filter((r) => r.transmittal_state === "acknowledged").length;
  const draftCount = rows.filter((r) => r.transmittal_state === "draft").length;

  function fmtDate(d: string | null): string {
    if (!d) return "—";
    return fmt.dateParts(d, { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Transmittals"
        subtitle={`${rows.length} Total · ${sentCount} Outstanding · ${acknowledgedCount} Acknowledged · ${draftCount} Draft`}
        action={
          <Button href="/console/transmittals/new" size="sm">
            + New Transmittal
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-4">
          <MetricCard label="Total" value={fmt.number(rows.length)} accent />
          <MetricCard label="Sent / Outstanding" value={fmt.number(sentCount)} />
          <MetricCard label="Acknowledged" value={fmt.number(acknowledgedCount)} />
          <MetricCard label="Draft" value={fmt.number(draftCount)} />
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/transmittals/${r.id}`}
          emptyLabel="No transmittals yet"
          emptyDescription="Transmittals are the audit-grade envelope for project correspondence. Bundle drawings, specs, RFIs, or files and dispatch with read-receipt tracking."
          emptyAction={
            <Button href="/console/transmittals/new" size="sm">
              + New Transmittal
            </Button>
          }
          columns={[
            {
              key: "code",
              header: "Code",
              render: (r) => r.code,
              accessor: (r) => r.code,
              className: "font-mono text-xs",
            },
            { key: "subject", header: "Subject", render: (r) => r.subject, accessor: (r) => r.subject },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "sent",
              header: "Sent",
              render: (r) => fmtDate(r.sent_at),
              accessor: (r) => r.sent_at ?? null,
              className: "font-mono text-xs",
            },
            {
              key: "due",
              header: "Due",
              render: (r) => (
                <span className="inline-flex items-center gap-2">
                  {fmtDate(r.due_at)}
                  <DueDateBadge
                    dueAt={r.due_at}
                    closedAt={r.closed_at}
                    status={
                      r.transmittal_state === "acknowledged" || r.transmittal_state === "closed" ? "complete" : "open"
                    }
                    iconOnly
                    size="sm"
                  />
                </span>
              ),
              accessor: (r) => r.due_at ?? null,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.transmittal_state]}>{toTitle(r.transmittal_state)}</Badge>,
              accessor: (r) => r.transmittal_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
