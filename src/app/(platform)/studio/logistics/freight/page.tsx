import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  order_state: string;
  delegation: { code: string | null; name: string | null } | null;
};

type OrderRow = {
  id: string;
  catalog: string;
  total_cents: number;
  currency: string;
  order_state: string;
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
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.logistics.freight.eyebrow", undefined, "Operations · Run")}
          title={t("console.logistics.freight.title", undefined, "Freight")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.logistics.freight.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        "id, kind, flight_ref, carrier, scheduled_at, actual_at, party_size, order_state:manifest_state, delegation:delegation_id(code, name)",
      )
      .eq("org_id", session.orgId)
      .order("scheduled_at", { ascending: true })
      .limit(200),
    supabase
      .from("rate_card_orders")
      .select("id, catalog, total_cents, currency, order_state")
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
        eyebrow={t("console.logistics.freight.eyebrow", undefined, "Operations · Run")}
        title={t("console.logistics.freight.title", undefined, "Freight")}
        subtitle={`${manifests.length} ${manifests.length === 1 ? t("console.logistics.freight.subtitle.manifest", undefined, "manifest") : t("console.logistics.freight.subtitle.manifests", undefined, "manifests")} · ${upcoming.length} ${t("console.logistics.freight.subtitle.upcoming", undefined, "Upcoming")} · ${orders.length} ${orders.length === 1 ? t("console.logistics.freight.subtitle.rateCardOrder", undefined, "rate-card order") : t("console.logistics.freight.subtitle.rateCardOrders", undefined, "rate-card orders")}`}
        action={
          <Button href="/studio/logistics/ratecard" size="sm">
            {t("console.logistics.freight.rateCard", undefined, "Rate card")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.logistics.freight.metrics.upcoming30d", undefined, "Upcoming · 30d")}
            value={fmtIntl.number(upcoming.length)}
            accent
          />
          <MetricCard
            label={t("console.logistics.freight.metrics.cleared", undefined, "Cleared")}
            value={fmtIntl.number(cleared)}
          />
          <MetricCard
            label={t("console.logistics.freight.metrics.orderSpend", undefined, "Order Spend")}
            value={formatMoney(totalSpend)}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.logistics.freight.manifests.heading", undefined, "Arrival / departure manifests")}
          </h3>
          <div className="mt-3">
            <DataTable<ManifestRow>
              rows={manifests}
              tableId="console:logistics:freight:manifests"
              emptyLabel={t("console.logistics.freight.manifests.emptyTitle", undefined, "No A&D manifests on file")}
              emptyDescription={t(
                "console.logistics.freight.manifests.emptyDescription",
                undefined,
                "Customs + bonded warehouse routing flows through ad_manifests. Capture flight refs and carriers as runs land.",
              )}
              emptyAction={
                <Link href="/studio/transport/ad" className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("console.logistics.freight.manifests.openAd", undefined, "Open A&D")}
                </Link>
              }
              columns={[
                {
                  key: "kind",
                  header: t("console.logistics.freight.manifests.col.kind", undefined, "Kind"),
                  render: (m) => <Badge variant="muted">{toTitle(m.kind)}</Badge>,
                  accessor: (m) => m.kind,
                  filterable: true,
                },
                {
                  key: "flight",
                  header: t("console.logistics.freight.manifests.col.flight", undefined, "Flight"),
                  render: (m) => m.flight_ref ?? "—",
                  accessor: (m) => m.flight_ref ?? null,
                  mono: true,
                },
                {
                  key: "carrier",
                  header: t("console.logistics.freight.manifests.col.carrier", undefined, "Carrier"),
                  render: (m) => m.carrier ?? "—",
                  accessor: (m) => m.carrier ?? null,
                  filterable: true,
                },
                {
                  key: "scheduled",
                  header: t("console.logistics.freight.manifests.col.scheduled", undefined, "Scheduled"),
                  render: (m) => fmt(m.scheduled_at),
                  accessor: (m) => m.scheduled_at ?? null,
                  mono: true,
                },
                {
                  key: "actual",
                  header: t("console.logistics.freight.manifests.col.actual", undefined, "Actual"),
                  render: (m) => fmt(m.actual_at),
                  accessor: (m) => m.actual_at ?? null,
                  mono: true,
                },
                {
                  key: "party",
                  header: t("console.logistics.freight.manifests.col.party", undefined, "Party"),
                  render: (m) => fmtIntl.number(m.party_size),
                  accessor: (m) => m.party_size,
                  tabular: true,
                  total: "sum",
                },
                {
                  key: "order_state",
                  header: t("console.logistics.freight.manifests.col.order_state", undefined, "Status"),
                  render: (m) => (
                    <Badge variant={STATUS_TONE[m.order_state] ?? "muted"}>{toTitle(m.order_state)}</Badge>
                  ),
                  accessor: (m) => m.order_state,
                  filterable: true,
                },
              ]}
            />
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold">
            {t("console.logistics.freight.orders.heading", undefined, "Rate-card orders")}
          </h3>
          {orders.length === 0 ? (
            <EmptyState
              size="compact"
              title={t("console.logistics.freight.orders.emptyTitle", undefined, "No Rate-Card Orders")}
              description={t(
                "console.logistics.freight.orders.emptyDescription",
                undefined,
                "Authorize freight services off the rate card; line-items book against the catalog.",
              )}
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{o.catalog}</div>
                    <div className="font-mono text-xs text-[var(--p-text-2)]">
                      {formatMoney(o.total_cents, o.currency)}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[o.order_state] ?? "muted"}>{toTitle(o.order_state)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "console.logistics.freight.integrationsHint",
            undefined,
            "Customs holds, bonded-warehouse routing, and TMS feeds (Flexport, project44) install via",
          )}{" "}
          <Link href="/studio/settings/integrations" className="text-[var(--p-accent)]">
            {t("console.logistics.freight.integrationsLink", undefined, "Settings → Integrations")}
          </Link>
          .
        </p>
      </div>
    </>
  );
}
