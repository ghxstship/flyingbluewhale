import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/DataTable";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { contractKindLabel, formatMinor, type ContractRow } from "@/lib/clm/queries";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legal.contracts.eyebrow", undefined, "Legal")}
          title={t("console.legal.contracts.title", undefined, "Contracts")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.contracts.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("contracts", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows as unknown as ContractRow[];
  const total = result.totalCount;

  const countWord =
    total === 1
      ? t("console.legal.contracts.contractSingular", undefined, "contract")
      : t("console.legal.contracts.contractPlural", undefined, "contracts");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.contracts.eyebrow", undefined, "Legal")}
        title={t("console.legal.contracts.title", undefined, "Contracts")}
        subtitle={t(
          "console.legal.contracts.subtitle",
          { count: total, countWord },
          `${total} ${countWord} · the org's contract lifecycle ledger`,
        )}
        action={
          <Button href="/studio/legal/contracts/new" size="sm">
            {t("console.legal.contracts.newContract", undefined, "+ New contract")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable<ContractRow>
          rows={rows}
          totalCount={total}
          rowHref={(r) => `/studio/legal/contracts/${r.id}`}
          emptyLabel={t("console.legal.contracts.emptyLabel", undefined, "No contracts yet")}
          emptyDescription={t(
            "console.legal.contracts.emptyDescription",
            undefined,
            "Track sponsor deals, vendor SOWs, talent bookings, NDAs, and venue agreements through their full lifecycle.",
          )}
          columns={[
            {
              key: "number",
              header: t("console.legal.contracts.columns.number", undefined, "Number"),
              render: (r) => r.number,
              mono: true,
            },
            {
              key: "title",
              header: t("console.legal.contracts.columns.title", undefined, "Title"),
              render: (r) => r.title,
            },
            {
              key: "kind",
              header: t("console.legal.contracts.columns.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{contractKindLabel(r.kind)}</Badge>,
            },
            {
              key: "state",
              header: t("console.legal.contracts.columns.state", undefined, "State"),
              render: (r) => <StatusBadge status={r.state} />,
            },
            {
              key: "counterparty_name",
              header: t("console.legal.contracts.columns.counterparty", undefined, "Counterparty"),
              render: (r) => r.counterparty_name ?? "—",
            },
            {
              key: "total_value_minor",
              header: t("console.legal.contracts.columns.value", undefined, "Value"),
              render: (r) => formatMinor(r.total_value_minor, r.total_value_currency),
              mono: true,
            },
            {
              key: "end_at",
              header: t("console.legal.contracts.columns.endAt", undefined, "Ends"),
              render: (r) => (r.end_at ? fmt.date(new Date(r.end_at)) : "—"),
              mono: true,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/legal/contracts"
          searchParams={sp}
        />
      </div>
    </>
  );
}
