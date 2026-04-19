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

export const dynamic = "force-dynamic";

export default async function ArtistAdvancingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return <div className="page-content"><div className="surface p-6 text-sm">Configure Supabase.</div></div>;
  }

  const project = await projectIdFromSlug(slug);
  if (!project) notFound();

  const talentTypes = TALENT_TYPES.map((t) => t.type);
  const deliverables = await listDeliverables(project.id, talentTypes);

  const byType = talentTypes.reduce<Record<string, typeof deliverables>>((acc, t) => {
    acc[t] = deliverables.filter((d) => d.type === t);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
      <PortalRail items={portalNav(slug, "artist")} title="Artist" />
      <div className="flex-1">
        <ModuleHeader
          eyebrow={project.name}
          title="Advancing"
          subtitle="Upload riders, input lists, stage plots, guest lists, and crew manifests"
        />
        <div className="page-content space-y-6">
          <AdvancingForm slug={slug} />

          <section className="surface">
            <div className="border-b border-[var(--border-color)] px-5 py-3">
              <h2 className="text-sm font-semibold">Talent deliverables</h2>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {TALENT_TYPES.map((t) => {
                const rows = byType[t.type] ?? [];
                return (
                  <div key={t.type} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{rows.length} submission{rows.length === 1 ? "" : "s"}</div>
                      </div>
                    </div>
                    {rows.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {rows.map((d) => (
                          <li key={d.id} className="surface-inset flex items-center justify-between p-3">
                            <div>
                              <div className="text-sm">{d.title ?? labelForType(d.type)}</div>
                              <div className="text-xs text-[var(--text-muted)]">v{d.version} · submitted {timeAgo(d.submitted_at ?? d.created_at)}{d.deadline ? ` · due ${formatDate(d.deadline, "medium")}` : ""}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={d.status} />
                              {d.file_path && <Link href={`/api/v1/deliverables/${d.id}/download`} className="font-mono text-xs text-[var(--org-primary)]">Download</Link>}
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
