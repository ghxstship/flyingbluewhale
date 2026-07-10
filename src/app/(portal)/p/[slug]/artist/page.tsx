import Link from "next/link";
import { notFound } from "next/navigation";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PortalDocVault } from "@/components/portal/PortalDocVault";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ArtistHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) notFound();
  const project = await projectIdFromSlug(slug);
  if (!project) notFound();
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();

  // Live counts — the viewer's own advancing docs on this project, plus
  // any of them sitting in "changes requested".
  const [{ count: advancingDocs }, { count: changesRequested }, { count: openAssignments }] = await Promise.all([
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
    supabase
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("org_id", session.orgId)
      .eq("project_id", project.id)
      .eq("party_user_id", session.userId)
      .is("deleted_at", null)
      .not("fulfillment_state", "in", "(delivered,rejected,redeemed,voided,expired,returned)"),
  ]);

  const attention: Array<{ href: string; label: string }> = [];
  if ((changesRequested ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/artist/advancing`,
      label: t(
        "p.artist.home.attention.revisions",
        { count: changesRequested ?? 0 },
        `${changesRequested} advancing item${(changesRequested ?? 0) === 1 ? "" : "s"} with changes requested`,
      ),
    });
  }
  if ((openAssignments ?? 0) > 0) {
    attention.push({
      href: `/p/${slug}/crew/advances`,
      label: t(
        "p.artist.home.attention.assignments",
        { count: openAssignments ?? 0 },
        `${openAssignments} open item${(openAssignments ?? 0) === 1 ? "" : "s"} assigned to you`,
      ),
    });
  }

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "artist")} />
      <div className="min-w-0 flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.artist.home.title", undefined, "Artist Portal")}
          subtitle={t(
            "p.artist.home.subtitle",
            undefined,
            "Submit riders, input lists, catering, travel, and schedule",
          )}
        />
        <div className="page-content space-y-4">
          {attention.length > 0 && (
            <div className="surface-inset rounded-[var(--p-r-md)] p-4">
              <div className="text-xs font-semibold tracking-wider text-[var(--p-text-2)] uppercase">
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {([
              {
                href: `/p/${slug}/artist/advancing`,
                label: t("p.artist.home.advancing.label", undefined, "Advancing"),
                desc: t(
                  "p.artist.home.advancing.desc",
                  undefined,
                  "Technical rider · hospitality · stage plot · guest list",
                ),
                count: advancingDocs,
              },
              {
                href: `/p/${slug}/artist/catering`,
                label: t("p.artist.home.catering.label", undefined, "Catering"),
                desc: t("p.artist.home.catering.desc", undefined, "Meals, dietary preferences, green room"),
              },
              {
                href: `/p/${slug}/artist/venue`,
                label: t("p.artist.home.venue.label", undefined, "Venue"),
                desc: t("p.artist.home.venue.desc", undefined, "Load-in, power, dimensions"),
              },
              {
                href: `/p/${slug}/artist/schedule`,
                label: t("p.artist.home.schedule.label", undefined, "Schedule"),
                desc: t("p.artist.home.schedule.desc", undefined, "Show day timing"),
              },
              {
                href: `/p/${slug}/artist/travel`,
                label: t("p.artist.home.travel.label", undefined, "Travel"),
                desc: t("p.artist.home.travel.desc", undefined, "Flights, hotel, ground transport"),
              },
            ] as Array<{ href: string; label: string; desc: string; count?: number | null }>).map((item) => (
              <Link key={item.href} href={item.href} className="surface hover-lift p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.count != null && <Badge variant="muted">{item.count}</Badge>}
                </div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">{item.desc}</div>
              </Link>
            ))}
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold">{t("p.artist.home.vault.title", undefined, "Document Vault")}</h2>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t(
                "p.artist.home.vault.description",
                undefined,
                "Riders, stage plots, and input lists you've submitted or had assigned to you.",
              )}
            </p>
            <div className="surface mt-3 p-3">
              <PortalDocVault
                projectId={project.id}
                types={["technical_rider", "hospitality_rider", "input_list", "stage_plot"]}
                emptyTitle={t("p.artist.home.vault.emptyTitle", undefined, "No Documents Yet")}
                emptyDescription={t(
                  "p.artist.home.vault.emptyDescription",
                  undefined,
                  "Once you submit a rider or have one assigned, it appears here.",
                )}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
