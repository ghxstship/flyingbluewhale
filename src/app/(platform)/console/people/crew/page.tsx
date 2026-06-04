import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
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
  const rows = await listOrgScoped("crew_members", session.orgId, { orderBy: "name", ascending: true });
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.people.crew.eyebrow", undefined, "People")}
        title={t("console.people.crew.title", undefined, "Crew")}
        subtitle={
          rows.length === 1
            ? t("console.people.crew.subtitleSingular", { count: rows.length }, `${rows.length} Crew Member`)
            : t("console.people.crew.subtitlePlural", { count: rows.length }, `${rows.length} Crew Members`)
        }
        action={
          <Button href="/console/people/crew/new">{t("console.people.crew.addCrew", undefined, "+ Add Crew")}</Button>
        }
      />
      <div className="page-content">
        <DataTable<CrewMember>
          rows={rows}
          rowHref={(r) => `/console/people/crew/${r.id}`}
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
        <div className="mt-4 text-xs text-[var(--text-muted)]">
          {t("console.people.crew.manageCertsPrompt", undefined, "Need to manage certifications?")}{" "}
          <Link href="/console/people/credentials" className="text-[var(--org-primary)]">
            {t("console.people.crew.openCredentials", undefined, "Open credentials →")}
          </Link>
        </div>
      </div>
    </>
  );
}
