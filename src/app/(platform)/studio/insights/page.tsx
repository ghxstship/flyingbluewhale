import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { LineChart, AreaChart } from "@/components/charts/LineChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";

export const dynamic = "force-dynamic";

type Row = {
  id: string; // synthetic — pool view has no PK; build one for DataView<Row>
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
        <ConfigureSupabase />
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

        {(() => {
          // Roll the pool aggregates into the kit charts (Phase 2 viz). Months
          // come back newest-first; chronological for the trend lines.
          const byMonth = new Map<string, { gross: number; att: number; n: number }>();
          const byGenre = new Map<string, number>();
          for (const r of rows) {
            const m = byMonth.get(r.month) ?? { gross: 0, att: 0, n: 0 };
            m.gross += Number(r.avg_gross_cents) || 0;
            m.att += Number(r.avg_attendance) || 0;
            m.n += 1;
            byMonth.set(r.month, m);
            byGenre.set(r.genre, (byGenre.get(r.genre) ?? 0) + (Number(r.show_count) || 0));
          }
          const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
          const grossSeries = months.map(([month, v]) => ({ label: month.slice(5), value: Math.round(v.gross / Math.max(1, v.n) / 100) }));
          const attSeries = months.map(([month, v]) => ({ label: month.slice(5), value: Math.round(v.att / Math.max(1, v.n)) }));
          const genreSlices = [...byGenre.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([genre, n]) => ({ label: toTitle(genre), value: n }));
          if (!rows.length) return null;
          return (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="surface p-4">
                <p className="mb-2 font-mono text-xs tracking-wide text-[var(--p-text-3)] uppercase">Avg gross / month ($)</p>
                <LineChart data={grossSeries} height={160} />
              </div>
              <div className="surface p-4">
                <p className="mb-2 font-mono text-xs tracking-wide text-[var(--p-text-3)] uppercase">Avg attendance / month</p>
                <AreaChart data={attSeries} height={160} />
              </div>
              <div className="surface p-4">
                <p className="mb-2 font-mono text-xs tracking-wide text-[var(--p-text-3)] uppercase">Shows by genre</p>
                <DonutChart data={genreSlices} size={150} />
              </div>
            </div>
          );
        })()}

        <DataView<Row>
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
              mono: true,
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
              tabular: true,
            },
            {
              key: "gross",
              header: t("console.insights.columns.avgGross", undefined, "Avg Gross"),
              render: (r) => formatMoney(r.avg_gross_cents),
              accessor: (r) => Number(r.avg_gross_cents),
              tabular: true,
            },
            {
              key: "att",
              header: t("console.insights.columns.avgAttendance", undefined, "Avg Attendance"),
              render: (r) => r.avg_attendance,
              accessor: (r) => Number(r.avg_attendance),
              tabular: true,
            },
            {
              key: "artist",
              header: t("console.insights.columns.avgArtistPayout", undefined, "Avg Artist Payout"),
              render: (r) => formatMoney(r.avg_artist_payout_cents),
              accessor: (r) => Number(r.avg_artist_payout_cents),
              tabular: true,
            },
          ]}
        />
      </div>
    </>
  );
}
