import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Entry = {
  id: string;
  participant_name: string;
  discipline: string | null;
  event: string | null;
  status: string;
  delegation: { name: string | null; code: string | null } | null;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  draft: "muted",
  submitted: "info",
  approved: "success",
  rejected: "error",
  withdrawn: "warning",
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.delegation.entries.eyebrowShort", undefined, "Portal")}
          title={t("p.delegation.entries.title", undefined, "Entries")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.delegation.entries.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("delegation_entries")
    .select("id, participant_name, discipline, event, status, delegation:delegation_id(name, code)")
    .eq("org_id", session.orgId)
    .order("participant_name", { ascending: true });

  const rows = ((data ?? []) as unknown as Entry[]) ?? [];
  const submitted = rows.filter((r) => r.status === "submitted").length;
  const approved = rows.filter((r) => r.status === "approved").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.delegation.entries.eyebrow", undefined, "Portal · Delegation")}
        title={t("p.delegation.entries.title", undefined, "Entries")}
        subtitle={
          rows.length === 1
            ? t(
                "p.delegation.entries.subtitle.one",
                { count: rows.length, approved },
                `${rows.length} entry · ${approved} Approved`,
              )
            : t(
                "p.delegation.entries.subtitle.other",
                { count: rows.length, approved },
                `${rows.length} entries · ${approved} Approved`,
              )
        }
        breadcrumbs={[
          { label: t("p.delegation.entries.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          {
            label: t("p.delegation.entries.breadcrumb.delegation", undefined, "Delegation"),
            href: `/p/${slug}/delegation`,
          },
          { label: t("p.delegation.entries.breadcrumb.entries", undefined, "Entries") },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("p.delegation.entries.metric.approved", undefined, "Approved")}
            value={fmt.number(approved)}
            accent
          />
          <MetricCard
            label={t("p.delegation.entries.metric.submitted", undefined, "Submitted")}
            value={fmt.number(submitted)}
          />
          <MetricCard
            label={t("p.delegation.entries.metric.total", undefined, "Total")}
            value={fmt.number(rows.length)}
          />
        </div>

        <DataTable<Entry>
          rows={rows}
          emptyLabel={t("p.delegation.entries.empty.label", undefined, "No entries yet")}
          emptyDescription={t(
            "p.delegation.entries.empty.description",
            undefined,
            "Submit athletes against published disciplines and events. Entries flow into accreditation and start lists once approved.",
          )}
          columns={[
            {
              key: "name",
              header: t("p.delegation.entries.col.participant", undefined, "Participant"),
              render: (r) => r.participant_name,
              accessor: (r) => r.participant_name,
            },
            {
              key: "discipline",
              header: t("p.delegation.entries.col.discipline", undefined, "Discipline"),
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            {
              key: "event",
              header: t("p.delegation.entries.col.event", undefined, "Event"),
              render: (r) => r.event ?? "—",
              accessor: (r) => r.event ?? null,
            },
            {
              key: "delegation",
              header: t("p.delegation.entries.col.delegation", undefined, "Delegation"),
              render: (r) => r.delegation?.code ?? "—",
              accessor: (r) => r.delegation?.code ?? null,
            },
            {
              key: "status",
              header: t("p.delegation.entries.col.status", undefined, "Status"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
