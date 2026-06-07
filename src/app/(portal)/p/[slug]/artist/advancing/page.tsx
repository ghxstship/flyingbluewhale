import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader, PortalRail } from "@/components/Shell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { portalNav } from "@/lib/nav";
import { hasSupabase } from "@/lib/env";
import { listDeliverables, projectIdFromSlug, TALENT_TYPES, labelForType } from "@/lib/db/advancing";
import { AdvancingForm } from "./AdvancingForm";
import { formatDate } from "@/lib/i18n/format";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

export default async function ArtistAdvancingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="page-content">
        <div className="surface p-6 text-sm">
          {t("p.artist.advancing.configureSupabase", undefined, "Configure Supabase.")}
        </div>
      </div>
    );
  }

  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const talentTypes = TALENT_TYPES.map((tt) => tt.type);
  const deliverables = await listDeliverables(project.id, talentTypes);

  const byType = talentTypes.reduce<Record<string, typeof deliverables>>((acc, tt) => {
    acc[tt] = deliverables.filter((d) => d.type === tt);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
      <PortalRail group={portalNav(slug, "artist")} />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title={t("p.artist.advancing.title", undefined, "Advancing")}
          subtitle={t(
            "p.artist.advancing.subtitle",
            undefined,
            "Upload riders, input lists, stage plots, guest lists, and crew manifests",
          )}
        />
        <div className="page-content space-y-6">
          <AdvancingForm slug={slug} />

          <section className="surface">
            <div className="border-b border-[var(--p-border)] px-5 py-3">
              <h2 className="text-sm font-semibold">
                {t("p.artist.advancing.deliverables.title", undefined, "Talent Deliverables")}
              </h2>
            </div>
            <div className="divide-y divide-[var(--p-border)]">
              {TALENT_TYPES.map((tt) => {
                const rows = byType[tt.type] ?? [];
                return (
                  <div key={tt.type} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{tt.label}</div>
                        <div className="text-xs text-[var(--p-text-2)]">
                          {rows.length === 1
                            ? t(
                                "p.artist.advancing.deliverables.submissionCount.one",
                                { count: rows.length },
                                `${rows.length} submission`,
                              )
                            : t(
                                "p.artist.advancing.deliverables.submissionCount.other",
                                { count: rows.length },
                                `${rows.length} submissions`,
                              )}
                        </div>
                      </div>
                    </div>
                    {rows.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {rows.map((d) => (
                          <li key={d.id} className="surface-inset flex items-center justify-between p-3">
                            <div>
                              <div className="text-sm">{d.title ?? labelForType(d.type)}</div>
                              <div className="text-xs text-[var(--p-text-2)]">
                                {t(
                                  "p.artist.advancing.deliverables.versionSubmitted",
                                  { version: d.version, time: timeAgo(d.submitted_at ?? d.created_at) },
                                  `v${d.version} · submitted ${timeAgo(d.submitted_at ?? d.created_at)}`,
                                )}
                                {d.deadline
                                  ? t(
                                      "p.artist.advancing.deliverables.dueSuffix",
                                      { date: formatDate(d.deadline, "medium") },
                                      ` · due ${formatDate(d.deadline, "medium")}`,
                                    )
                                  : ""}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={d.fulfillment_state} />
                              {d.file_path && (
                                <Link
                                  href={`/api/v1/deliverables/${d.id}/download`}
                                  className="font-mono text-xs text-[var(--p-accent)]"
                                >
                                  {t("common.download", undefined, "Download")}
                                </Link>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
