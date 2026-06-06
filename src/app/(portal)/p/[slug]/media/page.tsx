import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
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
          eyebrow={t("p.shared.eyebrow", undefined, "Portal")}
          title={t("p.media.title", undefined, "Media")}
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
  const [{ count: kbCount }] = await Promise.all([
    supabase.from("kb_articles").select("id", { count: "exact", head: true }).eq("org_id", session.orgId),
  ]);

  const tiles = [
    {
      href: `/p/${slug}/media/info`,
      label: t("p.media.tiles.info.label", undefined, "Info on Demand"),
      desc: t("p.media.tiles.info.desc", undefined, "Project briefings, fact sheets, biographies"),
    },
    {
      href: `/p/${slug}/media/pressconf`,
      label: t("p.media.tiles.pressconf.label", undefined, "Press Conferences"),
      desc: t("p.media.tiles.pressconf.desc", undefined, "Schedule and RSVP"),
    },
    {
      href: `/p/${slug}/media/services`,
      label: t("p.media.tiles.services.label", undefined, "Media Services"),
      desc: t("p.media.tiles.services.desc", undefined, "Studios, mixed zones, working areas"),
    },
    {
      href: `/p/${slug}/media/transport`,
      label: t("p.media.tiles.transport.label", undefined, "Transport"),
      desc: t("p.media.tiles.transport.desc", undefined, "Media Shuttle — T2"),
    },
    {
      href: `/p/${slug}/media/accommodation`,
      label: t("p.media.tiles.accommodation.label", undefined, "Accommodation"),
      desc: t("p.media.tiles.accommodation.desc", undefined, "Media hotel allocations"),
    },
  ];

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.shared.eyebrow", undefined, "Portal")}
        title={t("p.media.title", undefined, "Media")}
        subtitle={t("p.media.subtitle", undefined, "Working areas, services, and editorial info for accredited media")}
        breadcrumbs={[
          { label: t("p.shared.eyebrow", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.media.title", undefined, "Media") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.media.metrics.infoArticles", undefined, "Info Articles")}
            value={fmt.number(kbCount ?? 0)}
          />
          <MetricCard
            label={t("p.media.metrics.status", undefined, "Status")}
            value={t("p.media.metrics.statusLive", undefined, "Live")}
            accent
          />
          <MetricCard
            label={t("p.media.metrics.lastUpdated", undefined, "Last Updated")}
            value={t("p.media.metrics.today", undefined, "today")}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
              <div className="text-sm font-semibold">{tile.label}</div>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{tile.desc}</p>
            </Link>
          ))}
        </div>

        <section>
          <h2 className="text-sm font-semibold">{t("p.media.docVault.title", undefined, "Document Vault")}</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t(
              "p.media.docVault.description",
              undefined,
              "Credentials and editorial collateral assigned to you for this project.",
            )}
          </p>
          <div className="surface mt-3 p-3">
            <PortalDocVault
              projectId={project?.id ?? null}
              types={["vendor_package", "comms_plan"]}
              emptyTitle={t("p.media.docVault.emptyTitle", undefined, "No Documents Yet")}
              emptyDescription={t(
                "p.media.docVault.emptyDescription",
                undefined,
                "Press packages submitted by you appear here. Issued press credentials show up under /p/[slug]/crew/advances.",
              )}
            />
          </div>
        </section>
      </div>
    </>
  );
}
