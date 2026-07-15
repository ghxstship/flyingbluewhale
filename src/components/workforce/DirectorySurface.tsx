import { EmptyState } from "@/components/ui/EmptyState";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Shared directory surface (ADR-0008 Move 1).
 *
 * Same render across COMPVSS (`/m/directory`) and the portal crew/vendor
 * personas (`/p/[slug]/{crew,vendor}/directory`), but NOT the same scope:
 *
 *   • `/m` (no projectId) — the full org roster. COMPVSS is an internal
 *     workforce app; every caller is an org member and co-member visibility
 *     is the intended model.
 *   • `/p/[slug]` (projectId required) — the roster of THAT PROJECT only,
 *     via `project_members`. Portal personas are ordinary `memberships` rows
 *     in the org, so an external contractor mapped to `vendor` renders this
 *     too. Without the project filter they read every org member's name +
 *     email, which RLS permits (`memberships_select` allows any org member;
 *     `users_select_self` allows any co-member) and therefore will not catch.
 *     ADR-0008 specified a "project-scoped roster"; org-wide was the
 *     implementation drifting from its own spec. Fixed 2026-07-15.
 *
 * `projectId` is required on the portal variant at the type level, so a new
 * portal directory page cannot forget it and silently widen the audience.
 */

type Member = {
  id: string;
  email: string;
  name: string | null;
};

type DirectoryProps =
  | { variant: "mobile"; projectId?: never; eyebrowLabel?: string; titleLabel?: string }
  | { variant: "portal"; projectId: string; eyebrowLabel?: string; titleLabel?: string };

export async function DirectorySurface({ variant, projectId, eyebrowLabel, titleLabel }: DirectoryProps) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  // Portal: resolve the project's roster first and let it gate the query. An
  // empty roster must render an empty directory, never fall through to the
  // org-wide list — `.in("user_id", [])` returns nothing, which is the correct
  // and safe degenerate case.
  let projectUserIds: string[] | null = null;
  if (projectId) {
    const { data: projectMembers } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);
    projectUserIds = (projectMembers ?? []).map((m) => m.user_id as string);
  }

  let query = supabase
    .from("memberships")
    .select("user_id, role, users:users!inner(id, email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);
  if (projectUserIds) query = query.in("user_id", projectUserIds);
  const { data: memberships } = await query;

  const members = (
    (memberships ?? []) as unknown as Array<{
      user_id: string;
      role: string;
      users: Member | null;
    }>
  )
    .map((m) => ({ role: m.role, user: m.users }))
    .filter((m): m is { role: string; user: Member } => !!m.user)
    .sort((a, b) => (a.user.name ?? a.user.email).localeCompare(b.user.name ?? b.user.email));

  const containerClass = variant === "mobile" ? "px-4 pt-6 pb-24" : "page-content";
  const eyebrow = eyebrowLabel ?? (variant === "mobile" ? t("m.directory.eyebrow", undefined, "Mobile") : "Crew");
  const title = titleLabel ?? t("m.directory.title", undefined, "Directory");

  return (
    <div className={containerClass}>
      <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">{eyebrow}</div>
      <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {projectId
          ? t(
              "p.directory.peopleCount",
              { count: members.length },
              `${members.length} people on this project`,
            )
          : t("m.directory.peopleCount", { count: members.length }, `${members.length} people in your org`)}
      </p>

      <ul className="mt-5 space-y-2">
        {members.length === 0 ? (
          <li className="py-4">
            <EmptyState
              size="compact"
              title={t("m.directory.empty.title", undefined, "No Members")}
              description={t("m.directory.empty.description", undefined, "Org members appear here once added.")}
            />
          </li>
        ) : (
          members.map(({ role, user }) => (
            <li key={user.id}>
              <MobileListRow
                title={user.name ?? user.email}
                meta={<span className="font-mono text-[11px]">{user.email}</span>}
                trailing={<span className="font-mono text-[11px] text-[var(--p-text-2)] uppercase">{role}</span>}
              />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
