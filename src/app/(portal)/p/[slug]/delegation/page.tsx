import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { PortalDocVault } from "@/components/portal/PortalDocVault";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
          title={t("p.delegation.title", undefined, "Delegation")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const project = await projectIdFromSlug(slug);

  const fmt = await getRequestFormatters();
  const [{ count: entries }, { count: visas }, { count: orders }, { count: blocks }] = await Promise.all([
    supabase.from("delegation_entries").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("visa_cases").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("rate_card_orders").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
    supabase.from("accommodation_blocks").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    {
      href: `/p/${slug}/delegation/entries`,
      label: t("p.delegation.tiles.entries.label", undefined, "Entries"),
      desc: t("p.delegation.tiles.entries.desc", undefined, "Roster of athletes and officials"),
      count: entries ?? 0,
    },
    {
      href: `/p/${slug}/delegation/accommodation`,
      label: t("p.delegation.tiles.accommodation.label", undefined, "Accommodation"),
      desc: t("p.delegation.tiles.accommodation.desc", undefined, "Room blocks and assignments"),
      count: blocks ?? 0,
    },
    {
      href: `/p/${slug}/delegation/transport`,
      label: t("p.delegation.tiles.transport.label", undefined, "Transport"),
      desc: t("p.delegation.tiles.transport.desc", undefined, "Vehicle bookings and dispatch"),
    },
    {
      href: `/p/${slug}/delegation/visa`,
      label: t("p.delegation.tiles.visa.label", undefined, "Visa Cases"),
      desc: t("p.delegation.tiles.visa.desc", undefined, "Travel docs and entry letters"),
      count: visas ?? 0,
    },
    {
      href: `/p/${slug}/delegation/ratecard`,
      label: t("p.delegation.tiles.ratecard.label", undefined, "Rate-card Orders"),
      desc: t("p.delegation.tiles.ratecard.desc", undefined, "Service catalog purchases"),
      count: orders ?? 0,
    },
    {
      href: `/p/${slug}/delegation/bookings`,
      label: t("p.delegation.tiles.bookings.label", undefined, "Bookings"),
      desc: t("p.delegation.tiles.bookings.desc", undefined, "Training venue bookings"),
    },
    {
      href: `/p/${slug}/delegation/meetings`,
      label: t("p.delegation.tiles.meetings.label", undefined, "Meetings"),
      desc: t("p.delegation.tiles.meetings.desc", undefined, "Team meetings, briefings"),
    },
    {
      href: `/p/${slug}/delegation/cases`,
      label: t("p.delegation.tiles.cases.label", undefined, "Cases"),
      desc: t("p.delegation.tiles.cases.desc", undefined, "Open issues and requests"),
    },
    {
      href: `/p/${slug}/delegation/privacy`,
      label: t("p.delegation.tiles.privacy.label", undefined, "Privacy"),
      desc: t("p.delegation.tiles.privacy.desc", undefined, "DSAR, consent, your data"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.shared.eyebrow.portal", undefined, "Portal")}
        title={t("p.delegation.title", undefined, "Delegation")}
        subtitle={t("p.delegation.subtitle", undefined, "Operations dashboard for delegation attachés")}
        breadcrumbs={[
          { label: t("p.shared.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.delegation.title", undefined, "Delegation") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.metrics.entries", undefined, "Entries")}
            value={fmt.number(entries ?? 0)}
          />
          <MetricCard
            label={t("p.delegation.metrics.visaCases", undefined, "Visa Cases")}
            value={fmt.number(visas ?? 0)}
          />
          <MetricCard label={t("p.delegation.metrics.orders", undefined, "Orders")} value={fmt.number(orders ?? 0)} />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm font-semibold">{tile.label}</div>
                {tile.count != null && <Badge variant="muted">{tile.count}</Badge>}
              </div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{tile.desc}</p>
            </Link>
          ))}
        </div>

        <section>
          <h2 className="text-sm font-semibold">{t("p.delegation.docVault.title", undefined, "Document Vault")}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(
              "p.delegation.docVault.description",
              undefined,
              "Visa packages, credentials, and delegation-specific paperwork assigned to you.",
            )}
          </p>
          <div className="surface mt-3 p-3">
            <PortalDocVault
              projectId={project?.id ?? null}
              types={["vendor_package", "safety_compliance"]}
              emptyTitle={t("p.delegation.docVault.emptyTitle", undefined, "No Documents Yet")}
              emptyDescription={t(
                "p.delegation.docVault.emptyDescription",
                undefined,
                "Visa packages and delegation paperwork submitted by you appear here. Issued credentials, travel, and lodging show up under /p/[slug]/crew/advances.",
              )}
            />
          </div>
        </section>
      </div>
    </>
  );
}
