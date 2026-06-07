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
        <ModuleHeader
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.hospitality.title", undefined, "Hospitality")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const [{ count: tickets }, { count: blocks }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("catalog_kind", "ticket")
      .is("deleted_at", null),
    supabase.from("accommodation_blocks").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    {
      href: `/p/${slug}/hospitality/itinerary`,
      label: t("p.hospitality.tiles.itinerary.label", undefined, "Itinerary"),
      desc: t("p.hospitality.tiles.itinerary.desc", undefined, "Day-by-day schedule for your party"),
    },
    {
      href: `/p/${slug}/hospitality/guests`,
      label: t("p.hospitality.tiles.guests.label", undefined, "Guests"),
      desc: t("p.hospitality.tiles.guests.desc", undefined, "Roster, tickets, allocations"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
        title={t("p.hospitality.title", undefined, "Hospitality")}
        subtitle={t(
          "p.hospitality.subtitle",
          undefined,
          "Premium guest experience — itinerary, transfers, dining, accommodation",
        )}
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.hospitality.title", undefined, "Hospitality") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.hospitality.metric.tickets", undefined, "Tickets")}
            value={fmt.number(tickets ?? 0)}
          />
          <MetricCard
            label={t("p.hospitality.metric.roomBlocks", undefined, "Room Blocks")}
            value={fmt.number(blocks ?? 0)}
          />
          <MetricCard
            label={t("p.hospitality.metric.status", undefined, "Status")}
            value={t("p.hospitality.metric.statusLive", undefined, "Live")}
            accent
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <p className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</p>
            </Link>
          ))}
        </div>
        <p className="text-xs text-[var(--p-text-2)]">
          {t("p.hospitality.footer.prefix", undefined, "Need a change to your booking? Email")}{" "}
          <a className="text-[var(--p-accent)]" href="mailto:hospitality@atlvs.pro">
            hospitality@atlvs.pro
          </a>{" "}
          {t("p.hospitality.footer.suffix", undefined, "and reference your booking ID.")}
        </p>
      </div>
    </>
  );
}
