import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { awardBadge, deleteBadge } from "./actions";
import { DeleteForm } from "@/components/DeleteForm";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Award = { id: string; user_id: string; note: string | null; awarded_at: string };

export default async function Page({ params }: { params: Promise<{ badgeId: string }> }) {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return <div className="page-content">{t("console.configureSupabase", undefined, "Configure Supabase.")}</div>;
  const { badgeId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const { data: badge } = await supabase
    .from("badges")
    .select("id, code, name, description, icon, created_at")
    .eq("id", badgeId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!badge) notFound();
  const b = badge as {
    id: string;
    code: string;
    name: string;
    description: string | null;
    icon: string | null;
    created_at: string;
  };

  const [{ data: awards }, { data: members }] = await Promise.all([
    supabase
      .from("badge_awards")
      .select("id, user_id, note, awarded_at")
      .eq("badge_id", badgeId)
      .order("awarded_at", { ascending: false })
      .limit(100),
    supabase
      .from("memberships")
      .select("user_id, users:users!inner(id, email, name)")
      .eq("org_id", session.orgId)
      .is("deleted_at", null),
  ]);

  const awardList = (awards ?? []) as Award[];
  const memberList = (
    (members ?? []) as unknown as Array<{
      user_id: string;
      users: { id: string; email: string; name: string | null } | null;
    }>
  )
    .map((m) => m.users)
    .filter((u): u is { id: string; email: string; name: string | null } => !!u);
  const memberMap = new Map(memberList.map((m) => [m.id, m.name ?? m.email]));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.workforce.badges.detail.eyebrow", undefined, "Badge")}
        title={`${b.icon ?? "🏅"} ${b.name}`}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{b.code}</Badge>
            <span className="font-mono text-xs">
              {t(
                "console.workforce.badges.detail.awardedMany",
                { count: awardList.length },
                `${awardList.length} awarded`,
              )}
            </span>
          </span>
        }
        action={
          <DeleteForm
            action={deleteBadge.bind(null, b.id)}
            confirm={t(
              "console.workforce.badges.detail.deleteConfirm",
              undefined,
              "Hard-delete this badge? All award history will also be removed.",
            )}
          />
        }
      />
      <div className="page-content max-w-3xl space-y-4">
        {b.description && <div className="surface p-4 text-sm text-[var(--p-text-2)]">{b.description}</div>}

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">
            {t("console.workforce.badges.detail.awardThis", undefined, "Award This Badge")}
          </h2>
          <form action={awardBadge} className="mt-3 space-y-2">
            <input type="hidden" name="badgeId" value={b.id} />
            <select name="user_id" required className="ps-input w-full">
              {memberList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? m.email}
                </option>
              ))}
            </select>
            <textarea
              name="note"
              rows={2}
              maxLength={300}
              placeholder={t(
                "console.workforce.badges.detail.notePlaceholder",
                undefined,
                "Why this person earned it · optional",
              )}
              className="ps-input w-full"
            />
            <button type="submit" className="ps-btn ps-btn--sm">
              {t("console.workforce.badges.detail.award", undefined, "Award")}
            </button>
          </form>
        </section>

        <section className="surface p-4">
          <h2 className="text-sm font-semibold">
            {t("console.workforce.badges.detail.recentAwards", undefined, "Recent Awards")}
          </h2>
          {awardList.length === 0 ? (
            <div className="mt-2">
              <EmptyState
                size="compact"
                title={t("console.workforce.badges.detail.noAwardsTitle", undefined, "No awards yet")}
                description={t(
                  "console.workforce.badges.detail.noAwardsDescription",
                  undefined,
                  "Award this badge from the form above.",
                )}
              />
            </div>
          ) : (
            <ul className="mt-3 space-y-2">
              {awardList.map((a) => (
                <li key={a.id} className="flex items-start justify-between text-xs">
                  <div>
                    <div className="font-semibold">
                      {memberMap.get(a.user_id) ?? t("console.workforce.badges.detail.unknown", undefined, "Unknown")}
                    </div>
                    {a.note && <p className="text-[var(--p-text-2)]">{a.note}</p>}
                  </div>
                  <span className="font-mono text-[10px] text-[var(--p-text-2)]">
                    {new Date(a.awarded_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
