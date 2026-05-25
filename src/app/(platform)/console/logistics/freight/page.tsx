import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDateParts, formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ManifestRow = {
  id: string;
  kind: string;
  flight_ref: string | null;
  carrier: string | null;
  scheduled_at: string | null;
  actual_at: string | null;
  party_size: number;
  status: string;
  delegation: { code: string | null; name: string | null } | null;
};

type OrderRow = {
  id: string;
  catalog: string;
  total_cents: number;
  currency: string;
  status: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  confirmed: "info",
  in_transit: "info",
  arrived: "success",
  cleared: "success",
  delayed: "warning",
  cancelled: "error",
  draft: "muted",
  submitted: "info",
  fulfilled: "success",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return formatDateParts(iso, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Logistics" title="Freight" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const horizon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: manifestData }, { data: orderData }] = await Promise.all([
    supabase
      .from("ad_manifests")
      .select(
        "id, kind, flight_ref, carrier, scheduled_at, actual_at, party_size, status, delegation:delegation_id(code, name)",
      )
      .eq("org_id", session.orgId)
      .order("scheduled_at", { ascending: true })
      .limit(200),
    supabase
      .from("rate_card_orders")
      .select("id, catalog, total_cents, currency, status")
      .eq("org_id", session.orgId)
      .order("updated_at", { ascending: false })
      .limit(50),
  ]);

  const manifests = (manifestData ?? []) as unknown as ManifestRow[];
  const orders = (orderData ?? []) as OrderRow[];

  const upcoming = manifests.filter(
    (m) =>
      m.scheduled_at &&
      new Date(m.scheduled_at).getTime() <= new Date(horizon).getTime() &&
      new Date(m.scheduled_at).getTime() >= Date.now(),
  );
  const cleared = manifests.filter((m) => m.actual_at != null).length;
  const totalSpend = orders.reduce((s, o) => s + o.total_cents, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Logistics"
        title="Freight"
        subtitle={`${manifests.length} manifest${manifests.length === 1 ? "" : "s"} · ${upcoming.length} Upcoming · ${orders.length} rate-card order${orders.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/logistics/ratecard" size="sm">
            Rate card
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Upcoming · 30d" value={fmtIntl.number(upcoming.length)} accent />
          <MetricCard label="Cleared" value={fmtIntl.number(cleared)} />
          <MetricCard label="Order Spend" value={formatMoney(totalSpend)} />
        </div>

        <section>
          <h3 className="text-sm font-semibold">Arrival / departure manifests</h3>
          {manifests.length === 0 ? (
            <EmptyState
              size="compact"
              title="No A&D manifests on file"
              description="Customs + bonded warehouse routing flows through ad_manifests. Capture flight refs and carriers as runs land."
              action={
                <Link href="/console/transport/ad" className="btn btn-secondary btn-sm">
                  Open A&D
                </Link>
              }
            />
          ) : (
            <div className="surface mt-3 overflow-x-auto">
              <table className="data-table w-full text-sm">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Flight</th>
                    <th>Carrier</th>
                    <th>Scheduled</th>
                    <th>Actual</th>
                    <th className="text-end">Party</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {manifests.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <Badge variant="muted">{toTitle(m.kind)}</Badge>
                      </td>
                      <td className="font-mono text-xs">{m.flight_ref ?? "—"}</td>
                      <td>{m.carrier ?? "—"}</td>
                      <td className="font-mono text-xs">{fmt(m.scheduled_at)}</td>
                      <td className="font-mono text-xs">{fmt(m.actual_at)}</td>
                      <td className="text-end font-mono text-xs">{fmtIntl.number(m.party_size)}</td>
                      <td>
                        <Badge variant={STATUS_TONE[m.status] ?? "muted"}>{toTitle(m.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Rate-card orders</h3>
          {orders.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Rate-Card Orders"
              description="Authorize freight services off the rate card; line-items book against the catalog."
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{o.catalog}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {formatMoney(o.total_cents, o.currency)}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[o.status] ?? "muted"}>{toTitle(o.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Customs holds, bonded-warehouse routing, and TMS feeds (Flexport, project44) install via{" "}
          <Link href="/console/settings/integrations" className="text-[var(--org-primary)]">
            Settings → Integrations
          </Link>
          .
        </p>
      </div>
    </>
  );
}
