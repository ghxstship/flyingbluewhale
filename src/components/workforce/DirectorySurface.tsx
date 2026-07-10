import { EmptyState } from "@/components/ui/EmptyState";
import { MobileListRow } from "@/components/mobile/MobileListRow";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Shared org directory surface (ADR-0008 Move 1).
 *
 * Same query + render across COMPVSS (`/m/directory`) and the portal
 * crew persona (`/p/[slug]/crew/directory`). Org-scoped roster — the
 * crew variant currently shows the full org because project-scoped
 * filtering needs project_members data the portal layout doesn't yet
 * thread through. Future enhancement: accept an optional projectId
 * prop to filter to `project_members.project_id = projectId`.
 */

type Member = {
  id: string;
  email: string;
  name: string | null;
};

export async function DirectorySurface({
  variant,
  eyebrowLabel,
  titleLabel,
}: {
  variant: "mobile" | "portal";
  eyebrowLabel?: string;
  titleLabel?: string;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("common.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  const session = await requireSession();
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("user_id, role, users:users!inner(id, email, name)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null);

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
        {t("m.directory.peopleCount", { count: members.length }, `${members.length} people in your org`)}
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
