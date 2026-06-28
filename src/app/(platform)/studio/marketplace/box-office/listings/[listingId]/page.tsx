import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormShell } from "@/components/FormShell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/commerce_store";
import { timeAgo, toTitle } from "@/lib/format";
import {
  getListing,
  listTicketTypes,
  getEventRevenue,
  listOrders,
  listPayouts,
  netCentsFrom,
  type RevenueOrder,
} from "@/lib/box_office_ticketing";
import { createTicketTypeAction } from "../actions";

export const dynamic = "force-dynamic";

type SeatZone = { name: string; capacity: number };

function readSeatZones(seatMap: unknown): SeatZone[] {
  if (!seatMap || typeof seatMap !== "object") return [];
  const zonesRaw = (seatMap as { zones?: unknown }).zones;
  if (!Array.isArray(zonesRaw)) return [];
  return zonesRaw
    .filter((z): z is Record<string, unknown> => !!z && typeof z === "object")
    .map((z) => ({
      name: typeof z.name === "string" ? z.name : "Zone",
      capacity: typeof z.capacity === "number" ? z.capacity : 0,
    }));
}

function formatPayoutDate(value: string | null): string {
  if (!value) return "Pending";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * The GVTEWAY first-party box-office organizer console — one server-rendered
 * page with five sections (Overview, Ticket Types, Seating, Orders, Payouts).
 *
 * SSOT: gross/fees/refunds/net all read from `v_event_revenue` via
 * `getEventRevenue` + `netCentsFrom`; nothing is recomputed from raw rows.
 * Every query is org-scoped (`session.orgId`), backed by RLS.
 */
export default async function BoxOfficeConsolePage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  if (!hasSupabase) return notFound();

  const session = await requireSession();
  const supabase = await createClient();

  const listing = await getListing(supabase, session.orgId, listingId);
  if (!listing) return notFound();

  const [ticketTypes, revenue, orders, payouts] = await Promise.all([
    listTicketTypes(supabase, listing.id),
    getEventRevenue(supabase, session.orgId, listing.id),
    listOrders(supabase, session.orgId, listing.id),
    listPayouts(supabase, session.orgId, listing.id),
  ]);

  const sold = ticketTypes.reduce((sum, t) => sum + (t.quantity_sold ?? 0), 0);
  const capacity = ticketTypes.reduce((sum, t) => sum + (t.quantity_total ?? 0), 0);
  const soldPct = capacity > 0 ? Math.round((sold / capacity) * 100) : 0;

  const grossCents = revenue?.gross_cents ?? 0;
  const feesCents = revenue?.fees_cents ?? 0;
  const refundsCents = revenue?.refunds_cents ?? 0;
  const netCents = netCentsFrom(revenue);

  const zones = readSeatZones(listing.seat_map);
  const latestPayout = payouts[0] ?? null;

  return (
    <>
      <ModuleHeader
        eyebrow="Box Office"
        title={listing.title}
        subtitle={listing.summary ?? undefined}
        breadcrumbs={[
          { label: "Marketplace" },
          { label: "Box Office" },
          { label: "Listings", href: "/studio/marketplace/box-office/listings" },
          { label: listing.title },
        ]}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={listing.fulfillment} />
            <Button href="/studio/marketplace/box-office/listings" size="sm" variant="ghost">
              All Listings
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-6">
        {/* ── OVERVIEW ─────────────────────────────────────────────── */}
        <section className="surface p-5">
          <span className="eyebrow eyebrow-accent">Overview</span>
          <h2 className="hed-lg mt-1 mb-4">Revenue & Capacity</h2>
          <div className="metric-grid">
            <MetricCard label="Gross" value={formatMoney(grossCents)} accent />
            <MetricCard label="Net" value={formatMoney(netCents)} />
            <MetricCard label="Tickets Sold" value={String(sold)} />
            <MetricCard label="Capacity" value={String(capacity)} />
          </div>
          <div className="mt-4 max-w-md">
            <div className="mb-1 flex items-center justify-between text-xs text-[var(--p-text-2)]">
              <span>
                {sold} of {capacity} sold
              </span>
              <span className="tabular-nums">{soldPct}%</span>
            </div>
            <ProgressBar value={soldPct} aria-label={`${soldPct}% of capacity sold`} />
          </div>
          <p className="mt-4 text-sm text-[var(--p-text-2)]">
            Next payout:{" "}
            {latestPayout ? (
              <span className="font-medium text-[var(--p-text-1)]">
                {formatMoney(latestPayout.net_cents)} {toTitle(latestPayout.payout_state)},{" "}
                {formatPayoutDate(latestPayout.scheduled_for ?? latestPayout.paid_at)}
              </span>
            ) : (
              <span className="font-medium text-[var(--p-text-1)]">None scheduled</span>
            )}
          </p>
        </section>

        {/* ── TICKET TYPES ─────────────────────────────────────────── */}
        <section className="surface p-5">
          <span className="eyebrow eyebrow-accent">Ticket Types</span>
          <h2 className="hed-lg mt-1 mb-4">Inventory & Pricing</h2>
          {ticketTypes.length === 0 ? (
            <EmptyState
              size="compact"
              title="No ticket types yet"
              description="Add a ticket type below to open sales for this event."
            />
          ) : (
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Sold / Total</th>
                  <th>Sales</th>
                </tr>
              </thead>
              <tbody>
                {ticketTypes.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.name}
                      {t.seating_zone ? (
                        <span className="ml-2 text-xs text-[var(--p-text-2)]">{t.seating_zone}</span>
                      ) : null}
                    </td>
                    <td className="tabular-nums">{formatMoney(t.price_cents, t.currency.toUpperCase())}</td>
                    <td className="tabular-nums">
                      {t.quantity_sold} / {t.quantity_total}
                    </td>
                    <td>
                      <StatusBadge status={t.sales_state} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <h3 className="mt-6 mb-3 text-sm font-semibold">New ticket type</h3>
          <FormShell action={createTicketTypeAction} submitLabel="Add Ticket Type" className="space-y-3">
            <input type="hidden" name="event_listing_id" value={listing.id} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <Input label="Name" name="name" required maxLength={160} />
              <Input label="Price (USD)" name="price" type="number" min={0} step="0.01" required />
              <Input label="Quantity" name="quantity_total" type="number" min={0} defaultValue="0" />
              <Input label="Seating Zone" name="seating_zone" maxLength={120} />
            </div>
          </FormShell>
        </section>

        {/* ── SEATING ──────────────────────────────────────────────── */}
        <section className="surface p-5">
          <span className="eyebrow eyebrow-accent">Seating</span>
          <h2 className="hed-lg mt-1 mb-4">Seat Map</h2>
          {zones.length === 0 ? (
            <EmptyState size="compact" title="No seat map" description="This event is general admission." />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {zones.map((zone, i) => (
                <div key={`${zone.name}-${i}`} className="surface-inset p-4">
                  <div className="text-sm font-semibold">{zone.name}</div>
                  <div className="mt-1 text-xs text-[var(--p-text-2)]">
                    {zone.capacity} {zone.capacity === 1 ? "seat" : "seats"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── ORDERS ───────────────────────────────────────────────── */}
        <section className="surface p-5">
          <span className="eyebrow eyebrow-accent">Orders</span>
          <h2 className="hed-lg mt-1 mb-4">Order Book</h2>
          {orders.length === 0 ? (
            <EmptyState
              size="compact"
              title="No orders yet"
              description="Orders land here as buyers check out."
            />
          ) : (
            <DataTable<RevenueOrder>
              rows={orders}
              columns={[
                {
                  key: "reference",
                  header: "Reference",
                  render: (r) => r.reference,
                  accessor: (r) => r.reference,
                },
                {
                  key: "buyer",
                  header: "Buyer",
                  render: (r) => r.buyer_email ?? "Guest",
                  accessor: (r) => r.buyer_email ?? "",
                },
                {
                  key: "total",
                  header: "Total",
                  render: (r) => formatMoney(r.total_cents, r.currency.toUpperCase()),
                  accessor: (r) => r.total_cents,
                  tabular: true,
                },
                {
                  key: "state",
                  header: "State",
                  render: (r) => <StatusBadge status={r.order_state} />,
                  accessor: (r) => r.order_state,
                  filterable: true,
                },
                {
                  key: "placed",
                  header: "Placed",
                  render: (r) => timeAgo(r.placed_at),
                  accessor: (r) => r.placed_at,
                },
              ]}
            />
          )}
        </section>

        {/* ── PAYOUTS ──────────────────────────────────────────────── */}
        <section className="surface p-5">
          <span className="eyebrow eyebrow-accent">Payouts</span>
          <h2 className="hed-lg mt-1 mb-4">Settlement</h2>
          <dl className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="surface-inset p-3">
              <dt className="eyebrow">Gross</dt>
              <dd className="mt-1 font-semibold tabular-nums">{formatMoney(grossCents)}</dd>
            </div>
            <div className="surface-inset p-3">
              <dt className="eyebrow">Fees</dt>
              <dd className="mt-1 font-semibold tabular-nums">{formatMoney(feesCents)}</dd>
            </div>
            <div className="surface-inset p-3">
              <dt className="eyebrow">Refunds</dt>
              <dd className="mt-1 font-semibold tabular-nums">{formatMoney(refundsCents)}</dd>
            </div>
            <div className="surface-inset p-3">
              <dt className="eyebrow">Net</dt>
              <dd className="mt-1 font-semibold tabular-nums text-[var(--p-accent-text)]">{formatMoney(netCents)}</dd>
            </div>
          </dl>
          {payouts.length === 0 ? (
            <EmptyState
              size="compact"
              title="No payouts yet"
              description="Payouts appear here once settlement is scheduled."
            />
          ) : (
            <table className="ps-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Net</th>
                  <th>State</th>
                  <th>Scheduled / Paid</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => (
                  <tr key={p.id}>
                    <td>{p.period_label ?? "—"}</td>
                    <td className="tabular-nums">{formatMoney(p.net_cents, p.currency.toUpperCase())}</td>
                    <td>
                      <StatusBadge status={p.payout_state} />
                    </td>
                    <td>{formatPayoutDate(p.paid_at ?? p.scheduled_for)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
