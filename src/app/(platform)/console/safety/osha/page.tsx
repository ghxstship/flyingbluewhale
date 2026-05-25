import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { formatDate } from "@/lib/i18n/format";

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
  return formatDate(iso);
}

export default async function Page({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const sp = await searchParams;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const year = sp.year ? Number(sp.year) : new Date().getFullYear();
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
      <ModuleHeader
        eyebrow="Safety"
        title={`OSHA 300 — ${year}`}
        subtitle="OSHA-recordable incidents per 29 CFR 1904."
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/safety/osha?year=${year - 1}`} size="sm" variant="ghost">
              ← {year - 1}
            </Button>
            <Button href={`/console/safety/osha?year=${year + 1}`} size="sm" variant="ghost">
              {year + 1} →
            </Button>
            <Button href={`/api/v1/exports/osha?year=${year}`} size="sm">
              Export 300/300A/301 (CSV)
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Recordables" value={fmtIntl.number(rows.length)} accent />
          <MetricCard label="Days Away" value={fmtIntl.number(totalDaysAway)} />
          <MetricCard label="Days Restricted" value={fmtIntl.number(totalDaysRestricted)} />
        </div>
        {fatalities > 0 && (
          <div className="surface p-4 ring-2 ring-[var(--color-error)]">
            <strong>
              {fatalities} fatality record{fatalities === 1 ? "" : "s"}
            </strong>{" "}
            · OSHA notification required within 8 hours.
          </div>
        )}
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/safety/incidents/${r.id}`}
          emptyLabel={`No recordable incidents for ${year}.`}
          columns={[
            {
              key: "date",
              header: "Date",
              render: (r) => fmt(r.occurred_at),
              className: "font-mono text-xs",
              accessor: (r) => r.occurred_at ?? null,
            },
            { key: "summary", header: "Description", render: (r) => r.summary, accessor: (r) => r.summary },
            {
              key: "class",
              header: "Classification",
              render: (r) => (
                <Badge variant={CLASS_TONE[r.osha_classification] ?? "muted"}>{toTitle(r.osha_classification)}</Badge>
              ),
              filterable: true,
              groupable: true,
              accessor: (r) => r.osha_classification ?? null,
            },
            {
              key: "body",
              header: "Body Part",
              render: (r) => r.body_part ?? "—",
              accessor: (r) => r.body_part ?? null,
            },
            {
              key: "type",
              header: "Injury Type",
              render: (r) => r.injury_type ?? "—",
              accessor: (r) => r.injury_type ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "away",
              header: "Days Away",
              render: (r) => r.days_away.toString(),
              className: "font-mono text-xs",
              accessor: (r) => r.days_away.toString ?? null,
            },
            {
              key: "rest",
              header: "Days Restr.",
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
