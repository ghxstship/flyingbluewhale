import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataView } from "@/components/views/DataViewServer";
import { MONO_CELL_CLASS } from "@/components/views/data-view-model";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { DELEGATION_SCOPE_LABEL, type DelegationScope } from "@/lib/approvals/queries";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  delegator_party_id: string;
  delegatee_party_id: string;
  scope: string;
  scope_ref: string | null;
  starts_at: string;
  ends_at: string | null;
  active: boolean;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="page-content">
        {t("console.governance.approvals.delegations.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("approval_delegations")
    .select("id, delegator_party_id, delegatee_party_id, scope, scope_ref, starts_at, ends_at, active")
    .eq("org_id", session.orgId)
    .order("starts_at", { ascending: false })
    .limit(500);
  const rows = (data ?? []) as Row[];

  // *_party_id columns hold parties.id — resolve display names.
  const partyIds = [...new Set(rows.flatMap((r) => [r.delegator_party_id, r.delegatee_party_id]))];
  const partyRows =
    partyIds.length === 0
      ? []
      : // soft-delete-exempt: name-resolution for historical rows — a departed
        // member still held the authority the ledger says they held.
        ((await supabase.from("parties").select("id, display_name").eq("org_id", session.orgId).in("id", partyIds))
          .data ?? []);
  const partyName = (pid: string) => partyRows.find((p) => p.id === pid)?.display_name ?? pid.slice(0, 8);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.governance.approvals.delegations.eyebrow", undefined, "Governance")}
        title={t("console.governance.approvals.delegations.title", undefined, "Approval Delegations")}
        subtitle={t(
          "console.governance.approvals.delegations.subtitle",
          { count: rows.length },
          `${rows.length} delegations`,
        )}
        action={
          <Button href="/studio/governance/approvals/delegations/new" size="sm">
            {t("console.governance.approvals.delegations.newLabel", undefined, "+ New delegation")}
          </Button>
        }
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          emptyLabel={t("console.governance.approvals.delegations.emptyLabel", undefined, "No delegations yet")}
          emptyDescription={t(
            "console.governance.approvals.delegations.emptyDescription",
            undefined,
            "Delegate your approval authority to another member for a scope and time window.",
          )}
          columns={[
            {
              key: "delegatee_party_id",
              header: t("console.governance.approvals.delegations.columns.delegatee", undefined, "Delegatee"),
              render: (r) => <span className="text-xs">{partyName(r.delegatee_party_id)}</span>,
            },
            {
              key: "scope",
              header: t("console.governance.approvals.delegations.columns.scope", undefined, "Scope"),
              render: (r) => (
                <span>
                  {DELEGATION_SCOPE_LABEL[r.scope as DelegationScope] ?? r.scope}
                  {r.scope_ref ? (
                    <span className={`ml-1 text-[var(--p-text-2)] ${MONO_CELL_CLASS}`}>{r.scope_ref}</span>
                  ) : null}
                </span>
              ),
            },
            {
              key: "starts_at",
              header: t("console.governance.approvals.delegations.columns.starts", undefined, "Starts"),
              render: (r) => fmt.date(new Date(r.starts_at)),
              mono: true,
            },
            {
              key: "ends_at",
              header: t("console.governance.approvals.delegations.columns.ends", undefined, "Ends"),
              render: (r) => (r.ends_at ? fmt.date(new Date(r.ends_at)) : "—"),
              mono: true,
            },
            {
              key: "active",
              header: t("console.governance.approvals.delegations.columns.status", undefined, "Status"),
              render: (r) =>
                r.active ? (
                  <Badge variant="success">
                    {t("console.governance.approvals.delegations.statusActive", undefined, "Active")}
                  </Badge>
                ) : (
                  <Badge variant="muted">
                    {t("console.governance.approvals.delegations.statusInactive", undefined, "Inactive")}
                  </Badge>
                ),
            },
          ]}
        />
      </div>
    </>
  );
}
