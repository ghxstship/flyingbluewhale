import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { PortalRail } from "@/components/Shell";
import { portalNav, portalPersonaForSession } from "@/lib/nav";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Portal-wide announcements feed. Reuses the org-wide `announcements`
 * table (migration 0046) with no portal-specific schema additions — any
 * `published_state='published'` announcement scoped to the project's
 * org with audience in {all, contractors, vendors} reaches portal
 * recipients. Internal-only audiences (admins, crew) stay hidden.
 *
 * Per-persona surfacing: this index lives at `/p/[slug]/announcements`
 * and each persona index links to it from its rail.
 */

type Row = {
  id: string;
  title: string;
  body: string;
  audience: string;
  pinned: boolean;
  published_at: string | null;
};

const PORTAL_AUDIENCES = ["all", "contractors", "vendors"];

export default async function PortalAnnouncementsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="page-content">{t("p.shared.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }
  const { slug } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const project = await projectIdFromSlug(slug);

  // Project scope (ADR-0008): this portal's project only — matching the
  // FeedSurface-based crew/vendor feeds. Without the filter a portal user at
  // one project saw every org-wide portal-audience announcement.
  const { data } = project
    ? await supabase
        .from("announcements")
        .select("id, title, body, audience, pinned, published_at")
        .eq("org_id", session.orgId)
        .eq("publish_state", "published")
        .eq("project_id", project.id)
        .is("deleted_at", null)
        .in("audience", PORTAL_AUDIENCES)
        .order("pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(50)
    : { data: [] };
  const rows = (data ?? []) as Row[];

  return (
    <div className="flex">
      <PortalRail
        group={portalNav(slug, portalPersonaForSession(session.persona))}
        title={t("p.shared.rail.title", undefined, "Portal")}
      />
      <div className="flex-1">
        <div className="page-content">
          <h1>{t("p.shared.announcements.title", undefined, "Updates")}</h1>
          <p className="mt-1 text-xs text-[var(--p-text-2)]">
            {t(
              "p.shared.announcements.subtitle",
              {
                count: rows.length,
                project: project?.name ?? t("p.shared.announcements.thisProject", undefined, "this project"),
              },
              "Broadcasts from the production team. {count} active for {project}.",
            )}
          </p>

          <ul className="mt-5 space-y-3">
            {rows.length === 0 ? (
              <li>
                <EmptyState
                  size="compact"
                  title={t("p.shared.announcements.empty.title", undefined, "No Updates")}
                  description={t(
                    "p.shared.announcements.empty.description",
                    undefined,
                    "Production-team broadcasts will appear here as they're published.",
                  )}
                />
              </li>
            ) : (
              rows.map((a) => (
                <li key={a.id} className="surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {a.pinned && (
                        <Badge variant="warning">{t("p.shared.announcements.pinned", undefined, "Pinned")}</Badge>
                      )}
                      <Badge variant="muted">{toTitle(a.audience)}</Badge>
                    </div>
                    <span className="font-mono text-xs text-[var(--p-text-2)]">
                      {a.published_at ? fmt.date(a.published_at) : ""}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-semibold">{a.title}</h2>
                  <p className="mt-1 text-xs whitespace-pre-wrap text-[var(--p-text-2)]">{a.body}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
