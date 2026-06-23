import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.transport.ad.eyebrowWorkspace", undefined, "Workspace")}
          title={t("console.transport.ad.title", undefined, "A&D Manifests")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.transport.ad.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("ad_manifests", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.transport.ad.eyebrow", undefined, "Transport")}
        title={t("console.transport.ad.title", undefined, "A&D Manifests")}
        subtitle={
          rows.length === 1
            ? t("console.transport.ad.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.transport.ad.subtitleMany", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/transport/ad/new" size="sm">
            {t("console.transport.ad.newManifest", undefined, "+ New Manifest")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/transport/ad/${r.id}`}
          emptyLabel={t("console.transport.ad.emptyLabel", undefined, "No A&D manifests yet")}
          emptyDescription={t(
            "console.transport.ad.emptyDescription",
            undefined,
            "Track every athlete and Olympic-family arrival or departure — flight ref, carrier, party size.",
          )}
          emptyAction={
            <Button href="/studio/transport/ad/new" size="sm">
              {t("console.transport.ad.newManifest", undefined, "+ New Manifest")}
            </Button>
          }
          columns={[
            {
              key: "kind",
              header: t("console.transport.ad.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "flight_ref",
              header: t("console.transport.ad.columns.flight", undefined, "Flight"),
              render: (r) => <span className="font-mono text-xs">{String(r.flight_ref ?? "—")}</span>,
              accessor: (r) => r.flight_ref ?? null,
            },
            {
              key: "carrier",
              header: t("console.transport.ad.columns.carrier", undefined, "Carrier"),
              render: (r) => String(r.carrier ?? "—"),
              accessor: (r) => r.carrier ?? null,
            },
            {
              key: "scheduled_at",
              header: t("console.transport.ad.columns.scheduled", undefined, "Scheduled"),
              render: (r) => <span className="font-mono text-xs">{String(r.scheduled_at ?? "—")}</span>,
              accessor: (r) => r.scheduled_at ?? null,
            },
            {
              key: "status",
              header: t("console.transport.ad.columns.status", undefined, "Status"),
              render: (r) => String(r.status ?? "—"),
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
