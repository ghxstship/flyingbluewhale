import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Order = {
  id: string;
  catalog: string;
  status: string;
  total_cents: number;
  currency: string;
  notes: string | null;
  delegation: { name: string | null; code: string | null } | null;
  created_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  submitted: "info",
  in_review: "warning",
  approved: "success",
  rejected: "error",
  fulfilled: "success",
  cancelled: "muted",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const formatters = await getRequestFormatters();
  const fmtIntl = formatters;
  const { locale } = formatters.settings;
  const money = (cents: number, currency: string): string => formatMoney(cents, { locale, currency });
  const fmt = (iso: string): string => formatters.date(iso, "medium");
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Rate-card Orders" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("rate_card_orders")
    .select("id, catalog, status, total_cents, currency, notes, delegation:delegation_id(name, code), created_at")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });

  const orders = ((data ?? []) as unknown as Order[]) ?? [];
  const total = orders.reduce((s, o) => s + o.total_cents, 0);
  const currency = orders[0]?.currency ?? "USD";
  const inReview = orders.filter((o) => o.status === "submitted" || o.status === "in_review").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Delegation"
        title="Rate-card Orders"
        subtitle={`${orders.length} Order${orders.length === 1 ? "" : "s"} · ${money(total, currency)} Total`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Rate-card" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Total Spend" value={money(total, currency)} accent />
          <MetricCard label="Orders" value={fmtIntl.number(orders.length)} />
          <MetricCard label="In Review" value={fmtIntl.number(inReview)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Orders</h3>
          {orders.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No orders yet. The rate-card service catalogue is published in <code>/console/programs/rate-card</code> —
              your attaché will place orders against it.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {orders.map((o) => (
                <li key={o.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{o.catalog}</div>
                    <div className="font-mono text-[10px] text-[var(--text-muted)]">
                      {o.delegation?.code ?? "—"} · placed {fmt(o.created_at)}
                    </div>
                    {o.notes && <p className="mt-1 text-xs text-[var(--text-secondary)]">{o.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono text-xs">{money(o.total_cents, o.currency)}</span>
                    <Badge variant={STATUS_TONE[o.status] ?? "muted"}>{toTitle(o.status)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
