import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { CATALOG_KINDS, CATALOG_KIND_LABEL, listProjectAssignments, type CatalogKind } from "@/lib/db/assignments";

export const dynamic = "force-dynamic";

/**
 * /console/projects/[projectId]/advancing/assignments — per-individual
 * catalog assignment admin. Operators assign tickets, credentials,
 * catering, radios, tools, equipment, uniforms, travel, lodging, and
 * vehicles to specific people on the project. One table (`assignments`),
 * one lifecycle (`fulfillment_state`), one set of UI controls — the same
 * row shows up on the assignee's portal (/p/[slug]/crew/advances) and
 * field (/m/advances) surfaces.
 */

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.projects.advancing.assignments.eyebrow", undefined, "Advancing")}
          title={t("console.projects.advancing.assignments.title", undefined, "Individual Assignments")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.projects.advancing.assignments.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  const rows = await listProjectAssignments(session.orgId, projectId);

  // Hydrate party names across all three kinds in parallel.
  const userIds = Array.from(new Set(rows.filter((r) => r.party_user_id).map((r) => r.party_user_id!)));
  const crewIds = Array.from(new Set(rows.filter((r) => r.party_crew_id).map((r) => r.party_crew_id!)));
  const extIds = Array.from(new Set(rows.filter((r) => r.party_external_id).map((r) => r.party_external_id!)));
  const [userRes, crewRes, extRes] = await Promise.all([
    userIds.length ? supabase.from("users").select("id, email, name").in("id", userIds) : Promise.resolve({ data: [] }),
    crewIds.length ? supabase.from("crew_members").select("id, name").in("id", crewIds) : Promise.resolve({ data: [] }),
    extIds.length
      ? supabase.from("assignment_external_holders").select("id, holder_name, holder_email").in("id", extIds)
      : Promise.resolve({ data: [] }),
  ]);
  const userMap = new Map<string, string>(
    ((userRes.data ?? []) as Array<{ id: string; name: string | null; email: string }>).map((u) => [
      u.id,
      u.name ?? u.email,
    ]),
  );
  const crewMap = new Map<string, string>(
    ((crewRes.data ?? []) as Array<{ id: string; name: string }>).map((c) => [c.id, c.name]),
  );
  const extMap = new Map<string, string>(
    ((extRes.data ?? []) as Array<{ id: string; holder_name: string | null; holder_email: string | null }>).map((e) => [
      e.id,
      e.holder_name ?? e.holder_email ?? t("console.projects.advancing.assignments.guest", undefined, "Guest"),
    ]),
  );

  function partyLabel(r: (typeof rows)[number]): string {
    if (r.party_kind === "user" && r.party_user_id)
      return (
        userMap.get(r.party_user_id) ??
        t("console.projects.advancing.assignments.unknownUser", undefined, "Unknown user")
      );
    if (r.party_kind === "crew_member" && r.party_crew_id)
      return (
        crewMap.get(r.party_crew_id) ??
        t("console.projects.advancing.assignments.unknownCrew", undefined, "Unknown crew")
      );
    if (r.party_kind === "external_holder" && r.party_external_id)
      return extMap.get(r.party_external_id) ?? t("console.projects.advancing.assignments.guest", undefined, "Guest");
    return t("console.projects.advancing.assignments.unassigned", undefined, "Unassigned");
  }

  const byKind = new Map<CatalogKind, typeof rows>();
  for (const r of rows) {
    const list = byKind.get(r.catalog_kind) ?? [];
    list.push(r);
    byKind.set(r.catalog_kind, list);
  }

  return (
    <>
      <ModuleHeader
        eyebrow={project.name as string}
        title={t("console.projects.advancing.assignments.title", undefined, "Individual Assignments")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.projects.advancing.assignments.assignmentSingular", undefined, "Assignment") : t("console.projects.advancing.assignments.assignmentPlural", undefined, "Assignments")} · ${t("console.projects.advancing.assignments.subtitleKinds", undefined, "Tickets, Credentials, Catering, Radios, Tools, Equipment, Uniforms, Travel, Lodging, Vehicles")}`}
        action={
          <Button href={`/console/projects/${projectId}/advancing/assignments/new`} size="sm">
            {t("console.projects.advancing.assignments.newAssignment", undefined, "+ New Assignment")}
          </Button>
        }
      />
      <div className="page-content">
        {rows.length === 0 ? (
          <EmptyState
            title={t("console.projects.advancing.assignments.emptyTitle", undefined, "No Assignments Yet")}
            description={t(
              "console.projects.advancing.assignments.emptyDescription",
              undefined,
              "Whatever you assign here lands on the assignee's portal and mobile views in real time.",
            )}
            action={
              <Button href={`/console/projects/${projectId}/advancing/assignments/new`} size="sm">
                {t("console.projects.advancing.assignments.newAssignment", undefined, "+ New Assignment")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {CATALOG_KINDS.filter((k) => byKind.has(k)).map((kind) => {
              const items = byKind.get(kind) ?? [];
              return (
                <section key={kind} className="surface p-4">
                  <h2 className="text-sm font-semibold">
                    {CATALOG_KIND_LABEL[kind]} <span className="text-[var(--p-text-2)]">· {items.length}</span>
                  </h2>
                  <table className="ps-table mt-3 w-full text-sm">
                    <thead>
                      <tr>
                        <th>{t("console.projects.advancing.assignments.columns.title", undefined, "Title")}</th>
                        <th>{t("console.projects.advancing.assignments.columns.party", undefined, "Party")}</th>
                        <th>{t("console.projects.advancing.assignments.columns.state", undefined, "State")}</th>
                        <th>{t("console.projects.advancing.assignments.columns.due", undefined, "Due")}</th>
                        <th>{t("console.projects.advancing.assignments.columns.updated", undefined, "Updated")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => (
                        <tr key={r.id}>
                          <td>
                            <a
                              className="underline-offset-2 hover:underline"
                              href={`/console/projects/${projectId}/advancing/assignments/${r.id}`}
                            >
                              {r.title ?? t("console.projects.advancing.assignments.untitled", undefined, "Untitled")}
                            </a>
                          </td>
                          <td>
                            {r.party_kind === "external_holder" ? (
                              <Badge variant="warning">{partyLabel(r)}</Badge>
                            ) : (
                              partyLabel(r)
                            )}
                          </td>
                          <td>
                            <StatusBadge status={r.fulfillment_state} />
                          </td>
                          <td className="font-mono text-xs">{r.deadline ? fmt.date(r.deadline) : "—"}</td>
                          <td className="font-mono text-xs text-[var(--p-text-2)]">{fmt.date(r.updated_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
