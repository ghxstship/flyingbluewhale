import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Insights" title="Booking Pool" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Insights"
        title="Booking Pool"
        subtitle="Anonymized monthly aggregates by genre — opt-in only, k≥3 anonymity floor."
        action={<Badge variant={optedIn ? "success" : "muted"}>{optedIn ? "contributing" : "not contributing"}</Badge>}
      />
      <div className="page-content space-y-5">
        {!optedIn && (
          <div className="surface p-5 text-sm">
            <p>
              Your org isn't contributing to the booking pool. Enable{" "}
              <code className="font-mono">orgs.insights_opt_in</code> to share anonymized settlement aggregates and
              unlock cross-network benchmarks.
            </p>
          </div>
        )}

        <DataTable<Row>
          rows={rows}
          emptyLabel="No aggregates yet"
          emptyDescription="The pool requires k≥3 final settlements per (month, genre) bucket."
          columns={[
            {
              key: "month",
              header: "Month",
              render: (r) => r.month,
              accessor: (r) => r.month,
              className: "font-mono text-xs",
            },
            {
              key: "genre",
              header: "Genre",
              render: (r) => <Badge variant="muted">{r.genre}</Badge>,
              accessor: (r) => r.genre,
              filterable: true,
              groupable: true,
            },
            {
              key: "shows",
              header: "Shows",
              render: (r) => r.show_count,
              accessor: (r) => Number(r.show_count),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "gross",
              header: "Avg Gross",
              render: (r) => formatMoney(r.avg_gross_cents),
              accessor: (r) => Number(r.avg_gross_cents),
              className: "font-mono text-xs",
            },
            {
              key: "att",
              header: "Avg Attendance",
              render: (r) => r.avg_attendance,
              accessor: (r) => Number(r.avg_attendance),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "artist",
              header: "Avg Artist Payout",
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
