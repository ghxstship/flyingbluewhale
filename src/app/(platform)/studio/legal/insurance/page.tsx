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
  const rows = await listOrgScoped("insurance_policies", session.orgId, {
    orderBy: "created_at",
    ascending: false,
    limit: 500,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legal.insurance.eyebrow", undefined, "Legal")}
        title={t("console.legal.insurance.title", undefined, "Insurance Policies")}
        subtitle={
          rows.length === 1
            ? t("console.legal.insurance.subtitleOne", { count: rows.length }, `${rows.length} Record`)
            : t("console.legal.insurance.subtitleOther", { count: rows.length }, `${rows.length} Records`)
        }
        action={
          <Button href="/studio/legal/insurance/new" size="sm">
            {t("console.legal.insurance.newPolicy", undefined, "+ New Policy")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable
          rows={rows as Array<{ id: string } & Record<string, unknown>>}
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
      </div>
    </>
  );
}
