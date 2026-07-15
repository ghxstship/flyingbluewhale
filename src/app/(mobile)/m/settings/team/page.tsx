import Link from "next/link";
import { requireSession, isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { TeamAdmin, type MemberRow } from "./TeamAdmin";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Team — the first admin surface in the field app.
 *
 * Until now the mobile shell had exactly ONE role gate (`isManagerPlus`)
 * and **no `isAdmin`/`isOwner` call site at all** (audit S1/G18). Owner and
 * admin were indistinguishable from manager on the device, so an owner
 * standing on site could do nothing administrative — not invite the
 * contractor who just turned up, not fix the role of someone who can't see
 * their own shift. This is the first gate of its kind on the field app.
 *
 * Deliberately a THIN CALLER. Invite and role-change are the most
 * security-sensitive writes in the product, and the console's actions
 * already carry the hard-won guards: the isAdmin gate, the cross-org
 * project check, the self-edit refusal, the last-owner guard, optimistic
 * concurrency, and an explicit audit emit. Reimplementing any of that "for
 * mobile" is how a second, subtly weaker authorization path gets born —
 * which is the exact failure this whole audit keeps finding. So the field
 * calls the same functions the desk does.
 *
 * Scope is the two things that are actually urgent on site. Billing, seats,
 * branding and integrations stay console-only by decision (KIT_CANON).
 */
export default async function TeamPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return <div className="screen">{t("common.configureSupabase", undefined, "Configure Supabase.")}</div>;
  }

  const session = await requireSession();
  const admin = isAdmin(session);

  // Hiding is UX; the actions re-check server-side. A manager reaching this
  // by URL gets the honest refusal rather than a blank screen.
  if (!admin) {
    return (
      <div className="screen screen-anim">
        <div className="scr-eye">{t("m.team.eyebrow", undefined, "Workspace")}</div>
        <h1 className="scr-h" style={{ marginBottom: 12 }}>
          {t("m.team.title", undefined, "Team")}
        </h1>
        <EmptyState
          size="compact"
          title={t("m.team.noAccessTitle", undefined, "Owners And Admins Only")}
          description={t(
            "m.team.noAccessBody",
            undefined,
            "Inviting people and changing roles is limited to owners and admins.",
          )}
          action={
            <Link href="/m/more" className="ps-btn ps-btn--secondary">
              {t("m.team.back", undefined, "Back")}
            </Link>
          }
        />
      </div>
    );
  }

  const supabase = await createClient();

  // `updated_at` rides along: the console's role change uses it for
  // optimistic concurrency and refuses a stale write. The field is the most
  // likely place to hold a stale screen, so this matters more here.
  const { data } = await supabase
    .from("memberships")
    .select("user_id, role, updated_at, users:users(id, name, email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("role", { ascending: true })
    .limit(200);

  const members: MemberRow[] = (data ?? []).map((m) => {
    const u = m.users as { name: string | null; email: string | null } | null;
    return {
      userId: m.user_id as string,
      name: u?.name ?? u?.email ?? "—",
      email: u?.email ?? "",
      role: m.role as string,
      updatedAt: m.updated_at as string,
      isSelf: (m.user_id as string) === session.userId,
    };
  });

  const owners = members.filter((m) => m.role === "owner").length;

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">
        {members.length === 1
          ? t("m.team.eyebrowOne", undefined, "1 Member")
          : t("m.team.eyebrowCount", { count: members.length }, `${members.length} Members`)}
      </div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.team.title", undefined, "Team")}
      </h1>

      <Link
        href="/m/settings/team/invite"
        className="ps-btn ps-btn--cta ps-btn--lg"
        style={{ width: "100%", justifyContent: "center", marginBottom: 12, textDecoration: "none" }}
      >
        <KIcon name="UserPlus" size={16} /> {t("m.team.invite", undefined, "Invite Someone")}
      </Link>

      <TeamAdmin
        members={members}
        ownerCount={owners}
        labels={{
          you: t("m.team.you", undefined, "You"),
          change: t("m.team.change", undefined, "Change Role"),
          cancel: t("m.team.cancel", undefined, "Cancel"),
          save: t("m.team.save", undefined, "Save"),
          selfNote: t("m.team.selfNote", undefined, "Use the leave-org flow to change your own role."),
          lastOwner: t("m.team.lastOwner", undefined, "The only owner can't be demoted. Promote someone first."),
        }}
      />
    </div>
  );
}
