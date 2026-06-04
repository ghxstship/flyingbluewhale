import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { Playbook } from "@/lib/supabase/types";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<Playbook["status"], "muted" | "success" | "warning"> = {
  draft: "muted",
  published: "success",
  archived: "warning",
};

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.safety.playbooks.eyebrow", undefined, "Safety")}
          title={t("console.safety.playbooks.title", undefined, "Playbooks")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.safety.playbooks.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const rows = (await listOrgScoped("playbooks", session.orgId, {
    orderBy: "updated_at",
    ascending: false,
    limit: 500,
  })) as Playbook[];

  const published = rows.filter((r) => r.status === "published").length;

  // Aggregate by kind
  const byKind = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.kind] = (acc[r.kind] ?? 0) + 1;
    return acc;
  }, {});
  const kindEntries = Object.entries(byKind).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.safety.playbooks.eyebrow", undefined, "Safety")}
        title={t("console.safety.playbooks.title", undefined, "Playbooks")}
        subtitle={
          rows.length === 1
            ? t(
                "console.safety.playbooks.subtitleSingular",
                { count: rows.length, published },
                `${rows.length} Playbook · ${published} Published`,
              )
            : t(
                "console.safety.playbooks.subtitlePlural",
                { count: rows.length, published },
                `${rows.length} Playbooks · ${published} Published`,
              )
        }
        action={
          <Button href="/console/safety/playbooks/new" size="sm">
            {t("console.safety.playbooks.newCta", undefined, "+ New Playbook")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {kindEntries.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">{t("console.safety.playbooks.byKind", undefined, "By Kind")}</h3>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-3">
              {kindEntries.map(([kind, count]) => (
                <li key={kind} className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">{kind}</span>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <DataTable<Playbook>
          rows={rows}
          emptyLabel={t("console.safety.playbooks.emptyLabel", undefined, "No playbooks authored")}
          emptyDescription={t(
            "console.safety.playbooks.emptyDescription",
            undefined,
            "ConOps playbooks render in the Guide layout. Author one per scenario — crisis comms, evacuation, weather hold, dignitary visit.",
          )}
          emptyAction={
            <Button href="/console/safety/playbooks/new" size="sm">
              {t("console.safety.playbooks.newCta", undefined, "+ New Playbook")}
            </Button>
          }
          columns={[
            {
              key: "title",
              header: t("console.safety.playbooks.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "slug",
              header: t("console.safety.playbooks.col.slug", undefined, "Slug"),
              render: (r) => <span className="font-mono text-xs">{r.slug}</span>,
              accessor: (r) => r.slug ?? null,
            },
            {
              key: "kind",
              header: t("console.safety.playbooks.col.kind", undefined, "Kind"),
              render: (r) => <Badge variant="muted">{toTitle(r.kind)}</Badge>,
              accessor: (r) => r.kind ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "version",
              header: t("console.safety.playbooks.col.version", undefined, "Version"),
              render: (r) => <span className="font-mono text-xs">v{r.version}</span>,
              accessor: (r) => r.version ?? null,
            },
            {
              key: "status",
              header: t("console.safety.playbooks.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status]}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "updated_at",
              header: t("console.safety.playbooks.col.updated", undefined, "Updated"),
              render: (r) => <span className="font-mono text-xs">{r.updated_at?.slice(0, 10)}</span>,
              accessor: (r) => r.updated_at?.slice ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
