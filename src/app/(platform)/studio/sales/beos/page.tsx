import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { getRequestT } from "@/lib/i18n/request";
import type { BeoState } from "@/lib/beos";

export const dynamic = "force-dynamic";

type BeoRow = {
  id: string;
  beo_number: string | null;
  event_name: string;
  event_date: string | null;
  space: string | null;
  headcount: number;
  beo_state: BeoState;
  created_at: string;
};

export default async function BeosPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.sales.beos.title", undefined, "BEOs")} />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  // Exact count alongside the capped window (F-01) — subtitle + truncation
  // indicator stay honest past the 100-row cap.
  const { rows: rawRows, totalCount } = await listOrgScopedWithCount("beos", session.orgId, {
    orderBy: "event_date",
  });
  const rows = rawRows as unknown as BeoRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.sales.beos.eyebrow", undefined, "Sales")}
        title={t("console.sales.beos.title", undefined, "BEOs")}
        subtitle={
          totalCount === 1
            ? t("console.sales.beos.subtitleOne", undefined, "1 Banquet Event Order")
            : t("console.sales.beos.subtitleMany", { count: totalCount }, `${totalCount} Banquet Event Orders`)
        }
        action={<Button href="/studio/sales/beos/new">{t("console.sales.beos.newBeo", undefined, "+ New BEO")}</Button>}
      />
      <div className="page-content">
        <DataView<BeoRow>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/sales/beos/${r.id}`}
          columns={[
            {
              key: "event_name",
              header: t("console.sales.beos.columns.event", undefined, "Event"),
              render: (r) => r.event_name,
              accessor: (r) => r.event_name,
            },
            {
              key: "beo_number",
              header: t("console.sales.beos.columns.beoNumber", undefined, "BEO #"),
              render: (r) => r.beo_number ?? "—",
              accessor: (r) => r.beo_number ?? null,
            },
            {
              key: "event_date",
              header: t("console.sales.beos.columns.date", undefined, "Date"),
              render: (r) => r.event_date ?? "—",
              accessor: (r) => r.event_date ?? null,
            },
            {
              key: "space",
              header: t("console.sales.beos.columns.space", undefined, "Space"),
              render: (r) => r.space ?? "—",
              accessor: (r) => r.space ?? null,
            },
            {
              key: "headcount",
              header: t("console.sales.beos.columns.pax", undefined, "Pax"),
              render: (r) => String(r.headcount),
              accessor: (r) => r.headcount,
            },
            {
              key: "beo_state",
              header: t("console.sales.beos.columns.status", undefined, "Status"),
              render: (r) => <StatusBadge status={r.beo_state} />,
              accessor: (r) => r.beo_state,
            },
            {
              key: "created",
              header: t("console.sales.beos.columns.added", undefined, "Added"),
              render: (r) => timeAgo(r.created_at),
              accessor: (r) => r.created_at,
            },
          ]}
        />
      </div>
    </>
  );
}
