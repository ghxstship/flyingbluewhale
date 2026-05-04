import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";

export const dynamic = "force-dynamic";

/**
 * Lead → Proposals tab. Source attribution requires a `source_lead_id`
 * column on `proposals` that doesn't exist yet — until then, this tab
 * renders the canonical empty state. The tab is wired through the
 * record-tabs layout so the user always sees it next to Activity.
 */
type Row = { id: string; title: string; status: string };

export default async function Page() {
  const rows: Row[] = [];
  return (
    <>
      <ModuleHeader eyebrow="Lead" title="Proposals" subtitle="Proposals sourced from this lead." />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Proposals"
          emptyDescription="No proposals have been generated from this lead yet. Convert the lead and send a proposal to start the trail. (A `source_lead_id` column on the proposals table is required for direct attribution.)"
          columns={[
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title },
            { key: "status", header: "Status", render: (r) => r.status, accessor: (r) => r.status },
          ]}
        />
      </div>
    </>
  );
}
