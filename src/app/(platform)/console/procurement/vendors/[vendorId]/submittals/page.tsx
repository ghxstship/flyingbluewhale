import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  code: string;
  title: string;
  spec_section: string | null;
  status: string;
  created_at: string;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  approved: "success",
  rejected: "error",
  draft: "info",
  submitted: "info",
  in_review: "info",
};

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("submittals")
    .select("id,code,title,spec_section,status,created_at")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Vendor"
        title="Submittals"
        subtitle="Drawings, specs, and product data submitted by this vendor."
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/submittals/${r.id}`}
          emptyLabel="No Submittals"
          emptyDescription="This vendor has not submitted any documentation yet."
          columns={[
            { key: "code", header: "Code", render: (r) => r.code, accessor: (r) => r.code, mono: true, sortable: true },
            { key: "title", header: "Title", render: (r) => r.title, accessor: (r) => r.title, sortable: true },
            {
              key: "spec_section",
              header: "Spec",
              render: (r) => r.spec_section ?? "—",
              accessor: (r) => r.spec_section ?? "",
              mono: true,
              filterable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{r.status}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
