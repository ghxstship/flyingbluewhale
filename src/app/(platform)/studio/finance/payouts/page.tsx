import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import type { Vendor } from "@/lib/supabase/types";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function PayoutsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.finance.payouts.title", undefined, "Payouts")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.payouts.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  // Exact count alongside the capped window (F-01) — the truncation
  // indicator renders once the org passes the 100-row cap.
  const { rows: vendors, totalCount } = await listOrgScopedWithCount("vendors", session.orgId);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.payouts.eyebrow", undefined, "Finance")}
        title={t("console.finance.payouts.title", undefined, "Payouts")}
        subtitle={t("console.finance.payouts.subtitle", undefined, "Stripe Connect onboarding status per vendor")}
      />
      <div className="page-content">
        <DataTable<Vendor>
          rows={vendors}
          totalCount={totalCount}
          columns={[
            {
              key: "name",
              header: t("console.finance.payouts.columns.vendor", undefined, "Vendor"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "account",
              header: t("console.finance.payouts.columns.connectAccount", undefined, "Connect Account"),
              render: (r) =>
                r.payout_account_id ? (
                  <span className="font-mono text-xs">{r.payout_account_id}</span>
                ) : (
                  <Badge variant="muted">{t("console.finance.payouts.notOnboarded", undefined, "Not Onboarded")}</Badge>
                ),
              accessor: (r) => r.payout_account_id ?? null,
            },
            {
              key: "w9",
              header: t("console.finance.payouts.columns.w9", undefined, "W-9"),
              render: (r) =>
                r.w9_on_file ? (
                  <Badge variant="success">{t("console.finance.payouts.onFile", undefined, "On File")}</Badge>
                ) : (
                  <Badge variant="warning">{t("console.finance.payouts.missing", undefined, "Missing")}</Badge>
                ),
              accessor: (r) => r.w9_on_file ?? null,
            },
            {
              key: "coi",
              header: t("console.finance.payouts.columns.coiExpires", undefined, "COI Expires"),
              render: (r) => r.coi_expires_at ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.coi_expires_at ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
