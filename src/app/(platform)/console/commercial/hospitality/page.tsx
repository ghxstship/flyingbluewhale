import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type TicketTypeRow = {
  id: string;
  name: string;
  channel: string;
  price_cents: number;
  currency: string;
  allocation: number;
};

type EntitlementRow = {
  id: string;
  title: string;
  quantity: number;
  delivered: number;
  status: string;
  due_by: string | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  contracted: "muted",
  in_progress: "info",
  delivered: "success",
  blocked: "warning",
};

const HOSP_CHANNEL = "hospitality";

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Commercial" title="Hospitality" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: ttData }, { data: entData }] = await Promise.all([
    supabase
      .from("ticket_types")
      .select("id, name, channel, price_cents, currency, allocation")
      .eq("org_id", session.orgId)
      .eq("channel", HOSP_CHANNEL)
      .order("name", { ascending: true })
      .limit(200),
    supabase
      .from("sponsor_entitlements")
      .select("id, title, quantity, delivered, status, due_by")
      .eq("org_id", session.orgId)
      .ilike("title", "%hospitality%")
      .order("due_by", { ascending: true })
      .limit(200),
  ]);

  const tickets = (ttData ?? []) as TicketTypeRow[];
  const ents = (entData ?? []) as EntitlementRow[];

  const totalAllocation = tickets.reduce((s, t) => s + t.allocation, 0);
  const totalRevenue = tickets.reduce((s, t) => s + t.allocation * t.price_cents, 0);
  const totalEntitlements = ents.reduce((s, e) => s + e.quantity, 0);
  const delivered = ents.reduce((s, e) => s + e.delivered, 0);

  return (
    <>
      <ModuleHeader
        eyebrow="Commercial"
        title="Hospitality"
        subtitle={`${tickets.length} package${tickets.length === 1 ? "" : "s"} · ${fmt.number(totalAllocation)} seats · ${ents.length} entitlement${ents.length === 1 ? "" : "s"}`}
        action={
          <Button href="/console/commercial/sponsors" size="sm">
            Sponsors
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Allocation" value={fmt.number(totalAllocation)} accent />
          <MetricCard label="Revenue at Allocation" value={formatMoney(totalRevenue)} />
          <MetricCard
            label="Entitlements Delivered"
            value={`${fmt.number(delivered)} / ${fmt.number(totalEntitlements)}`}
          />
        </div>

        <section>
          <h3 className="text-sm font-semibold">Hospitality Packages</h3>
          {tickets.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Hospitality Ticket Types"
              description="Hospitality maps onto ticket_types with channel = 'hospitality'. Author one in Console → Tickets."
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {tickets.map((t) => (
                <li key={t.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {fmt.number(t.allocation)} seats · {formatMoney(t.price_cents, t.currency)} ea
                    </div>
                  </div>
                  <Badge variant="muted">{t.channel}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Sponsor Hospitality Entitlements</h3>
          {ents.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Hospitality Entitlements"
              description="Author sponsor entitlements with 'hospitality' in the title via the Commercial → Sponsors module."
              action={
                <Link href="/console/commercial/sponsors" className="btn btn-secondary btn-sm">
                  Open sponsors
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {ents.map((e) => (
                <li key={e.id} className="surface flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-medium">{e.title}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">
                      {e.delivered} / {e.quantity} delivered
                      {e.due_by ? ` · due ${e.due_by}` : ""}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[e.status] ?? "muted"}>{e.status.replace(/_/g, " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
