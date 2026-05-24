import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  status: string;
  score: number | null;
  submitted_at: string | null;
  approved_at: string | null;
  expires_at: string | null;
  questionnaire_id: string;
};

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  approved: "success",
  approved_conditional: "success",
  rejected: "error",
  expired: "error",
  invited: "info",
  in_progress: "info",
  submitted: "info",
};

export default async function Page({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendor_prequalifications")
    .select("id,status,score,submitted_at,approved_at,expires_at,questionnaire_id")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("submitted_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow="Vendor"
        title="Prequalification"
        subtitle="Vendor prequalification questionnaires and outcomes."
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          emptyLabel="No Prequalifications"
          emptyDescription="This vendor has not completed any prequalification questionnaires."
          columns={[
            {
              key: "submitted_at",
              header: "Submitted",
              render: (r) => (r.submitted_at ? formatDate(r.submitted_at) : "—"),
              accessor: (r) => r.submitted_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "approved_at",
              header: "Approved",
              render: (r) => (r.approved_at ? formatDate(r.approved_at) : "—"),
              accessor: (r) => r.approved_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <Badge variant={STATUS_VARIANT[r.status] ?? "default"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: "Score",
              render: (r) => (r.score != null ? r.score : "—"),
              accessor: (r) => r.score ?? 0,
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
          ]}
        />
      </div>
    </>
  );
}
