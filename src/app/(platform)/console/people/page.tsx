import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

// Sub-views moved out of the primary sidebar in the WAYFINDER
// remediation but kept reachable here as a tile band — they're real
// list views (Crew table, Credentials register, Offer Letters tracker)
// and removing them would lose functionality. Future work: convert
// these into Person record tabs (`/console/people/[personId]/...`).
const PEOPLE_RELATED = [
  { href: "/console/people/crew", label: "Crew", sub: "Roster + day rates" },
  { href: "/console/people/credentials", label: "Credentials", sub: "Certs + expirations" },
  { href: "/console/people/offer-letters", label: "Offer Letters", sub: "Drafts + sent + signed" },
];

type MemberRow = {
  id: string;
  role: string;
  created_at: string;
  users: { id: string; name: string | null; email: string } | null;
};

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title="Directory" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,role,created_at,users(id,name,email)")
    .eq("org_id", session.orgId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as MemberRow[];

  return (
    <>
      <ModuleHeader
        eyebrow="People"
        title="Directory"
        subtitle={`${rows.length} member${rows.length === 1 ? "" : "s"}`}
      />
      <div className="page-content">
        <DataTable<MemberRow>
          rows={rows}
          rowHref={(r) => (r.users?.id ? `/console/people/${r.users.id}` : undefined)}
          emptyLabel="No members yet"
          emptyDescription="Invite teammates from /console/settings/members."
          columns={[
            {
              key: "user",
              header: "Member",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <Avatar name={r.users?.name ?? r.users?.email ?? "?"} />
                  <div>
                    <div className="text-sm font-medium">{r.users?.name ?? "—"}</div>
                    <div className="font-mono text-xs text-[var(--text-muted)]">{r.users?.email}</div>
                  </div>
                </div>
              ),
              accessor: (r) => r.users?.name ?? r.users?.email ?? null,
            },
            {
              key: "role",
              header: "Role",
              render: (r) => <Badge variant="brand">{r.role}</Badge>,
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "since",
              header: "Member Since",
              render: (r) => timeAgo(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at,
            },
          ]}
        />
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            Related Sections
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PEOPLE_RELATED.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.sub}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
