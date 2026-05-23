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

type RequisitionRow = {
  id: string;
  title: string;
  estimated_cents: number | null;
  status: string;
  created_at: string;
};

type PORow = {
  id: string;
  number: string;
  title: string;
  amount_cents: number;
  status: string;
  vendor: { name: string | null } | null;
};

const REQ_STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  submitted: "info",
  approved: "info",
  rejected: "error",
  converted: "success",
};

const PO_STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  draft: "muted",
  sent: "info",
  acknowledged: "info",
  fulfilled: "success",
  cancelled: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="Sourcing" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ data: reqData }, { data: poData }] = await Promise.all([
    supabase
      .from("requisitions")
      .select("id, title, estimated_cents, status, created_at")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("purchase_orders")
      .select("id, number, title, amount_cents, status, vendor:vendor_id(name)")
      .eq("org_id", session.orgId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const reqs = (reqData ?? []) as RequisitionRow[];
  const pos = (poData ?? []) as unknown as PORow[];
  const open = reqs.filter((r) => !["converted", "rejected"].includes(r.status)).length;
  const converted = reqs.filter((r) => r.status === "converted").length;
  const conversionRate = reqs.length > 0 ? Math.round((converted / reqs.length) * 100) : null;

  return (
    <>
      <ModuleHeader
        eyebrow="Procurement"
        title="Sourcing"
        subtitle={`${reqs.length} Requisition${reqs.length === 1 ? "" : "s"} · ${pos.length} active PO${pos.length === 1 ? "" : "s"}${conversionRate != null ? ` · ${conversionRate}% converted` : ""}`}
        action={
          <Button href="/console/procurement/requisitions/new" size="sm">
            + New Requisition
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open Requisitions" value={fmt.number(open)} accent />
          <MetricCard label="Active POs" value={fmt.number(pos.length)} />
          <MetricCard label="Converted" value={fmt.number(converted)} />
        </div>

        <section>
          <h3 className="text-sm font-semibold">Requisition Pipeline</h3>
          {reqs.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Requisitions"
              description="Sourcing pulls from open requisitions. Author one to start the funnel."
              action={
                <Link href="/console/procurement/requisitions/new" className="btn btn-secondary btn-sm">
                  + New Requisition
                </Link>
              }
            />
          ) : (
            <ul className="mt-3 space-y-2">
              {reqs.slice(0, 10).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/console/procurement/requisitions/${r.id}`}
                    className="surface flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">{r.title}</div>
                      <div className="font-mono text-xs text-[var(--text-muted)]">
                        {formatMoney(r.estimated_cents ?? 0)}
                      </div>
                    </div>
                    <Badge variant={REQ_STATUS_TONE[r.status] ?? "muted"}>{r.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-sm font-semibold">Recent Purchase Orders</h3>
          {pos.length === 0 ? (
            <EmptyState size="compact" title="No POs Issued Yet" />
          ) : (
            <ul className="mt-3 space-y-2">
              {pos.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/console/procurement/purchase-orders/${p.id}`}
                    className="surface flex items-center justify-between p-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        <span className="font-mono text-xs">{p.number}</span> · {p.title}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {p.vendor?.name ?? "No vendor"} · {formatMoney(p.amount_cents)}
                      </div>
                    </div>
                    <Badge variant={PO_STATUS_TONE[p.status] ?? "muted"}>{p.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
