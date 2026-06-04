import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string; // synthetic — pool view has no PK; build one for DataTable<Row>
  month: string;
  genre: string;
  show_count: number;
  avg_gross_cents: number;
  avg_attendance: number;
  avg_artist_payout_cents: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.insights.eyebrow", undefined, "Insights")}
          title={t("console.insights.title", undefined, "Booking Pool")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.insights.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const orgResp = await supabase.from("orgs").select("insights_opt_in").eq("id", session.orgId).maybeSingle();
  const optedIn = (orgResp.data as { insights_opt_in?: boolean } | null)?.insights_opt_in ?? false;

  const { data } = await supabase
    .from("public_insights_pool")
    .select("*")
    .order("month", { ascending: false })
    .limit(500);
  const rows = ((data ?? []) as Array<Omit<Row, "id">>).map((r) => ({
    ...r,
    id: `${r.month}-${r.genre}`,
  })) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.insights.eyebrow", undefined, "Insights")}
        title={t("console.insights.title", undefined, "Booking Pool")}
        subtitle={t("console.insights.subtitle", undefined, "Anonymized monthly aggregates by genre.")}
        action={
          <Badge variant={optedIn ? "success" : "muted"}>
            {optedIn
              ? t("console.insights.contributing", undefined, "contributing")
              : t("console.insights.notContributing", undefined, "not contributing")}
          </Badge>
        }
      />
      <div className="page-content space-y-5">
        {!optedIn && (
          <div className="surface p-5 text-sm">
            <p>
              {t("console.insights.optInPrefix", undefined, "Your org isn't contributing to the booking pool. Enable")}{" "}
              <code className="font-mono">orgs.insights_opt_in</code>{" "}
              {t(
                "console.insights.optInSuffix",
                undefined,
                "to share anonymized settlement aggregates and unlock cross-network benchmarks.",
              )}
            </p>
          </div>
        )}

        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.insights.emptyLabel", undefined, "No aggregates yet")}
          emptyDescription={t(
            "console.insights.emptyDescription",
            undefined,
            "The pool requires k≥3 final settlements per (month, genre) bucket.",
          )}
          columns={[
            {
              key: "month",
              header: t("console.insights.columns.month", undefined, "Month"),
              render: (r) => r.month,
              accessor: (r) => r.month,
              className: "font-mono text-xs",
            },
            {
              key: "genre",
              header: t("console.insights.columns.genre", undefined, "Genre"),
              render: (r) => <Badge variant="muted">{toTitle(r.genre)}</Badge>,
              accessor: (r) => r.genre,
              filterable: true,
              groupable: true,
            },
            {
              key: "shows",
              header: t("console.insights.columns.shows", undefined, "Shows"),
              render: (r) => r.show_count,
              accessor: (r) => Number(r.show_count),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "gross",
              header: t("console.insights.columns.avgGross", undefined, "Avg Gross"),
              render: (r) => formatMoney(r.avg_gross_cents),
              accessor: (r) => Number(r.avg_gross_cents),
              className: "font-mono text-xs",
            },
            {
              key: "att",
              header: t("console.insights.columns.avgAttendance", undefined, "Avg Attendance"),
              render: (r) => r.avg_attendance,
              accessor: (r) => Number(r.avg_attendance),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "artist",
              header: t("console.insights.columns.avgArtistPayout", undefined, "Avg Artist Payout"),
              render: (r) => formatMoney(r.avg_artist_payout_cents),
              accessor: (r) => Number(r.avg_artist_payout_cents),
              className: "font-mono text-xs",
            },
          ]}
        />
      </div>
    </>
  );
}
