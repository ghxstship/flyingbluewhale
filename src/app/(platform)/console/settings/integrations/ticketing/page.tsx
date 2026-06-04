import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.settings.integrations.ticketing.eyebrowShort", undefined, "Settings")}
          title={t("console.settings.integrations.ticketing.title", undefined, "Ticketing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.settings.integrations.ticketing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.settings.integrations.ticketing.eyebrow", undefined, "Settings · Integrations")}
        title={t("console.settings.integrations.ticketing.title", undefined, "Ticketing")}
        subtitle={t(
          "console.settings.integrations.ticketing.subtitle",
          undefined,
          "Etix · DICE · Tixr · Eventbrite · SeeTickets · AXS",
        )}
        action={
          <Button href="/console/settings/integrations/ticketing/new" size="sm">
            {t("console.settings.integrations.ticketing.connect", undefined, "+ Connect")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/settings/integrations/ticketing/${r.id}`}
          emptyLabel={t("console.settings.integrations.ticketing.emptyLabel", undefined, "No ticketing connections")}
          emptyDescription={t(
            "console.settings.integrations.ticketing.emptyDescription",
            undefined,
            "Connect a provider to feed live sales velocity into your deals + settlements.",
          )}
          emptyAction={
            <Button href="/console/settings/integrations/ticketing/new" size="sm">
              {t("console.settings.integrations.ticketing.connect", undefined, "+ Connect")}
            </Button>
          }
          columns={[
            {
              key: "provider",
              header: t("console.settings.integrations.ticketing.col.provider", undefined, "Provider"),
              render: (r) => <Badge variant="muted">{toTitle(r.provider)}</Badge>,
              accessor: (r) => r.provider,
              filterable: true,
            },
            {
              key: "label",
              header: t("console.settings.integrations.ticketing.col.label", undefined, "Label"),
              render: (r) => r.label ?? "—",
              accessor: (r) => r.label ?? null,
            },
            {
              key: "evt",
              header: t("console.settings.integrations.ticketing.col.eventId", undefined, "Event ID"),
              render: (r) =>
                r.external_event_id ? <span className="font-mono text-xs">{r.external_event_id}</span> : "—",
              accessor: (r) => r.external_event_id ?? null,
            },
            {
              key: "sync",
              header: t("console.settings.integrations.ticketing.col.lastSync", undefined, "Last Sync"),
              render: (r) => (r.last_synced_at ? new Date(r.last_synced_at).toLocaleString() : "—"),
              accessor: (r) => r.last_synced_at,
              className: "font-mono text-xs",
            },
            {
              key: "active",
              header: t("console.settings.integrations.ticketing.col.active", undefined, "Active"),
              render: (r) => (
                <Badge variant={r.is_active ? "success" : "muted"}>
                  {r.is_active
                    ? t("console.settings.integrations.ticketing.statusActive", undefined, "active")
                    : t("console.settings.integrations.ticketing.statusOff", undefined, "off")}
                </Badge>
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
