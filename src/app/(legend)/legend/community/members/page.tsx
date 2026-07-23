import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgMembers, pointsByUser } from "@/lib/db/legend-people";
import { MembersDirectory, type DirectoryMember } from "./MembersDirectory";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /legend/community/members — the community members directory. DataView
 * (table ⇄ avatar grid) over the org roster with shared contribution points.
 */
export default async function MembersPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.legend.community.eyebrow", undefined, "LEG3ND · Community")}
          title={t("console.legend.community.members", undefined, "Members")}
        />
        <ConfigureSupabase />
      </>
    );
  }
  const session = await requireSession();
  const [members, points] = await Promise.all([listOrgMembers(session.orgId), pointsByUser(session.orgId)]);

  const rows: DirectoryMember[] = members
    .map((m) => ({ id: m.id, name: m.name, avatar_url: m.avatar_url, role: m.role, points: points.get(m.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.legend.community.eyebrow", undefined, "LEG3ND · Community")}
        title={t("console.legend.community.members", undefined, "Members")}
        subtitle={t("console.legend.community.membersSubtitle", undefined, "The cohort, ranked by contribution points.")}
        action={
          <Link href="/legend/community" className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
            {t("console.legend.community.backToFeed", undefined, "Back to feed")}
          </Link>
        }
      />
      <MembersDirectory members={rows} />
    </>
  );
}
