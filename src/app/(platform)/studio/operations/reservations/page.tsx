import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataView } from "@/components/views/DataViewServer";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { toneFor } from "@/lib/tones";
import {
  RESERVATION_STATE_LABELS,
  isActiveReservation,
  type ReservationState,
} from "@/lib/reservations";
import { FloorPlan, type FloorPlanTable } from "./FloorPlan";

export const dynamic = "force-dynamic";

type ReservationRow = {
  id: string;
  guest_name: string;
  party_size: number;
  reserved_for: string;
  reservation_state: ReservationState;
  table_id: string | null;
  table: { table_no: string } | null;
};

type TableRow = {
  id: string;
  table_no: string;
  seats: number;
  zone: string | null;
  x: number;
  y: number;
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.reservations.eyebrow", undefined, "Venue Ops")}
          title={t("console.reservations.title", undefined, "Reservations")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const [{ data: resData }, { data: tableData }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, guest_name, party_size, reserved_for, reservation_state, table_id, table:table_id(table_no)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("reserved_for", { ascending: true })
      .limit(200),
    supabase
      .from("venue_tables")
      .select("id, table_no, seats, zone, x, y")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .order("table_no", { ascending: true })
      .limit(500),
  ]);

  const rows = (resData ?? []) as unknown as ReservationRow[];
  const tables = (tableData ?? []) as unknown as TableRow[];

  const activeByTable = new Map<string, ReservationState>();
  for (const r of rows) {
    if (r.table_id && isActiveReservation(r.reservation_state)) {
      activeByTable.set(r.table_id, r.reservation_state);
    }
  }

  const floorTables: FloorPlanTable[] = tables.map((tbl) => ({
    id: tbl.id,
    table_no: tbl.table_no,
    seats: tbl.seats,
    zone: tbl.zone,
    x: Number(tbl.x),
    y: Number(tbl.y),
    reservation_state: activeByTable.get(tbl.id) ?? null,
  }));

  const bookedCount = rows.filter((r) => r.reservation_state === "booked").length;
  const seatedCount = rows.filter((r) => r.reservation_state === "seated").length;
  const covers = rows
    .filter((r) => isActiveReservation(r.reservation_state))
    .reduce((s, r) => s + Number(r.party_size ?? 0), 0);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.reservations.eyebrow", undefined, "Venue Ops")}
        title={t("console.reservations.title", undefined, "Reservations")}
        subtitle={t(
          "console.reservations.subtitle",
          { count: rows.length, booked: bookedCount, seated: seatedCount },
          `${rows.length} reservations · ${bookedCount} booked · ${seatedCount} seated`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Button
              href="/studio/operations/schedule?lane=venue&kind=reservation"
              size="sm"
              variant="secondary"
            >
              {t("console.reservations.openSchedule", undefined, "Open in Schedule")}
            </Button>
            <Button href="/studio/operations/reservations/tables/new" size="sm" variant="secondary">
              {t("console.reservations.newTable", undefined, "+ New Table")}
            </Button>
            <Button href="/studio/operations/reservations/new" size="sm">
              {t("console.reservations.newReservation", undefined, "+ New Reservation")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.reservations.metrics.tables", undefined, "Tables")}
            value={fmt.number(tables.length)}
            accent
          />
          <MetricCard
            label={t("console.reservations.metrics.active", undefined, "Active covers")}
            value={fmt.number(covers)}
          />
          <MetricCard
            label={t("console.reservations.metrics.seated", undefined, "Seated")}
            value={fmt.number(seatedCount)}
          />
        </div>

        <div className="surface p-5">
          <h3 className="mb-3 text-sm font-semibold">
            {t("console.reservations.floorPlan", undefined, "Floor plan")}
          </h3>
          <FloorPlan
            tables={floorTables}
            emptyLabel={t("console.reservations.floorPlanEmpty", undefined, "No tables yet. Add tables to build the floor plan.")}
          />
        </div>

        <DataView<ReservationRow>
          rows={rows}
          rowHref={(r) => `/studio/operations/reservations/${r.id}`}
          emptyLabel={t("console.reservations.emptyLabel", undefined, "No reservations yet")}
          emptyDescription={t("console.reservations.emptyDescription", undefined, "Book a table for a guest. Track the booking from booked → seated → completed on the floor plan.")}
          emptyAction={
            <Button href="/studio/operations/reservations/new" size="sm">
              {t("console.reservations.newReservation", undefined, "+ New Reservation")}
            </Button>
          }
          columns={[
            {
              key: "guest",
              header: t("console.reservations.columns.guest", undefined, "Guest"),
              render: (r) => r.guest_name,
              accessor: (r) => r.guest_name,
            },
            {
              key: "party",
              header: t("console.reservations.columns.party", undefined, "Party"),
              render: (r) => fmt.number(r.party_size),
              accessor: (r) => r.party_size,
              numeric: true,
            },
            {
              key: "table",
              header: t("console.reservations.columns.table", undefined, "Table"),
              render: (r) => r.table?.table_no ?? "—",
              accessor: (r) => r.table?.table_no ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "reserved_for",
              header: t("console.reservations.columns.reservedFor", undefined, "Reserved for"),
              render: (r) =>
                fmt.dateParts(r.reserved_for, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }),
              accessor: (r) => r.reserved_for,
              mono: true,
            },
            {
              key: "state",
              header: t("console.reservations.columns.state", undefined, "Status"),
              render: (r) => (
                <Badge variant={toneFor(r.reservation_state)}>
                  {RESERVATION_STATE_LABELS[r.reservation_state]}
                </Badge>
              ),
              accessor: (r) => r.reservation_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
