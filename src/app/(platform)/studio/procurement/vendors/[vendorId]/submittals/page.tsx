import { ModuleHeader } from "@/components/Shell";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  spec_section: string | null;
  submittal_state: string;
  created_at: string;
};

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const { t } = await getRequestT();
  const supabase = await createClient();
  const { data } = await supabase
    .from("submittals")
    .select("id,code,title,spec_section,submittal_state,created_at")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.submittals.eyebrow", undefined, "Vendor")}
        title={t("console.procurement.vendors.submittals.title", undefined, "Submittals")}
        subtitle={t(
          "console.procurement.vendors.submittals.subtitle",
          undefined,
          "Drawings, specs, and product data submitted by this vendor.",
        )}
      />
      <div className="page-content">
        <DataView<Row>
          rows={rows}
          rowHref={(r) => `/studio/submittals/${r.id}`}
          emptyLabel={t("console.procurement.vendors.submittals.emptyLabel", undefined, "No Submittals")}
          emptyDescription={t(
            "console.procurement.vendors.submittals.emptyDescription",
            undefined,
            "This vendor has not submitted any documentation yet.",
          )}
          columns={[
            {
              key: "code",
              header: t("console.procurement.vendors.submittals.col.code", undefined, "Code"),
              render: (r) => r.code,
              accessor: (r) => r.code,
              mono: true,
              sortable: true,
            },
            {
              key: "title",
              header: t("console.procurement.vendors.submittals.col.title", undefined, "Title"),
              render: (r) => r.title,
              accessor: (r) => r.title,
              sortable: true,
            },
            {
              key: "spec_section",
              header: t("console.procurement.vendors.submittals.col.spec", undefined, "Spec"),
              render: (r) => r.spec_section ?? "—",
              accessor: (r) => r.spec_section ?? "",
              mono: true,
              filterable: true,
            },
            {
              key: "submittal_state",
              header: t("console.procurement.vendors.submittals.col.submittal_state", undefined, "Status"),
              render: (r) => <StatusBadge status={r.submittal_state} />,
              accessor: (r) => r.submittal_state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
