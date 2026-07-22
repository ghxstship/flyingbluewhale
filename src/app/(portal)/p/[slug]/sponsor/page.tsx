import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function SponsorHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();

  // Live counts — the viewer's own submitted docs on this project, plus
  // any of them sitting in "changes requested".
  const [{ count: assets }, { count: changesRequested }] = await Promise.all([
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .eq("submitted_by", session.userId)
      .is("deleted_at", null),
    supabase
      .from("deliverables")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .eq("submitted_by", session.userId)
      .eq("fulfillment_state", "revision_requested")
      .is("deleted_at", null),
  ]);

  const attention: Array<{ href: string; label: string }> = [];
  if ((changesRequested ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/sponsor/assets`,
      label: t(
        "p.sponsor.home.attention.revisions",
        { count: changesRequested ?? 0 },
        `${changesRequested} asset${(changesRequested ?? 0) === 1 ? "" : "s"} with changes requested`,
      ),
    });
  }

  const tiles: Array<{ href: string; label: string; desc: string; count?: number | null }> = [
    {
      href: `/p/${slug}/sponsor/activations`,
      label: t("p.sponsor.home.activations.label", undefined, "Activations"),
      desc: t("p.sponsor.home.activations.desc", undefined, "Track deliverables and site placements"),
    },
    {
      href: `/p/${slug}/sponsor/assets`,
      label: t("p.sponsor.home.assets.label", undefined, "Assets"),
      desc: t("p.sponsor.home.assets.desc", undefined, "Upload brand assets"),
      count: assets,
    },
    {
      href: `/p/${slug}/sponsor/reporting`,
      label: t("p.sponsor.home.reporting.label", undefined, "Reporting"),
      desc: t("p.sponsor.home.reporting.desc", undefined, "Impressions and engagement"),
    },
  ];

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "sponsor")} />
      <div className="min-w-0 flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.sponsor.home.title", undefined, "Sponsor Portal")}
          subtitle={t("p.sponsor.home.subtitle", undefined, "Activations, brand assets, reporting")}
        />
        <div className="page-content space-y-4">
          {attention.length > 0 && (
            <div className="surface-inset rounded-[var(--p-r-md)] p-4">
              <div className="eyebrow">
                {t("p.shared.home.attention", undefined, "Needs your attention")}
              </div>
              <ul className="mt-2 space-y-1">
                {attention.map((a) => (
                  <li key={a.href + a.label}>
                    <Link href={a.href} className="text-sm font-medium text-[var(--p-accent-text)] underline">
                      {a.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {tiles.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{tile.label}</div>
                  {tile.count != null && <Badge variant="muted">{tile.count}</Badge>}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{tile.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
