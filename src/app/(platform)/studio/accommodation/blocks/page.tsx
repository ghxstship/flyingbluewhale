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
          eyebrow={t("console.accommodation.blocks.eyebrowFallback", undefined, "Workspace")}
          title={t("console.accommodation.blocks.title", undefined, "Group Blocks")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.accommodation.blocks.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const rows = await listOrgScoped("accommodation_blocks", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.accommodation.blocks.eyebrow", undefined, "Accommodation")}
        title={t("console.accommodation.blocks.title", undefined, "Group Blocks")}
        subtitle={
          rows.length === 1
            ? t("console.accommodation.blocks.subtitleOne", { count: rows.length }, `${rows.length} Block`)
            : t("console.accommodation.blocks.subtitleOther", { count: rows.length }, `${rows.length} Blocks`)
        }
        action={
          <Button href="/studio/accommodation/blocks/new" size="sm">
            {t("console.accommodation.blocks.newBlock", undefined, "+ New Block")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          rowHref={(r) => `/studio/accommodation/blocks/${r.id}`}
          emptyLabel={t("console.accommodation.blocks.emptyLabel", undefined, "No room blocks yet")}
          emptyDescription={t(
            "console.accommodation.blocks.emptyDescription",
            undefined,
            "Reserve hotel-room blocks per stakeholder group with start / end dates and confirmation counts.",
          )}
          emptyAction={
            <Button href="/studio/accommodation/blocks/new" size="sm">
              {t("console.accommodation.blocks.newBlock", undefined, "+ New Block")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.accommodation.blocks.columns.name", undefined, "Name"),
              render: (r) => String(r.name ?? "—"),
              accessor: (r) => r.name ?? null,
            },
            {
              key: "property",
              header: t("console.accommodation.blocks.columns.property", undefined, "Property"),
              render: (r) => String(r.property ?? "—"),
              accessor: (r) => r.property ?? null,
            },
            {
              key: "stakeholder_group",
              header: t("console.accommodation.blocks.columns.group", undefined, "Group"),
              render: (r) => String(r.stakeholder_group ?? "—"),
              accessor: (r) => r.stakeholder_group ?? null,
            },
            {
              key: "rooms_reserved",
              header: t("console.accommodation.blocks.columns.reserved", undefined, "Reserved"),
              render: (r) => <span className="font-mono text-xs">{String(r.rooms_reserved ?? "—")}</span>,
              accessor: (r) => r.rooms_reserved ?? null,
            },
            {
              key: "rooms_confirmed",
              header: t("console.accommodation.blocks.columns.confirmed", undefined, "Confirmed"),
              render: (r) => <span className="font-mono text-xs">{String(r.rooms_confirmed ?? "—")}</span>,
              accessor: (r) => r.rooms_confirmed ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
