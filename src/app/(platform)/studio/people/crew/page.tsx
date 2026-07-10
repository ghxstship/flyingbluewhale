import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScopedWithCount } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { CrewMember } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const { t } = await getRequestT();
  if (!hasSupabase)
    return (
      <>
        <ModuleHeader title={t("console.people.crew.title", undefined, "Crew")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.people.crew.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  const session = await requireSession();
  // Exact count alongside the capped window (F-01) — subtitle + truncation
  // indicator stay honest past the 100-row cap.
  const { rows, totalCount } = await listOrgScopedWithCount("crew_members", session.orgId, {
    orderBy: "name",
    ascending: true,
  });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.crew.eyebrow", undefined, "People")}
        title={t("console.people.crew.title", undefined, "Crew")}
        subtitle={
          totalCount === 1
            ? t("console.people.crew.subtitleSingular", { count: totalCount }, `${totalCount} Crew Member`)
            : t("console.people.crew.subtitlePlural", { count: totalCount }, `${totalCount} Crew Members`)
        }
        action={
          <Button href="/studio/people/crew/new">{t("console.people.crew.addCrew", undefined, "+ Add Crew")}</Button>
        }
      />
      <div className="page-content">
        <DataTable<CrewMember>
          rows={rows}
          totalCount={totalCount}
          rowHref={(r) => `/studio/people/crew/${r.id}`}
          columns={[
            {
              key: "name",
              header: t("console.people.crew.col.name", undefined, "Name"),
              render: (r) => r.name,
              accessor: (r) => r.name,
            },
            {
              key: "role",
              header: t("console.people.crew.col.role", undefined, "Role"),
              render: (r) => r.role ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.role ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "email",
              header: t("console.people.crew.col.email", undefined, "Email"),
              render: (r) => r.email ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.email ?? null,
            },
            {
              key: "phone",
              header: t("console.people.crew.col.phone", undefined, "Phone"),
              render: (r) => r.phone ?? "—",
              className: "font-mono text-xs",
              accessor: (r) => r.phone ?? null,
            },
            {
              key: "rate",
              header: t("console.people.crew.col.dayRate", undefined, "Day Rate"),
              render: (r) => formatMoney(r.day_rate_cents),
              className: "font-mono text-xs",
              accessor: (r) => Number(r.day_rate_cents ?? 0),
            },
          ]}
        />
        <div className="mt-4 text-xs text-[var(--p-text-2)]">
          {t("console.people.crew.manageCertsPrompt", undefined, "Need to manage certifications?")}{" "}
          <Link href="/studio/people/credentials" className="text-[var(--p-accent)]">
            {t("console.people.crew.openCredentials", undefined, "Open credentials →")}
          </Link>
          {/* B-24: cross-links between the three people directories. */}{" "}
          {t("console.people.crew.otherDirectoriesPrompt", undefined, "Looking for someone else?")}{" "}
          <Link href="/studio/people" className="text-[var(--p-accent)]">
            {t("console.people.crew.openPeople", undefined, "Team members →")}
          </Link>{" "}
          <Link href="/studio/workforce" className="text-[var(--p-accent)]">
            {t("console.people.crew.openWorkforce", undefined, "Workforce directory →")}
          </Link>
        </div>
      </div>
    </>
  );
}
