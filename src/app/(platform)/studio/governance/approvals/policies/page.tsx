import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  slug: string;
  name: string;
  applies_to: string;
  version: number;
  active: boolean;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.policies.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("approval_policies")
    .select("id, slug, name, applies_to, version, active, created_at")
    .eq("org_id", session.orgId)
    .order("name")
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.policies.eyebrow", undefined, "Governance")}
        title={t("console.governance.approvals.policies.title", undefined, "Approval Policies")}
        subtitle={t(
          "console.governance.approvals.policies.subtitle",
          { count: rows.length },
          `${rows.length} policies`,
        )}
        action={
          <Button href="/studio/governance/approvals/policies/new" size="sm">
            {t("console.governance.approvals.policies.newLabel", undefined, "+ New policy")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/governance/approvals/policies/${r.id}`}
          emptyLabel={t("console.governance.approvals.policies.emptyLabel", undefined, "No policies yet")}
          emptyDescription={t(
            "console.governance.approvals.policies.emptyDescription",
            undefined,
            "Define an approval policy with routed steps so records can flow through review.",
          )}
          columns={[
            {
              key: "name",
              header: t("console.governance.approvals.policies.columns.name", undefined, "Name"),
              render: (r) => r.name,
            },
            {
              key: "slug",
              header: t("console.governance.approvals.policies.columns.slug", undefined, "Slug"),
              render: (r) => r.slug,
              mono: true,
            },
            {
              key: "applies_to",
              header: t("console.governance.approvals.policies.columns.appliesTo", undefined, "Applies to"),
              render: (r) => r.applies_to,
              mono: true,
            },
            {
              key: "version",
              header: t("console.governance.approvals.policies.columns.version", undefined, "Ver"),
              render: (r) => `v${r.version}`,
              mono: true,
            },
            {
              key: "active",
              header: t("console.governance.approvals.policies.columns.status", undefined, "Status"),
              render: (r) =>
                r.active ? (
                  <Badge variant="success">
                    {t("console.governance.approvals.policies.statusActive", undefined, "Active")}
                  </Badge>
                ) : (
                  <Badge variant="muted">
                    {t("console.governance.approvals.policies.statusInactive", undefined, "Inactive")}
                  </Badge>
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
