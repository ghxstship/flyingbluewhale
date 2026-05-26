import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
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

type System =
  | "qb_online"
  | "qb_desktop"
  | "sage_300_cre"
  | "sage_100_contractor"
  | "foundation"
  | "viewpoint_vista"
  | "viewpoint_spectrum"
  | "acumatica"
  | "xero";

type ConnState = "pending_auth" | "connected" | "expired" | "revoked" | "error";

type Row = {
  id: string;
  system: System;
  display_name: string;
  tenant_id: string;
  connection_state: ConnState;
  last_sync_at: string | null;
  last_error: string | null;
};

const STATE_TONE: Record<ConnState, "muted" | "info" | "warning" | "success" | "error"> = {
  pending_auth: "warning",
  connected: "success",
  expired: "warning",
  revoked: "muted",
  error: "error",
};

const SYSTEM_LABEL: Record<System, string> = {
  qb_online: "QuickBooks Online",
  qb_desktop: "QuickBooks Desktop",
  sage_300_cre: "Sage 300 CRE",
  sage_100_contractor: "Sage 100 Contractor",
  foundation: "Foundation Software",
  viewpoint_vista: "Viewpoint Vista",
  viewpoint_spectrum: "Viewpoint Spectrum",
  acumatica: "Acumatica",
  xero: "Xero",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Accounting Integrations" />
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
    .from("accounting_connections")
    .select("id, system, display_name, tenant_id, connection_state, last_sync_at, last_error")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as Row[];

  const connectedCount = rows.filter((r) => r.connection_state === "connected").length;
  const errorCount = rows.filter((r) => r.connection_state === "error" || r.connection_state === "expired").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Settings · Integrations"
        title="Accounting"
        subtitle={`${rows.length} connection${rows.length === 1 ? "" : "s"} · ${connectedCount} connected · ${errorCount} needs attention`}
        action={
          <Button href="/console/settings/integrations/accounting/new" size="sm">
            + Connect System
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Connections" value={fmt.number(rows.length)} accent />
          <MetricCard label="Connected" value={fmt.number(connectedCount)} />
          <MetricCard label="Issues" value={fmt.number(errorCount)} />
        </div>
        <div className="text-[10px] text-[var(--text-muted)]">
          Connect QuickBooks Online, Sage 300 CRE / 100 Contractor, Foundation, Viewpoint Vista / Spectrum, Acumatica,
          or Xero. The OAuth + sync worker is a separate service — this surface manages connection rows + field mapping
          rules.
        </div>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/integrations/accounting/${r.id}`}
          emptyLabel="No accounting connections yet"
          emptyDescription="Connect to an external system to two-way-sync vendors, cost codes, invoices, bills, pay-apps, and GL entries."
          emptyAction={
            <Button href="/console/settings/integrations/accounting/new" size="sm">
              + Connect System
            </Button>
          }
          columns={[
            {
              key: "system",
              header: "System",
              render: (r) => SYSTEM_LABEL[r.system],
              accessor: (r) => r.system,
              filterable: true,
              groupable: true,
            },
            {
              key: "display_name",
              header: "Display Name",
              render: (r) => r.display_name,
              accessor: (r) => r.display_name,
            },
            {
              key: "tenant",
              header: "Tenant",
              render: (r) => r.tenant_id,
              accessor: (r) => r.tenant_id,
              className: "font-mono text-xs",
            },
            {
              key: "last_sync",
              header: "Last Sync",
              render: (r) =>
                r.last_sync_at
                  ? fmt.dateParts(r.last_sync_at, { month: "short", day: "numeric", year: "2-digit" })
                  : "—",
              accessor: (r) => r.last_sync_at,
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.connection_state]}>{toTitle(r.connection_state)}</Badge>,
              accessor: (r) => r.connection_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
