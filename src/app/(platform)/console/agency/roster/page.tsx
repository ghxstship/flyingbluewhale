import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  agency_id: string;
  talent_profile_id: string;
  commission_bps: number | null;
  exclusive: boolean;
  signed_at: string | null;
  ended_at: string | null;
  talent: { act_name: string } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.roster.eyebrow", undefined, "Agency")}
          title={t("console.agency.roster.title", undefined, "Roster")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.agency.roster.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("agency_artists")
    .select(
      "id, agency_id, talent_profile_id, commission_bps, exclusive, signed_at, ended_at, talent:talent_profile_id(act_name)",
    )
    .eq("org_id", session.orgId)
    .is("ended_at", null)
    .order("signed_at", { ascending: false, nullsFirst: false })
    .limit(500);
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.roster.eyebrow", undefined, "Agency")}
        title={t("console.agency.roster.title", undefined, "Roster")}
        subtitle={
          rows.length === 1
            ? t("console.agency.roster.subtitleOne", { count: rows.length }, `${rows.length} Active  artist`)
            : t("console.agency.roster.subtitleOther", { count: rows.length }, `${rows.length} Active  artists`)
        }
      />
      <div className="page-content space-y-5">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/agency/roster/${r.id}`}
          emptyLabel={t("console.agency.roster.emptyLabel", undefined, "No roster yet")}
          emptyDescription={t(
            "console.agency.roster.emptyDescription",
            undefined,
            "Add an active agency_artist row to put a talent_profile on this agency's roster.",
          )}
          columns={[
            {
              key: "act",
              header: t("console.agency.roster.column.act", undefined, "Act"),
              render: (r) => r.talent?.act_name ?? "—",
              accessor: (r) => r.talent?.act_name ?? null,
            },
            {
              key: "comm",
              header: t("console.agency.roster.column.commission", undefined, "Commission"),
              render: (r) =>
                r.commission_bps != null
                  ? `${(r.commission_bps / 100).toFixed(2)}%`
                  : t("console.agency.roster.commissionDefault", undefined, "default"),
              accessor: (r) => Number(r.commission_bps ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "exclusive",
              header: t("console.agency.roster.column.exclusive", undefined, "Exclusive"),
              render: (r) => (
                <Badge variant={r.exclusive ? "success" : "muted"}>
                  {r.exclusive ? t("common.yes", undefined, "yes") : t("common.no", undefined, "no")}
                </Badge>
              ),
              accessor: (r) => (r.exclusive ? 1 : 0),
              filterable: true,
            },
            {
              key: "signed",
              header: t("console.agency.roster.column.signed", undefined, "Signed"),
              render: (r) => r.signed_at ?? "—",
              accessor: (r) => r.signed_at,
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
