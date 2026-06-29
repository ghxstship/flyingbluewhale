import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { getRequestT } from "@/lib/i18n/request";
import { DISPATCH_MODE_LABELS, formatCents, type DispatchMode } from "@/lib/subcontractor";

export const dynamic = "force-dynamic";

type WO = {
  id: string;
  title: string;
  trade: string;
  site_address: string | null;
  start_date: string | null;
  end_date: string | null;
  budget_guide_cents: number | null;
  dispatch_mode: DispatchMode;
};

async function load(id: string): Promise<WO | null> {
  if (!hasSupabase) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("public_work_orders")
    .select("id, title, trade, site_address, start_date, end_date, budget_guide_cents, dispatch_mode")
    .eq("id", id)
    .maybeSingle();
  return (data as WO) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const wo = await load(id);
  return buildMetadata({
    title: wo ? `${wo.title} — ${wo.trade}` : "Work order",
    description: wo ? `Open ${wo.trade} work order. ${formatCents(wo.budget_guide_cents)} budget guide.` : undefined,
    path: `/marketplace/work-orders/${id}`,
  });
}

export default async function PublicWorkOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  const wo = await load(id);
  if (!wo) notFound();

  const crumbs = [
    { label: t("marketing.pages.marketplace.crumbs.marketplace", undefined, "Marketplace"), href: "/marketplace" },
    { label: t("marketing.pages.marketplace.workOrders.crumb", undefined, "Work Orders"), href: "/marketplace/work-orders" },
    { label: wo.title, href: `/marketplace/work-orders/${id}` },
  ];

  return (
    <>
      <Breadcrumbs items={crumbs} className="mx-auto max-w-3xl px-6 pt-6" />
      <article className="mx-auto max-w-3xl px-6 pt-8 pb-16">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="brand-soft">{wo.trade}</Badge>
          <Badge variant="muted">{DISPATCH_MODE_LABELS[wo.dispatch_mode]}</Badge>
        </div>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{wo.title}</h1>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
            <dt className="text-xs text-[var(--p-text-2)]">{t("marketing.pages.marketplace.workOrders.budget", undefined, "Budget guide")}</dt>
            <dd className="mt-1 font-mono text-lg">{formatCents(wo.budget_guide_cents)}</dd>
          </div>
          <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4">
            <dt className="text-xs text-[var(--p-text-2)]">{t("marketing.pages.marketplace.workOrders.dates", undefined, "Dates")}</dt>
            <dd className="mt-1 text-sm">{wo.start_date || "—"} → {wo.end_date || "—"}</dd>
          </div>
          {wo.site_address && (
            <div className="surface rounded-[var(--p-r-lg)] border border-[var(--p-border)] p-4 sm:col-span-2">
              <dt className="text-xs text-[var(--p-text-2)]">{t("marketing.pages.marketplace.workOrders.site", undefined, "Site")}</dt>
              <dd className="mt-1 text-sm">{wo.site_address}</dd>
            </div>
          )}
        </dl>
        <p className="mt-8 text-sm text-[var(--p-text-2)]">
          {t(
            "marketing.pages.marketplace.workOrders.cta",
            undefined,
            "Sign in to your subcontractor portal to submit a bid on this work order.",
          )}
        </p>
      </article>
    </>
  );
}
