import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  subject_table: string;
  subject_id: string;
  state: string;
  initiated_at: string;
  policy: { name: string } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("approval_instances")
    .select("id, subject_table, subject_id, state, initiated_at, policy:approval_policies(name)")
    .eq("org_id", session.orgId)
    .order("initiated_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.eyebrow", undefined, "Governance")}
        title={t("console.governance.approvals.title", undefined, "Approvals")}
        subtitle={t(
          "console.governance.approvals.subtitle",
          { count: rows.length },
          `${rows.length} approval instances`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/governance/approvals/policies" variant="ghost" size="sm">
              {t("console.governance.approvals.policiesLink", undefined, "Policies")}
            </Button>
            <Button href="/studio/governance/approvals/delegations" variant="ghost" size="sm">
              {t("console.governance.approvals.delegationsLink", undefined, "Delegations")}
            </Button>
          </div>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.governance.approvals.emptyTitle", undefined, "No approvals in flight")}
            description={t(
              "console.governance.approvals.emptyDescription",
              undefined,
              "Approval instances are opened when a record enters a routed approval policy. Define a policy to get started.",
            )}
            action={
              <Button href="/studio/governance/approvals/policies" size="sm">
                {t("console.governance.approvals.emptyAction", undefined, "View policies")}
              </Button>
            }
          />
        ) : (
          <DataTable<Row>
            rows={rows}
            rowHref={(r) => `/studio/governance/approvals/${r.id}`}
            emptyLabel={t("console.governance.approvals.emptyTitle", undefined, "No approvals in flight")}
            columns={[
              {
                key: "policy",
                header: t("console.governance.approvals.columns.policy", undefined, "Policy"),
                render: (r) => r.policy?.name ?? "—",
              },
              {
                key: "subject_table",
                header: t("console.governance.approvals.columns.subject", undefined, "Subject"),
                render: (r) => (
                  <span className="font-mono text-xs">
                    {r.subject_table}/{r.subject_id.slice(0, 8)}
                  </span>
                ),
              },
              {
                key: "state",
                header: t("console.governance.approvals.columns.state", undefined, "State"),
                render: (r) => <StatusBadge status={r.state} />,
              },
              {
                key: "initiated_at",
                header: t("console.governance.approvals.columns.initiated", undefined, "Initiated"),
                render: (r) => new Date(r.initiated_at).toLocaleDateString("en-US"),
                mono: true,
              },
            ]}
          />
        )}
      </div>
    </>
  );
}
