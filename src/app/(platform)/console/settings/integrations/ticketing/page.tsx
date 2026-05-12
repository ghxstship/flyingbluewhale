import { formatDateTime } from "@/lib/i18n/format";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  provider: string;
  external_event_id: string | null;
  label: string | null;
  is_active: boolean;
  last_synced_at: string | null;
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Ticketing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticketing_connections")
    .select("id, provider, external_event_id, label, is_active, last_synced_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false })
    .limit(200);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Settings · Integrations"
        title="Ticketing"
        subtitle="Etix · DICE · Tixr · Eventbrite · SeeTickets · AXS"
        action={
          <Button href="/console/settings/integrations/ticketing/new" size="sm">
            + Connect
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/integrations/ticketing/${r.id}`}
          emptyLabel="No ticketing connections"
          emptyDescription="Connect a provider to feed live sales velocity into your deals + settlements."
          emptyAction={
            <Button href="/console/settings/integrations/ticketing/new" size="sm">
              + Connect
            </Button>
          }
          columns={[
            {
              key: "provider",
              header: "Provider",
              render: (r) => <Badge variant="muted">{r.provider}</Badge>,
              accessor: (r) => r.provider,
              filterable: true,
            },
            { key: "label", header: "Label", render: (r) => r.label ?? "—", accessor: (r) => r.label ?? null },
            {
              key: "evt",
              header: "Event ID",
              render: (r) =>
                r.external_event_id ? <span className="font-mono text-xs">{r.external_event_id}</span> : "—",
              accessor: (r) => r.external_event_id ?? null,
            },
            {
              key: "sync",
              header: "Last Sync",
              render: (r) => (r.last_synced_at ? formatDateTime(r.last_synced_at) : "—"),
              accessor: (r) => r.last_synced_at,
              className: "font-mono text-xs",
            },
            {
              key: "active",
              header: "Active",
              render: (r) => (
                <Badge variant={r.is_active ? "success" : "muted"}>{r.is_active ? "active" : "off"}</Badge>
              ),
              accessor: (r) => (r.is_active ? 1 : 0),
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
