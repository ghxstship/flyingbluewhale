import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { PagerNav } from "@/components/ui/PagerNav";
import { requireSession } from "@/lib/auth";
import { listOrgScopedPage } from "@/lib/db/resource";
import { parsePage } from "@/lib/db/pagination";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legal.insurance.eyebrowFallback", undefined, "Workspace")}
          title={t("console.legal.insurance.title", undefined, "Insurance Policies")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.legal.insurance.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const sp = await searchParams;
  const { page, offset, pageSize } = parsePage(sp);
  const result = await listOrgScopedPage("insurance_policies", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    pageSize,
    cursor: String(offset),
  });
  const rows = result.rows;
  const total = result.totalCount;
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.insurance.eyebrow", undefined, "Legal")}
        title={t("console.legal.insurance.title", undefined, "Insurance Policies")}
        subtitle={
          total === 1
            ? t("console.legal.insurance.subtitleOne", { count: total }, `${total} Record`)
            : t("console.legal.insurance.subtitleOther", { count: total }, `${total} Records`)
        }
        action={
          <Button href="/studio/legal/insurance/new" size="sm">
            {t("console.legal.insurance.newPolicy", undefined, "+ New Policy")}
          </Button>
        }
      />
      <div className="page-content space-y-3">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
          totalCount={total}
          rowHref={(r) => `/studio/legal/insurance/${r.id}`}
          emptyLabel={t("console.legal.insurance.emptyLabel", undefined, "No insurance policies")}
          emptyDescription={t(
            "console.legal.insurance.emptyDescription",
            undefined,
            "Track GL, motor, professional indemnity, and event-cancel cover. Renewal alerts attach to expiring policies.",
          )}
          emptyAction={
            <Button href="/studio/legal/insurance/new" size="sm">
              {t("console.legal.insurance.newPolicy", undefined, "+ New Policy")}
            </Button>
          }
          columns={[
            {
              key: "carrier",
              header: t("console.legal.insurance.columns.carrier", undefined, "Carrier"),
              render: (r) => String(r.carrier ?? "—"),
              accessor: (r) => r.carrier ?? null,
            },
            {
              key: "policy_no",
              header: t("console.legal.insurance.columns.policyNo", undefined, "Policy No."),
              render: (r) => <span className="font-mono text-xs">{String(r.policy_no ?? "—")}</span>,
              accessor: (r) => r.policy_no ?? null,
            },
            {
              key: "kind",
              header: t("console.legal.insurance.columns.kind", undefined, "Kind"),
              render: (r) => String(r.kind ?? "—"),
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "effective_on",
              header: t("console.legal.insurance.columns.effective", undefined, "Effective"),
              render: (r) => <span className="font-mono text-xs">{String(r.effective_on ?? "—")}</span>,
              accessor: (r) => r.effective_on ?? null,
            },
            {
              key: "expires_on",
              header: t("console.legal.insurance.columns.expires", undefined, "Expires"),
              render: (r) => <span className="font-mono text-xs">{String(r.expires_on ?? "—")}</span>,
              accessor: (r) => r.expires_on ?? null,
            },
          ]}
        />
        <PagerNav
          page={page}
          total={total}
          pageSize={pageSize}
          basePath="/studio/legal/insurance"
          searchParams={sp}
        />
      </div>
    </>
  );
}
