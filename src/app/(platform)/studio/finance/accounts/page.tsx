import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Account = {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  normal_balance: string;
  is_postable: boolean;
  active: boolean;
};

export default async function FinanceAccountsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
          title={t("console.finance.accounts.title", undefined, "Chart of Accounts")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.accounts.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("chart_of_accounts", session.orgId, {
    orderBy: "account_code",
    ascending: true,
    limit: 1000,
  })) as Account[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.eyebrow", undefined, "Finance")}
        title={t("console.finance.accounts.title", undefined, "Chart of Accounts")}
        subtitle={t(
          "console.finance.accounts.subtitle",
          { count: rows.length },
          `${rows.length} accounts · the postable + summary GL structure`,
        )}
        action={
          <Button href="/studio/finance/accounts/new" size="sm">
            {t("console.finance.accounts.newCta", undefined, "+ New account")}
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.finance.accounts.empty.label", undefined, "No accounts yet")}
            description={t(
              "console.finance.accounts.empty.description",
              undefined,
              "Build the chart of accounts (assets, liabilities, equity, revenue, expense) so journal entries can post against a canonical structure.",
            )}
            action={
              <Button href="/studio/finance/accounts/new" size="sm">
                {t("console.finance.accounts.newCta", undefined, "+ New account")}
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-hidden">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--p-border)] text-left text-xs text-[var(--p-text-2)]">
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.accounts.cols.code", undefined, "Code")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.accounts.cols.name", undefined, "Name")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.accounts.cols.type", undefined, "Type")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.accounts.cols.normal", undefined, "Normal balance")}
                  </th>
                  <th className="px-4 py-2.5 font-medium">
                    {t("console.finance.accounts.cols.flags", undefined, "Flags")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--p-border)] last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.account_code}</td>
                    <td className="px-4 py-2.5">{r.account_name}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="muted">{r.account_type}</Badge>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">{r.normal_balance}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {r.is_postable ? (
                          <Badge variant="default">
                            {t("console.finance.accounts.postable", undefined, "Postable")}
                          </Badge>
                        ) : (
                          <Badge variant="muted">
                            {t("console.finance.accounts.summary", undefined, "Summary")}
                          </Badge>
                        )}
                        {r.active ? (
                          <Badge variant="success">
                            {t("console.finance.accounts.active", undefined, "Active")}
                          </Badge>
                        ) : (
                          <Badge variant="muted">
                            {t("console.finance.accounts.inactive", undefined, "Inactive")}
                          </Badge>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
