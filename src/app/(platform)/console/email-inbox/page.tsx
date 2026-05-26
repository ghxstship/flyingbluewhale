import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  received_at: string;
  processed_at: string | null;
  routed_to: string | null;
  routed_id: string | null;
  thread_id: string | null;
  project: { name: string | null } | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Project Correspondence" title="Email Inbox" />
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
    .from("inbound_email_messages")
    .select(
      "id, from_email, from_name, subject, received_at, processed_at, routed_to, routed_id, thread_id, project:project_id(name)",
    )
    .eq("org_id", session.orgId)
    .order("received_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const unroutedCount = rows.filter((r) => !r.routed_to).length;
  const routedCount = rows.filter((r) => r.routed_to).length;

  return (
    <>
      <ModuleHeader
        eyebrow="Project Correspondence"
        title="Email Inbox"
        subtitle={`${rows.length} message${rows.length === 1 ? "" : "s"} · ${unroutedCount} unrouted · ${routedCount} promoted to records`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Unrouted" value={fmt.number(unroutedCount)} accent />
          <MetricCard label="Promoted" value={fmt.number(routedCount)} />
          <MetricCard label="Total" value={fmt.number(rows.length)} />
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Inbound emails captured at {`{slug}@in.atlvs.pro`}. The router (separate worker) processes incoming messages;
          a human promotes each to an RFI / submittal / transmittal / note. Schema + RLS + admin view are live.
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/email-inbox/${r.id}`}
          emptyLabel="No inbound emails yet"
          emptyDescription="Configure a project_email row to start routing messages to a project."
          columns={[
            {
              key: "received",
              header: "Received",
              render: (r) => fmt.dateParts(r.received_at, { month: "short", day: "numeric", year: "2-digit" }),
              accessor: (r) => r.received_at,
              className: "font-mono text-xs",
            },
            {
              key: "from",
              header: "From",
              render: (r) => `${r.from_name ?? ""} <${r.from_email}>`.trim(),
              accessor: (r) => r.from_email,
              filterable: true,
              groupable: true,
            },
            {
              key: "subject",
              header: "Subject",
              render: (r) => r.subject ?? "(no subject)",
              accessor: (r) => r.subject,
            },
            {
              key: "project",
              header: "Project",
              render: (r) => r.project?.name ?? "—",
              accessor: (r) => r.project?.name ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "routed",
              header: "Routed To",
              render: (r) =>
                r.routed_to ? (
                  <Badge variant="success">{toTitle(r.routed_to)}</Badge>
                ) : (
                  <Badge variant="muted">Unrouted</Badge>
                ),
              accessor: (r) => r.routed_to ?? "unrouted",
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
