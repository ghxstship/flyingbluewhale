import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { DAY_SHEET_STATE_LABELS, DAY_SHEET_STATE_TONE, type DaySheetState } from "@/lib/db/day-sheets";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  city: string | null;
  venue: string | null;
  sheet_date: string | null;
  doors: string | null;
  curfew: string | null;
  sheet_state: DaySheetState;
  tour: { name: string } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.daySheets.eyebrow", undefined, "Operations")}
          title={t("console.daySheets.title", undefined, "Day Sheets")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.common.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("day_sheets")
    .select("id, city, venue, sheet_date, doors, curfew, sheet_state, tour:tours(name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("sheet_date", { ascending: true, nullsFirst: false })
    .limit(200);
  const rows = (data ?? []) as unknown as Row[];

  const published = rows.filter((r) => r.sheet_state === "published" || r.sheet_state === "updated").length;
  const draft = rows.filter((r) => r.sheet_state === "draft").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.daySheets.eyebrow", undefined, "Operations")}
        title={t("console.daySheets.title", undefined, "Day Sheets")}
        subtitle={t(
          "console.daySheets.subtitle",
          undefined,
          "One composed page per date · crew call, doors, set, curfew. Publishes to the field",
        )}
        action={
          <Button href="/studio/operations/day-sheets/new" size="sm">
            {t("console.daySheets.new", undefined, "+ New Day Sheet")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("console.daySheets.metric.total", undefined, "Day Sheets")} value={String(rows.length)} accent />
          <MetricCard label={t("console.daySheets.metric.published", undefined, "Published")} value={String(published)} />
          <MetricCard label={t("console.daySheets.metric.draft", undefined, "In Draft")} value={String(draft)} />
        </div>

        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/operations/day-sheets/${r.id}`}
          emptyLabel={t("console.daySheets.empty.label", undefined, "No day sheets yet")}
          emptyDescription={t(
            "console.daySheets.empty.description",
            undefined,
            "A day sheet composes the schedule, travel, venue and personnel for one tour date into a single page the crew can carry.",
          )}
          emptyAction={
            <Button href="/studio/operations/day-sheets/new" size="sm">
              {t("console.daySheets.new", undefined, "+ New Day Sheet")}
            </Button>
          }
          columns={[
            {
              key: "date",
              header: t("console.daySheets.col.date", undefined, "Date"),
              render: (r) => r.sheet_date ?? "—",
              accessor: (r) => r.sheet_date,
              className: "font-mono text-xs",
            },
            {
              key: "city",
              header: t("console.daySheets.col.city", undefined, "City"),
              render: (r) => r.city ?? "—",
              accessor: (r) => r.city,
            },
            {
              key: "venue",
              header: t("console.daySheets.col.venue", undefined, "Venue"),
              render: (r) => r.venue ?? "—",
              accessor: (r) => r.venue,
            },
            {
              key: "tour",
              header: t("console.daySheets.col.tour", undefined, "Tour"),
              render: (r) => r.tour?.name ?? "—",
              accessor: (r) => r.tour?.name ?? "",
            },
            {
              key: "doors",
              header: t("console.daySheets.col.doors", undefined, "Doors"),
              render: (r) => r.doors ?? "—",
              accessor: (r) => r.doors,
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "state",
              header: t("console.daySheets.col.state", undefined, "Status"),
              render: (r) => (
                <Badge variant={DAY_SHEET_STATE_TONE[r.sheet_state]}>{DAY_SHEET_STATE_LABELS[r.sheet_state]}</Badge>
              ),
              accessor: (r) => r.sheet_state,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
