import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { LISTING_STATE_TONE, formatPayRate, formatShiftWindow } from "@/lib/open-shifts";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  role: string;
  venue: string | null;
  shift_window: string;
  pay_rate: string;
  skills_required: string[];
  max_claims: number;
  claim_count: number;
  listing_state: string;
  created_at: string;
};

export default async function Page() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title={t("console.workforce.openShifts.title", undefined, "Open Shifts")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use this module.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: listings }, { data: claims }] = await Promise.all([
    supabase
      .from("open_shift_listings")
      .select("id, title, role, venue, starts_at, ends_at, pay_rate_cents, currency, skills_required, max_claims, listing_state, created_at")
      .eq("org_id", session.orgId)
      .order("starts_at", { ascending: true })
      .limit(500),
    supabase
      .from("open_shift_claims")
      .select("listing_id, claim_state")
      .eq("org_id", session.orgId),
  ]);

  const raw = (listings ?? []) as Array<{
    id: string; title: string; role: string; venue: string | null;
    starts_at: string; ends_at: string; pay_rate_cents: number | null;
    currency: string; skills_required: string[]; max_claims: number;
    listing_state: string; created_at: string;
  }>;

  const claimsByListing = new Map<string, number>();
  for (const c of (claims ?? []) as Array<{ listing_id: string; claim_state: string }>) {
    if (c.claim_state !== "withdrawn" && c.claim_state !== "declined") {
      claimsByListing.set(c.listing_id, (claimsByListing.get(c.listing_id) ?? 0) + 1);
    }
  }

  const rows: Row[] = raw.map((r) => ({
    id: r.id,
    title: r.title,
    role: r.role,
    venue: r.venue,
    shift_window: formatShiftWindow(r.starts_at, r.ends_at),
    pay_rate: formatPayRate(r.pay_rate_cents, r.currency),
    skills_required: r.skills_required,
    max_claims: r.max_claims,
    claim_count: claimsByListing.get(r.id) ?? 0,
    listing_state: r.listing_state,
    created_at: r.created_at,
  }));

  const open = rows.filter((r) => r.listing_state === "open").length;
  const filled = rows.filter((r) => r.listing_state === "filled").length;
  const totalClaims = rows.reduce((sum, r) => sum + r.claim_count, 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.openShifts.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.openShifts.title", undefined, "Open Shifts")}
        subtitle={t(
          "console.workforce.openShifts.subtitle",
          { open, filled, total: rows.length },
          `${open} Open · ${filled} Filled · ${rows.length} Total`,
        )}
        actions={
          <Button asChild size="sm">
            <Link href="/console/workforce/open-shifts/new">
              {t("console.workforce.openShifts.action.post", undefined, "Post Shift")}
            </Link>
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("console.workforce.openShifts.metric.open", undefined, "Open")} value={String(open)} accent />
          <MetricCard label={t("console.workforce.openShifts.metric.filled", undefined, "Filled")} value={String(filled)} />
          <MetricCard label={t("console.workforce.openShifts.metric.claims", undefined, "Claims")} value={String(totalClaims)} />
        </div>
        <DataTable<Row>
          tableId="workforce.open_shifts"
          rows={rows}
          emptyLabel={t("console.workforce.openShifts.empty.label", undefined, "No open shifts")}
          emptyDescription={t(
            "console.workforce.openShifts.empty.description",
            undefined,
            "Post a shift to let your crew claim it before it goes to the external marketplace.",
          )}
          columns={[
            {
              key: "title",
              header: t("console.workforce.openShifts.column.title", undefined, "Shift"),
              render: (r) => (
                <Link href={`/console/workforce/open-shifts/${r.id}`} className="font-medium hover:underline">
                  {r.title}
                </Link>
              ),
              accessor: (r) => r.title,
              filterable: true,
            },
            {
              key: "role",
              header: t("console.workforce.openShifts.column.role", undefined, "Role"),
              render: (r) => r.role,
              accessor: (r) => r.role,
              filterable: true,
              groupable: true,
            },
            {
              key: "window",
              header: t("console.workforce.openShifts.column.window", undefined, "When"),
              render: (r) => <span className="font-mono text-xs">{r.shift_window}</span>,
              accessor: (r) => r.shift_window,
            },
            {
              key: "venue",
              header: t("console.workforce.openShifts.column.venue", undefined, "Venue"),
              render: (r) => r.venue ?? "—",
              accessor: (r) => r.venue ?? null,
              filterable: true,
            },
            {
              key: "pay",
              header: t("console.workforce.openShifts.column.pay", undefined, "Pay"),
              render: (r) => r.pay_rate,
              accessor: (r) => r.pay_rate,
            },
            {
              key: "claims",
              header: t("console.workforce.openShifts.column.claims", undefined, "Claims"),
              render: (r) => `${r.claim_count} / ${r.max_claims}`,
              accessor: (r) => r.claim_count,
            },
            {
              key: "state",
              header: t("console.workforce.openShifts.column.state", undefined, "State"),
              render: (r) => (
                <Badge variant={LISTING_STATE_TONE[r.listing_state as keyof typeof LISTING_STATE_TONE] ?? "muted"}>
                  {toTitle(r.listing_state)}
                </Badge>
              ),
              accessor: (r) => r.listing_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
