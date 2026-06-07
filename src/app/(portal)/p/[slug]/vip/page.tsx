import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow={t("p.vip.eyebrow", undefined, "Portal")} title={t("p.vip.title", undefined, "VIP")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.vip.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: blocks }, { count: runs }] = await Promise.all([
    supabase
      .from("accommodation_blocks")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("stakeholder_group", "vip"),
    supabase
      .from("dispatch_runs")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("fleet", "t1"),
  ]);

  const tiles = [
    {
      href: `/p/${slug}/vip/itinerary`,
      label: t("p.vip.tiles.itinerary.label", undefined, "Itinerary"),
      desc: t("p.vip.tiles.itinerary.desc", undefined, "Day-by-day program with private hosting"),
    },
    {
      href: `/p/${slug}/vip/transport`,
      label: t("p.vip.tiles.transport.label", undefined, "Transport"),
      desc: t("p.vip.tiles.transport.desc", undefined, "Dedicated T1 vehicles and drivers"),
    },
    {
      href: `/p/${slug}/vip/accommodation`,
      label: t("p.vip.tiles.accommodation.label", undefined, "Accommodation"),
      desc: t("p.vip.tiles.accommodation.desc", undefined, "Suite reservations"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.vip.eyebrow", undefined, "Portal")}
        title={t("p.vip.title", undefined, "VIP")}
        subtitle={t("p.vip.subtitle", undefined, "Concierge, dedicated transport, and private hosting")}
        breadcrumbs={[
          { label: t("p.vip.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.vip.breadcrumb.vip", undefined, "VIP") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("p.vip.metrics.suites", undefined, "Suites")} value={fmt.number(blocks ?? 0)} />
          <MetricCard label={t("p.vip.metrics.t1Runs", undefined, "T1 Runs")} value={fmt.number(runs ?? 0)} />
          <MetricCard
            label={t("p.vip.metrics.status", undefined, "Status")}
            value={t("p.vip.metrics.statusLive", undefined, "Live")}
            accent
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-xs text-[var(--p-text-2)]">
          {t("p.vip.concierge.label", undefined, "Concierge:")}{" "}
          <a className="text-[var(--p-accent)]" href="mailto:vip@atlvs.pro">
            vip@atlvs.pro
          </a>{" "}
          {t("p.vip.concierge.window", undefined, "— 24/7 during event window.")}
        </p>
      </div>
    </>
  );
}
