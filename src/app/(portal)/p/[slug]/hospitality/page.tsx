import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";

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
  const project = await projectIdFromSlug(slug);
  // Tickets are scoped to this project and to the viewer's own party —
  // never an org-wide count on an external surface.
  let ticketQuery = supabase
    .from("assignments")
    .select("id", { count: "exact", head: true })
    .eq("org_id", session.orgId)
    .eq("catalog_kind", "ticket")
    .eq("party_user_id", session.userId)
    .is("deleted_at", null);
  if (project) ticketQuery = ticketQuery.eq("project_id", project.id);
  const [{ count: tickets }, { count: blocks }] = await Promise.all([
    ticketQuery,
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
          "Premium guest experience: itinerary, transfers, dining, accommodation",
        )}
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.hospitality.title", undefined, "Hospitality") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.hospitality.metric.yourTickets", undefined, "Your Tickets")}
            value={fmt.number(tickets ?? 0)}
          />
          <MetricCard
            label={t("p.hospitality.metric.roomBlocks", undefined, "Room Blocks")}
            value={fmt.number(blocks ?? 0)}
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
          {t("p.hospitality.footer.messagePrefix", undefined, "Need a change to your booking?")}{" "}
          <Link className="text-[var(--p-accent)] underline" href={`/p/${slug}/messages`}>
            {t("p.hospitality.footer.messageLink", undefined, "Message your team")}
          </Link>{" "}
          {t("p.hospitality.footer.messageSuffix", undefined, "and reference your booking ID.")}
        </p>
      </div>
    </>
  );
}
