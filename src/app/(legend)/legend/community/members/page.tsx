import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { listOrgMembers, pointsByUser } from "@/lib/db/legend-people";
import { MembersDirectory, type DirectoryMember } from "./MembersDirectory";

export const dynamic = "force-dynamic";

/**
 * /legend/community/members — the community members directory. DataView
 * (table ⇄ avatar grid) over the org roster with shared contribution points.
 */
export default async function MembersPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="LEG3ND · Community" title="Members" />
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
        eyebrow="LEG3ND · Community"
        title="Members"
        subtitle="The cohort, ranked by contribution points."
        action={
          <Link href="/legend/community" className="ps-btn ps-btn--secondary" style={{ minHeight: 44 }}>
            Back to feed
          </Link>
        }
      />
      <MembersDirectory members={rows} />
    </>
  );
}
