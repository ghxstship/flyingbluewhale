import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  email: string;
  name: string | null;
};

export default async function MobileDirectoryPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">
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

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">
        {t("m.directory.eyebrow", undefined, "Mobile")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.directory.title", undefined, "Directory")}</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {t("m.directory.peopleCount", { count: members.length }, `${members.length} people in your org`)}
      </p>

      <ul className="mt-5 divide-y divide-[var(--border-color)]">
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
            <li key={user.id} className="flex items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{user.name ?? user.email}</div>
                <div className="truncate font-mono text-[11px] text-[var(--text-muted)]">{user.email}</div>
              </div>
              <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">{role}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
