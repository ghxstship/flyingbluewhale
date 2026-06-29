import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { DISPATCH_MODE_LABELS, formatCents, type DispatchMode } from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getRequestT();
  return buildMetadata({
    title: t("marketing.pages.marketplace.workOrders.meta.title", undefined, "Open trade work orders"),
    description: t(
      "marketing.pages.marketplace.workOrders.meta.description",
      undefined,
      "Browse open subcontractor work orders and bid on trade jobs.",
    ),
    path: "/marketplace/work-orders",
  });
}

type Row = {
  id: string;
  title: string;
  trade: string;
  site_address: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_guide_cents: number | null;
  dispatch_mode: DispatchMode;
};

export default async function PublicWorkOrdersPage() {
  const { t } = await getRequestT();
  const crumbs = [
    { label: t("marketing.pages.marketplace.crumbs.home", undefined, "Home"), href: "/" },
    { label: t("marketing.pages.marketplace.crumbs.marketplace", undefined, "Marketplace"), href: "/marketplace" },
    { label: t("marketing.pages.marketplace.workOrders.crumb", undefined, "Work Orders"), href: "/marketplace/work-orders" },
  ];
  let rows: Row[] = [];
  if (hasSupabase) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_work_orders")
      .select("id, title, trade, site_address, start_date, end_date, budget_guide_cents, dispatch_mode")
      .order("created_at", { ascending: false })
      .limit(100);
    rows = (data ?? []) as Row[];
  }

  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-6xl px-6 pt-6" />
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-16">
        <h1 className="hed-2xl">
          {t("marketing.pages.marketplace.workOrders.title", undefined, "Open Trade Work Orders")}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--p-text-2)]">
          {t(
            "marketing.pages.marketplace.workOrders.body",
            undefined,
            "Live subcontractor jobs posted by producers. Open a job to see the scope and submit a bid.",
          )}
        </p>
        {rows.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title={t("marketing.pages.marketplace.workOrders.empty", undefined, "No open work orders right now")}
              description={t(
                "marketing.pages.marketplace.workOrders.emptyBody",
                undefined,
                "Check back soon — new trade jobs are posted as productions ramp up.",
              )}
            />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <MarketplaceCard
                key={r.id}
                href={`/marketplace/work-orders/${r.id}`}
                title={r.title}
                subtitle={r.trade}
                tags={[r.trade]}
                meta={[
                  r.budget_guide_cents != null ? formatCents(r.budget_guide_cents) : null,
                  r.start_date ? `Starts ${r.start_date}` : null,
                  DISPATCH_MODE_LABELS[r.dispatch_mode],
                  r.site_address,
                ]}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
