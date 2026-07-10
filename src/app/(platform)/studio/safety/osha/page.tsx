import { Suspense } from "react";
import { ModuleHeader, PageSkeleton } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  occurred_at: string;
  summary: string;
  osha_classification: string;
  osha_recordable: boolean;
  days_away: number;
  days_restricted: number;
  body_part: string | null;
  injury_type: string | null;
  injury_source: string | null;
};

const CLASS_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  none: "muted",
  near_miss: "muted",
  first_aid: "info",
  medical_treatment: "warning",
  restricted_duty: "warning",
  days_away: "error",
  fatality: "error",
};

function fmt(iso: string): string {
  return formatDate(new Date(iso));
}

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const { t } = await getRequestT();
  const year = sp.year ? Number(sp.year) : new Date().getFullYear();

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.osha.eyebrow", undefined, "Safety")}
        title={t("console.safety.osha.title", { year }, `OSHA 300 · ${year}`)}
        subtitle={t("console.safety.osha.subtitle", undefined, "OSHA-recordable incidents per 29 CFR 1904.")}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/studio/safety/osha?year=${year - 1}`} size="sm" variant="ghost">
              ← {year - 1}
            </Button>
            <Button href={`/studio/safety/osha?year=${year + 1}`} size="sm" variant="ghost">
              {year + 1} →
            </Button>
            <Button href={`/api/v1/exports/osha?year=${year}`} size="sm">
              {t("console.safety.osha.exportCsv", undefined, "Export 300/300A/301 (CSV)")}
            </Button>
          </div>
        }
      />
      {/* F-07 — documented heavy-aggregation hot route: stream the log body
          under the instant header instead of blocking on the incidents scan. */}
      <Suspense fallback={<PageSkeleton variant="table" rows={6} />}>
        <OshaBody year={year} />
      </Suspense>
    </>
  );
}

async function OshaBody({ year }: { year: number }) {
  const session = await requireSession();
  const supabase = await createClient();
  const fmtIntl = await getRequestFormatters();
  const { t } = await getRequestT();
  const start = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const end = new Date(`${year + 1}-01-01T00:00:00Z`).toISOString();

  const { data } = await supabase
    .from("incidents")
    .select(
      "id, occurred_at, summary, osha_classification, osha_recordable, days_away, days_restricted, body_part, injury_type, injury_source",
    )
    .eq("org_id", session.orgId)
    .gte("occurred_at", start)
    .lt("occurred_at", end)
    .eq("osha_recordable", true)
    .order("occurred_at", { ascending: true });

  const rows = (data ?? []) as unknown as Row[];
  const totalDaysAway = rows.reduce((s, r) => s + (r.days_away ?? 0), 0);
  const totalDaysRestricted = rows.reduce((s, r) => s + (r.days_restricted ?? 0), 0);
  const fatalities = rows.filter((r) => r.osha_classification === "fatality").length;

  return (
    <>
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.safety.osha.metrics.recordables", undefined, "Recordables")}
            value={fmtIntl.number(rows.length)}
            accent
          />
          <MetricCard
            label={t("console.safety.osha.metrics.daysAway", undefined, "Days Away")}
            value={fmtIntl.number(totalDaysAway)}
          />
          <MetricCard
            label={t("console.safety.osha.metrics.daysRestricted", undefined, "Days Restricted")}
            value={fmtIntl.number(totalDaysRestricted)}
          />
        </div>
        {fatalities > 0 && (
          <div className="surface p-4 ring-2 ring-[var(--p-danger)]">
            <strong>
              {fatalities}{" "}
              {fatalities === 1
                ? t("console.safety.osha.fatalityRecord", undefined, "fatality record")
                : t("console.safety.osha.fatalityRecords", undefined, "fatality records")}
            </strong>{" "}
            · {t("console.safety.osha.fatalityNotice", undefined, "OSHA notification required within 8 hours.")}
          </div>
        )}
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/safety/incidents/${r.id}`}
          emptyLabel={t("console.safety.osha.emptyLabel", { year }, `No recordable incidents for ${year}.`)}
          columns={[
            {
              key: "date",
              header: t("console.safety.osha.columns.date", undefined, "Date"),
              render: (r) => fmt(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            {
              key: "summary",
              header: t("console.safety.osha.columns.description", undefined, "Description"),
              render: (r) => r.summary,
              accessor: (r) => r.summary,
            },
            {
              key: "class",
              header: t("console.safety.osha.columns.classification", undefined, "Classification"),
              render: (r) => (
                <Badge variant={CLASS_TONE[r.osha_classification] ?? "muted"}>{toTitle(r.osha_classification)}</Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.osha_classification ?? null,
            },
            {
              key: "body",
              header: t("console.safety.osha.columns.bodyPart", undefined, "Body Part"),
              render: (r) => r.body_part ?? "—",
              accessor: (r) => r.body_part ?? null,
            },
            {
              key: "type",
              header: t("console.safety.osha.columns.injuryType", undefined, "Injury Type"),
              render: (r) => r.injury_type ?? "—",
              accessor: (r) => r.injury_type ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "away",
              header: t("console.safety.osha.columns.daysAway", undefined, "Days Away"),
              render: (r) => r.days_away.toString(),
              className: "font-mono text-xs",
              accessor: (r) => r.days_away.toString ?? null,
            },
            {
              key: "rest",
              header: t("console.safety.osha.columns.daysRestricted", undefined, "Days Restr."),
              render: (r) => r.days_restricted.toString(),
              className: "font-mono text-xs",
              accessor: (r) => r.days_restricted.toString ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
