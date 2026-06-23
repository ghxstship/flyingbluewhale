import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type BlockRow = {
  id: string;
  name: string;
  property: string;
  city: string | null;
  stakeholder_group: string | null;
  starts_on: string | null;
  ends_on: string | null;
  rooms_reserved: number;
  rooms_confirmed: number;
};

const WORKFORCE_GROUPS = ["paid_staff", "contractor", "volunteer", "crew", "workforce"];

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.housing.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.housing.title", undefined, "Housing")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.housing.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const all = (await listOrgScoped("accommodation_blocks", session.orgId, {
    orderBy: "starts_on",
    ascending: true,
    limit: 500,
  })) as BlockRow[];

  // Workforce-relevant blocks: stakeholder group matches a workforce category,
  // or no stakeholder group (default = workforce). VIP/talent/sponsor blocks
  // intentionally excluded — they belong to the VIP / commercial surfaces.
  const rows = all.filter((b) => {
    if (!b.stakeholder_group) return true;
    return WORKFORCE_GROUPS.includes(b.stakeholder_group.toLowerCase());
  });

  const totalReserved = rows.reduce((s, r) => s + (r.rooms_reserved ?? 0), 0);
  const totalConfirmed = rows.reduce((s, r) => s + (r.rooms_confirmed ?? 0), 0);

  const blockLabel =
    rows.length === 1
      ? t("console.workforce.housing.blockSingular", undefined, "Block")
      : t("console.workforce.housing.blockPlural", undefined, "Blocks");
  const roomLabel =
    totalReserved === 1
      ? t("console.workforce.housing.roomSingular", undefined, "Room")
      : t("console.workforce.housing.roomPlural", undefined, "Rooms");
  const subtitle = t(
    "console.workforce.housing.subtitle",
    {
      blocks: rows.length,
      blockLabel,
      confirmed: totalConfirmed,
      reserved: totalReserved,
      roomLabel,
    },
    `${rows.length} ${blockLabel} · ${totalConfirmed} of ${totalReserved} ${roomLabel} Confirmed`,
  );

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.housing.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.housing.title", undefined, "Housing")}
        subtitle={subtitle}
        action={
          <Button href="/studio/accommodation/blocks/new" size="sm">
            {t("console.workforce.housing.newBlock", undefined, "+ New Block")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<BlockRow>
          rows={rows}
          rowHref={(r) => `/studio/accommodation/blocks/${r.id}`}
          emptyLabel={t("console.workforce.housing.emptyLabel", undefined, "No workforce housing booked")}
          emptyDescription={t(
            "console.workforce.housing.emptyDescription",
            undefined,
            "Group blocks with stakeholder_group set to a workforce category surface here. VIP and talent blocks live on their own surfaces.",
          )}
          emptyAction={
            <Button href="/studio/accommodation/blocks/new" size="sm">
              {t("console.workforce.housing.newBlock", undefined, "+ New Block")}
            </Button>
          }
          columns={[
            {
              key: "name",
              header: t("console.workforce.housing.columns.block", undefined, "Block"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "property",
              header: t("console.workforce.housing.columns.property", undefined, "Property"),
              render: (r) => r.property,
              accessor: (r) => r.property,
            },
            {
              key: "city",
              header: t("console.workforce.housing.columns.city", undefined, "City"),
              render: (r) => r.city ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.city ?? null,
            },
            {
              key: "stakeholder",
              header: t("console.workforce.housing.columns.group", undefined, "Group"),
              render: (r) =>
                r.stakeholder_group ? <Badge variant="muted">{toTitle(r.stakeholder_group)}</Badge> : "—",
              accessor: (r) => r.stakeholder_group ?? null,
            },
            {
              key: "rooms",
              header: t("console.workforce.housing.columns.rooms", undefined, "Rooms"),
              render: (r) => (
                <span className="font-mono text-xs">
                  {r.rooms_confirmed ?? 0} / {r.rooms_reserved ?? 0}
                </span>
              ),
              accessor: (r) => Number(r.rooms_confirmed ?? 0),
            },
            {
              key: "dates",
              header: t("console.workforce.housing.columns.dates", undefined, "Dates"),
              render: (r) => `${r.starts_on ?? "?"} → ${r.ends_on ?? "?"}`,
              className: "font-mono text-xs",
              accessor: (r) => r.starts_on ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
