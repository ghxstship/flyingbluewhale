export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { money } from "@/components/detail/DetailShell";
import { getRequestT } from "@/lib/i18n/request";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const { t } = await getRequestT();
  const session = await requireSession();
  const supabase = await createClient();
  const [{ data: project }, { data: crew }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .eq("id", projectId)
      .maybeSingle(),
    // Project-scoped crew comes from crew_members where any assignment
    // metadata references this project. In the current schema crew is
    // org-scoped; the project association is via events/tasks/time
    // entries. We show every crew member + a hint on their relationship
    // to this project.
    supabase.from("crew_members").select("id, name, role, email, day_rate_cents").order("name"),
  ]);
  return (
    <>
      <ModuleHeader
        eyebrow={project?.name ?? t("console.projects.crew.eyebrowFallback", undefined, "Project")}
        title={t("console.projects.crew.title", undefined, "Crew")}
        subtitle={
          (crew?.length ?? 0) === 1
            ? t("console.projects.crew.subtitleOne", { count: crew?.length ?? 0 }, `${crew?.length ?? 0} Roster Member`)
            : t(
                "console.projects.crew.subtitleOther",
                { count: crew?.length ?? 0 },
                `${crew?.length ?? 0} Roster Members`,
              )
        }
        breadcrumbs={[
          { label: t("console.projects.crew.breadcrumbProjects", undefined, "Projects"), href: "/console/projects" },
          {
            label: project?.name ?? t("console.projects.crew.eyebrowFallback", undefined, "Project"),
            href: `/console/projects/${projectId}`,
          },
          { label: t("console.projects.crew.title", undefined, "Crew") },
        ]}
      />
      <div className="page-content max-w-5xl">
        {!crew || crew.length === 0 ? (
          <EmptyState
            title={t("console.projects.crew.emptyTitle", undefined, "No Crew in the Roster")}
            description={t(
              "console.projects.crew.emptyDescription",
              undefined,
              "Import crew via CSV from People → Crew or add members individually.",
            )}
          />
        ) : (
          <table className="ps-table w-full text-sm">
            <thead>
              <tr>
                <th>{t("console.projects.crew.columnName", undefined, "Name")}</th>
                <th>{t("console.projects.crew.columnRole", undefined, "Role")}</th>
                <th>{t("console.projects.crew.columnEmail", undefined, "Email")}</th>
                <th>{t("console.projects.crew.columnDayRate", undefined, "Day rate")}</th>
              </tr>
            </thead>
            <tbody>
              {crew.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/console/people/crew/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.role ?? "—"}</td>
                  <td className="text-[var(--p-text-2)]">{c.email ?? "—"}</td>
                  <td className="font-mono text-xs">{money(c.day_rate_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
