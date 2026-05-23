import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { DataTable } from "@/components/DataTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Entries" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
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
        eyebrow="Portal · Delegation"
        title="Entries"
        subtitle={`${rows.length} entr${rows.length === 1 ? "y" : "ies"} · ${approved} Approved`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Delegation", href: `/p/${slug}/delegation` },
          { label: "Entries" },
        ]}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Approved" value={fmt.number(approved)} accent />
          <MetricCard label="Submitted" value={fmt.number(submitted)} />
          <MetricCard label="Total" value={fmt.number(rows.length)} />
        </div>

        <DataTable<Entry>
          rows={rows}
          emptyLabel="No entries yet"
          emptyDescription="Submit athletes against published disciplines and events. Entries flow into accreditation and start lists once approved."
          columns={[
            {
              key: "name",
              header: "Participant",
              render: (r) => r.participant_name,
              accessor: (r) => r.participant_name,
            },
            {
              key: "discipline",
              header: "Discipline",
              render: (r) => r.discipline ?? "—",
              accessor: (r) => r.discipline ?? null,
              filterable: true,
              groupable: true,
            },
            { key: "event", header: "Event", render: (r) => r.event ?? "—", accessor: (r) => r.event ?? null },
            {
              key: "delegation",
              header: "Delegation",
              render: (r) => r.delegation?.code ?? "—",
              accessor: (r) => r.delegation?.code ?? null,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>,
              filterable: true,
              groupable: true,
              accessor: (r) => r.status.replace ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
