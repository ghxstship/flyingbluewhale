import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { MONO_CELL_CLASS } from "@/components/views/data-view-model";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Avatar } from "@/components/ui/Avatar";
import { isManagerPlus, requireSession } from "@/lib/auth";
import { listTeams } from "@/lib/db/teams";
import { hasSupabase } from "@/lib/env";
import { timeAgo } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { CreateTeamForm } from "./CreateTeamForm";

export const dynamic = "force-dynamic";

type TeamListRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  ownerId: string | null;
  updatedAt: string;
};

export default async function TeamsPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.people.teams.eyebrow", undefined, "People")}
          title={t("console.people.teams.title", undefined, "Teams")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.teams.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const canManage = isManagerPlus(session);
  const teams = await listTeams({ orgId: session.orgId });

  const rows: TeamListRow[] = teams.map((team) => ({
    id: team.id,
    slug: team.slug,
    name: team.name,
    description: team.description,
    ownerId: team.ownerId,
    updatedAt: team.updatedAt,
  }));

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.teams.eyebrow", undefined, "People")}
        title={t("console.people.teams.title", undefined, "Teams")}
        subtitle={t(
          "console.people.teams.subtitle",
          { count: rows.length, label: rows.length === 1 ? "team" : "teams" },
          `${rows.length} team${rows.length === 1 ? "" : "s"} · addressable as @team-<slug> in mentions`,
        )}
      />
      <div className="page-content space-y-6">
        {canManage && (
          <section className="surface p-5">
            <h3 className="text-sm font-semibold">
              {t("console.people.teams.create.title", undefined, "Create Team")}
            </h3>
            <p className="mt-1 text-xs text-[var(--p-text-2)]">
              {t("console.people.teams.create.hintPrefix", undefined, "Slug becomes the @-mention handle (e.g. ")}
              <code>@team-prod</code>
              {t("console.people.teams.create.hintSuffix", undefined, "). Lowercase letters, digits, hyphens.")}
            </p>
            <div className="mt-4">
              <CreateTeamForm />
            </div>
          </section>
        )}

        {rows.length === 0 ? (
          <EmptyState
            title={t("console.people.teams.empty.title", undefined, "No Teams Yet")}
            description={
              canManage
                ? t(
                    "console.people.teams.empty.descriptionManager",
                    undefined,
                    "Create one above. Teams let you @-mention a group and grant record-level permissions to many people at once.",
                  )
                : t(
                    "console.people.teams.empty.descriptionMember",
                    undefined,
                    "Ask an admin or manager to create teams for your org.",
                  )
            }
          />
        ) : (
          <DataView<TeamListRow>
            rows={rows}
            rowHref={(r) => `/studio/people/teams/${r.id}`}
            emptyLabel={t("console.people.teams.table.emptyLabel", undefined, "No teams")}
            columns={[
              {
                key: "team",
                header: t("console.people.teams.table.columnTeam", undefined, "Team"),
                render: (r) => (
                  <div className="flex items-center gap-2">
                    <Avatar name={r.name} />
                    <div>
                      <div className="text-sm font-medium">{r.name}</div>
                      <div className={`${MONO_CELL_CLASS} text-[var(--p-text-2)]`}>@team-{r.slug}</div>
                    </div>
                  </div>
                ),
                accessor: (r) => r.name,
                sortable: true,
              },
              {
                key: "description",
                header: t("console.people.teams.table.columnDescription", undefined, "Description"),
                render: (r) => <span className="text-xs text-[var(--p-text-2)]">{r.description ?? "—"}</span>,
                accessor: (r) => r.description ?? "",
              },
              {
                key: "slug",
                header: t("console.people.teams.table.columnMention", undefined, "Mention"),
                render: (r) => <Badge variant="muted">@team-{r.slug}</Badge>,
                accessor: (r) => r.slug,
                filterable: true,
              },
              {
                key: "updated",
                header: t("console.people.teams.table.columnUpdated", undefined, "Updated"),
                render: (r) => timeAgo(r.updatedAt),
                mono: true,
                accessor: (r) => r.updatedAt,
                sortable: true,
              },
            ]}
          />
        )}

        <section className="surface p-4 text-xs text-[var(--p-text-2)]">
          {t(
            "console.people.teams.footer.prefix",
            undefined,
            "Need to grant record-level access? Open a record and use ",
          )}
          <em>{t("console.people.teams.footer.share", undefined, "Share")}</em>
          {t(
            "console.people.teams.footer.middle",
            undefined,
            " to add a Team (or individual user) with a SmartSuite-style role: viewer · commenter · assignee · contributor · editor · full.",
          )}{" "}
          <Link href="/studio/settings/audit" className="underline">
            {t("console.people.teams.footer.auditLog", undefined, "Audit log")}
          </Link>{" "}
          {t("console.people.teams.footer.suffix", undefined, "tracks every grant.")}
        </section>
      </div>
    </>
  );
}
