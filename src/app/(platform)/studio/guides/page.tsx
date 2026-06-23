import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Org-wide event guides index. Shows every per-persona guide across every
 * project so producers can audit Boarding-Pass coverage and jump straight
 * to the editor. Per-project editing lives at
 * `/studio/projects/[projectId]/guides`.
 */
export default async function GuidesIndex() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.guides.eyebrow", undefined, "Knowledge")}
          title={t("console.guides.title", undefined, "Guides")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.guides.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_guides")
    .select("id, persona, project_id, updated_at, projects:project_id(name)")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false });
  const rows = (data ?? []) as Array<{
    id: string;
    persona: string;
    project_id: string;
    updated_at: string | null;
    projects: { name: string } | null;
  }>;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.guides.eyebrow", undefined, "Knowledge")}
        title={t("console.guides.title", undefined, "Guides")}
        subtitle={
          rows.length === 1
            ? t("console.guides.subtitleSingular", { count: rows.length }, `${rows.length} Guide across your projects`)
            : t("console.guides.subtitlePlural", { count: rows.length }, `${rows.length} Guides across your projects`)
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.guides.empty.title", undefined, "No Event Guides Yet")}
            description={t(
              "console.guides.empty.description",
              undefined,
              "Per-persona event guides — the Boarding Pass for crew, artists, vendors, sponsors, and guests — are authored from each project's detail page.",
            )}
            action={
              <Link className="text-sm text-[var(--p-accent)]" href="/studio/projects">
                {t("console.guides.empty.openProjects", undefined, "Open Projects →")}
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.guides.table.project", undefined, "Project")}</th>
                  <th>{t("console.guides.table.persona", undefined, "Persona")}</th>
                  <th>{t("console.guides.table.updated", undefined, "Updated")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td>{g.projects?.name ?? "—"}</td>
                    <td>
                      <Badge variant="muted">{toTitle(g.persona)}</Badge>
                    </td>
                    <td className="font-mono text-xs">
                      {g.updated_at ? new Date(g.updated_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/studio/projects/${g.project_id}/guides/${g.persona}`}
                        className="text-[var(--p-accent)] hover:underline"
                      >
                        {t("console.guides.editLink", undefined, "Edit →")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
