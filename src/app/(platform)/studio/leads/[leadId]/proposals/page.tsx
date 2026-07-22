import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * Lead → Proposals tab. Source attribution requires a `source_lead_id`
 * column on `proposals` that doesn't exist yet — until then, this tab
 * renders the canonical empty state. The tab is wired through the
 * record-tabs layout so the user always sees it next to Activity.
 */
type Row = { id: string; title: string; status: string };

export default async function Page() {
  const { t } = await getRequestT();
  const rows: Row[] = [];
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.leads.proposals.eyebrow", undefined, "Lead")}
        title={t("console.leads.proposals.title", undefined, "Proposals")}
        subtitle={t("console.leads.proposals.subtitle", undefined, "Proposals sourced from this lead.")}
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          emptyLabel={t("console.leads.proposals.emptyLabel", undefined, "No Proposals")}
          emptyDescription={t(
            "console.leads.proposals.emptyDescription",
            undefined,
            "No proposals have been generated from this lead yet. Convert the lead and send a proposal to start the trail. (A `source_lead_id` column on the proposals table is required for direct attribution.)",
          )}
          columns={[
            {
              key: "title",
              header: t("console.leads.proposals.columns.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
            },
            {
              key: "status",
              header: t("console.leads.proposals.columns.status", undefined, "Status"),
              render: (r) => r.status,
              accessor: (r) => r.status,
            },
          ]}
        />
      </div>
    </>
  );
}
