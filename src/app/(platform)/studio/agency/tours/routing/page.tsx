import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { formatMoney } from "@/lib/i18n/format";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

// Routing is the one lens on the Tours cockpit: every routed date across every
// tour, ordered on the calendar. In this repo a routed date is a `talent_offers`
// row carrying `tour_id` + `tour_leg_index` (a confirmed hold PROMOTES into the
// advancing project with the same tour_id — no re-key). This is a view over the
// canonical Bookings store, never a parallel table.
type Row = {
  id: string;
  performance_date: string | null;
  fee_cents: number | null;
  talent_offer_state: string;
  tour_leg_index: number | null;
  tour: { name: string } | null;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.agency.tours.eyebrow", undefined, "Agency")}
          title={t("console.agency.tours.routing.title", undefined, "Routing")}
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
    .from("talent_offers")
    .select("id, performance_date, fee_cents, talent_offer_state, tour_leg_index, tour:tours(name)")
    .eq("org_id", session.orgId)
    .not("tour_id", "is", null)
    .order("performance_date", { ascending: true, nullsFirst: false })
    .limit(300);
  const rows = (data ?? []) as unknown as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.agency.tours.eyebrow", undefined, "Agency")}
        title={t("console.agency.tours.routing.title", undefined, "Routing")}
        subtitle={t(
          "console.agency.tours.routing.subtitle",
          undefined,
          "Every routed date across the run · hold, offer, confirmed, advancing, settled",
        )}
        action={
          <Button href="/studio/agency/tours" variant="secondary" size="sm">
            {t("console.agency.tours.routing.backToTours", undefined, "All Tours")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel={t("console.agency.tours.routing.empty.label", undefined, "No routed dates yet")}
          emptyDescription={t(
            "console.agency.tours.routing.empty.description",
            undefined,
            "Attach a booking to a tour to route it. Confirmed holds promote into the advancing project with the same tour_id.",
          )}
          columns={[
            {
              key: "leg",
              header: t("console.agency.tours.routing.col.leg", undefined, "Leg"),
              render: (r) => (r.tour_leg_index != null ? `#${r.tour_leg_index + 1}` : "—"),
              accessor: (r) => r.tour_leg_index ?? 0,
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "date",
              header: t("console.agency.tours.routing.col.date", undefined, "Date"),
              render: (r) => r.performance_date ?? "—",
              accessor: (r) => r.performance_date,
              className: "font-mono text-xs",
            },
            {
              key: "tour",
              header: t("console.agency.tours.routing.col.tour", undefined, "Tour"),
              render: (r) => r.tour?.name ?? "—",
              accessor: (r) => r.tour?.name ?? "",
            },
            {
              key: "fee",
              header: t("console.agency.tours.routing.col.fee", undefined, "Fee"),
              render: (r) => (r.fee_cents != null ? formatMoney(r.fee_cents) : "—"),
              accessor: (r) => Number(r.fee_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "state",
              header: t("console.agency.tours.routing.col.state", undefined, "Status"),
              render: (r) => (
                <Badge variant={STATUS_TONE[r.talent_offer_state] ?? "muted"}>{toTitle(r.talent_offer_state)}</Badge>
              ),
              accessor: (r) => r.talent_offer_state,
              filterable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
