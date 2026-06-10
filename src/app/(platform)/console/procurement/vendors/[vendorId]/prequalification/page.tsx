import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatDate } from "@/lib/i18n/format";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  prequalification_state: string;
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
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("vendor_prequalifications")
    .select("id,prequalification_state,score,submitted_at,approved_at,expires_at,questionnaire_id")
    .eq("org_id", session.orgId)
    .eq("vendor_id", vendorId)
    .order("submitted_at", { ascending: false });
  const rows = (data ?? []) as Row[];

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.vendors.prequalification.eyebrow", undefined, "Vendor")}
        title={t("console.procurement.vendors.prequalification.title", undefined, "Prequalification")}
        subtitle={t(
          "console.procurement.vendors.prequalification.subtitle",
          undefined,
          "Vendor prequalification questionnaires and outcomes.",
        )}
      />
      <div className="page-content">
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/procurement/vendors/${vendorId}/prequalification/${r.id}`}
          emptyLabel={t("console.procurement.vendors.prequalification.emptyLabel", undefined, "No Prequalifications")}
          emptyDescription={t(
            "console.procurement.vendors.prequalification.emptyDescription",
            undefined,
            "This vendor has not completed any prequalification questionnaires.",
          )}
          columns={[
            {
              key: "submitted_at",
              header: t("console.procurement.vendors.prequalification.columns.submitted", undefined, "Submitted"),
              render: (r) => (
                <Link
                  href={`/console/procurement/vendors/${vendorId}/prequalification/${r.id}`}
                  className="hover:underline"
                >
                  {r.submitted_at ? formatDate(r.submitted_at) : "—"}
                </Link>
              ),
              accessor: (r) => r.submitted_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "approved_at",
              header: t("console.procurement.vendors.prequalification.columns.approved", undefined, "Approved"),
              render: (r) => (r.approved_at ? formatDate(r.approved_at) : "—"),
              accessor: (r) => r.approved_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "prequalification_state",
              header: t(
                "console.procurement.vendors.prequalification.columns.prequalification_state",
                undefined,
                "Status",
              ),
              render: (r) => (
                <Badge variant={STATUS_VARIANT[r.prequalification_state] ?? "default"}>
                  {toTitle(r.prequalification_state)}
                </Badge>
              ),
              accessor: (r) => r.prequalification_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: t("console.procurement.vendors.prequalification.columns.score", undefined, "Score"),
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
