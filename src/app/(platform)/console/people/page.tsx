import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isAdmin as sessionIsAdmin, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { getRequestT } from "@/lib/i18n/request";

// Sub-views moved out of the primary sidebar in the WAYFINDER
// remediation but kept reachable here as a tile band — they're real
// list views (Crew table, Credentials register, Offer Letters tracker)
// and removing them would lose functionality. Future work: convert
// these into Person record tabs (`/console/people/[personId]/...`).
const PEOPLE_RELATED = [
  {
    href: "/console/people/crew",
    labelKey: "console.people.related.crew.label",
    labelDefault: "Crew",
    subKey: "console.people.related.crew.sub",
    subDefault: "Roster + day rates",
  },
  {
    href: "/console/people/credentials",
    labelKey: "console.people.related.credentials.label",
    labelDefault: "Credentials",
    subKey: "console.people.related.credentials.sub",
    subDefault: "Certs + expirations",
  },
  {
    href: "/console/people/offer-letters",
    labelKey: "console.people.related.offerLetters.label",
    labelDefault: "Offer Letters",
    subKey: "console.people.related.offerLetters.sub",
    subDefault: "Drafts + sent + signed",
  },
];

type MemberRow = {
  id: string;
  role: string;
  created_at: string;
  users: { id: string; name: string | null; email: string } | null;
};

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.people.title", undefined, "Directory")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  const isAdmin = sessionIsAdmin(session);
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("id,role,created_at,users(id,name,email)")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as MemberRow[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.eyebrow", undefined, "People")}
        title={t("console.people.title", undefined, "Directory")}
        subtitle={
          rows.length === 1
            ? t("console.people.subtitleOne", { count: rows.length }, `${rows.length} member`)
            : t("console.people.subtitleOther", { count: rows.length }, `${rows.length} members`)
        }
        action={
          isAdmin ? (
            <Button href="/console/people/invites" size="sm">
              {t("console.people.inviteMember", undefined, "+ Invite member")}
            </Button>
          ) : undefined
        }
      />
      <div className="page-content">
        <DataTable<MemberRow>
          rows={rows}
          rowHref={(r) => (r.users?.id ? `/console/people/${r.users.id}` : undefined)}
          emptyLabel={t("console.people.emptyLabel", undefined, "No members yet")}
          emptyDescription={t(
            "console.people.emptyDescription",
            undefined,
            "Invite teammates to your organization to get started.",
          )}
          emptyAction={
            isAdmin ? (
              <Button href="/console/people/invites" size="sm">
                {t("console.people.inviteMember", undefined, "+ Invite member")}
              </Button>
            ) : undefined
          }
          columns={[
            {
              key: "user",
              header: t("console.people.columns.member", undefined, "Member"),
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
              header: t("console.people.columns.role", undefined, "Role"),
              render: (r) => <Badge variant="brand">{r.role}</Badge>,
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "since",
              header: t("console.people.columns.memberSince", undefined, "Member Since"),
              render: (r) => timeAgo(r.created_at),
              className: "font-mono text-xs",
              accessor: (r) => r.created_at,
            },
          ]}
        />
        <section className="mt-8">
          <h2 className="mb-3 text-[11px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
            {t("console.people.relatedSections", undefined, "Related Sections")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {PEOPLE_RELATED.map((item) => (
              <Link key={item.href} href={item.href} className="surface hover-lift p-4">
                <div className="text-sm font-semibold">{t(item.labelKey, undefined, item.labelDefault)}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {t(item.subKey, undefined, item.subDefault)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
