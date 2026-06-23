export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { getRequestT } from "@/lib/i18n/request";
import { createClient } from "@/lib/supabase/server";
import type { ProjectRole } from "@/lib/supabase/types";
import { AddMemberForm, MemberRow, type Candidate, type MemberRowData } from "./MembersClient";

export default async function Page({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", projectId)
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!project) notFound();

  // Project members joined with the user record for display.
  const { data: rawMembers } = await supabase
    .from("project_members")
    .select("user_id, role, users(email, name)")
    .eq("project_id", projectId)
    .order("created_at");
  type RawMember = { user_id: string; role: ProjectRole; users: { email: string; name: string | null } | null };
  const members: MemberRowData[] = ((rawMembers ?? []) as unknown as RawMember[]).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    email: m.users?.email ?? "—",
    name: m.users?.name ?? null,
  }));

  // Candidate pool: every org member NOT already on this project.
  const { data: rawCandidates } = await supabase
    .from("memberships")
    .select("user_id, users(email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  type RawCand = { user_id: string; users: { email: string; name: string | null } | null };
  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates: Candidate[] = ((rawCandidates ?? []) as unknown as RawCand[])
    .filter((c) => !memberIds.has(c.user_id))
    .map((c) => ({
      user_id: c.user_id,
      email: c.users?.email ?? "—",
      name: c.users?.name ?? null,
    }))
    .sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));

  const isAdmin = isManagerPlus(session);

  return (
    <>
      <ModuleHeader
        eyebrow={project.name}
        title={t("console.projects.members.title", undefined, "Members")}
        subtitle={
          members.length === 1
            ? t("console.projects.members.subtitleOne", { count: members.length }, `${members.length} Project Member`)
            : t(
                "console.projects.members.subtitleOther",
                { count: members.length },
                `${members.length} Project Members`,
              )
        }
        breadcrumbs={[
          { label: t("console.projects.breadcrumb", undefined, "Projects"), href: "/studio/projects" },
          { label: project.name, href: `/studio/projects/${projectId}` },
          { label: t("console.projects.members.title", undefined, "Members") },
        ]}
      />
      <div className="page-content max-w-4xl space-y-6">
        {!isAdmin && (
          <div className="surface p-4 text-sm text-[var(--p-text-2)]">
            {t(
              "console.projects.members.viewOnlyNotice",
              undefined,
              "You can view this roster but only owners, admins, and managers can change it.",
            )}
          </div>
        )}
        {isAdmin && <AddMemberForm projectId={projectId} candidates={candidates} />}
        {members.length === 0 ? (
          <EmptyState
            title={t("console.projects.members.emptyTitle", undefined, "No Project Members")}
            description={t(
              "console.projects.members.emptyDescription",
              undefined,
              "Org admins and managers have full access by default. Add members here to grant per-project access to other org members.",
            )}
          />
        ) : (
          <div className="surface overflow-hidden">
            <table className="ps-table w-full text-sm">
              <thead>
                <tr>
                  <th>{t("console.projects.members.colMember", undefined, "Member")}</th>
                  <th className="w-40">{t("console.projects.members.colRole", undefined, "Role")}</th>
                  <th className="w-32 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <MemberRow key={m.user_id} projectId={projectId} member={m} currentUserId={session.userId} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
