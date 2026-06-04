import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { awardResponse } from "./actions";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";

type ResponseRow = {
  id: string;
  vendor: { name: string | null } | null;
  response_state: string;
  total_cents: number | null;
  submitted_at: string | null;
};

export const dynamic = "force-dynamic";

const STATE_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  viewed: "info",
  responded: "info",
  no_bid: "muted",
  withdrawn: "muted",
  awarded: "success",
  declined: "error",
};

export default async function Page({ params }: { params: Promise<{ reqId: string }> }) {
  const { reqId } = await params;
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();

  const { data: req } = await supabase
    .from("requisitions")
    .select("id, title, description, estimated_cents")
    .eq("org_id", session.orgId)
    .eq("id", reqId)
    .maybeSingle();
  if (!req) notFound();

  const { data: responses } = await supabase
    .from("rfq_responses")
    .select("*, vendor:vendor_id(name)")
    .eq("requisition_id", reqId)
    .order("total_cents", { ascending: true, nullsFirst: false });

  const all = responses ?? [];
  const responded = all.filter((r) => r.response_state === "responded" || r.response_state === "awarded");
  const lowest = responded.reduce(
    (lo, r) => (r.total_cents != null && (lo == null || r.total_cents < lo) ? r.total_cents : lo),
    null as number | null,
  );
  const awardedRow = all.find((r) => r.response_state === "awarded");

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.requisitions.leveling.eyebrow", undefined, "Procurement")}
        breadcrumbs={[
          {
            label: t("console.procurement.requisitions.leveling.breadcrumbs.requisitions", undefined, "Requisitions"),
            href: "/console/procurement/requisitions",
          },
          { label: req.title, href: `/console/procurement/requisitions/${reqId}` },
          { label: t("console.procurement.requisitions.leveling.breadcrumbs.leveling", undefined, "Leveling") },
        ]}
        title={t(
          "console.procurement.requisitions.leveling.title",
          { title: req.title },
          `Bid leveling — ${req.title}`,
        )}
        subtitle={`${all.length} ${all.length === 1 ? t("console.procurement.requisitions.leveling.responseSingular", undefined, "Response") : t("console.procurement.requisitions.leveling.responsePlural", undefined, "Responses")} · ${responded.length} ${t("console.procurement.requisitions.leveling.priced", undefined, "Priced")} · ${t("console.procurement.requisitions.leveling.estLabel", undefined, "est.")} ${formatMoney(req.estimated_cents ?? 0)}`}
        action={
          <Button href={`/console/procurement/requisitions/${reqId}/leveling/new`} size="sm">
            {t("console.procurement.requisitions.leveling.addResponse", undefined, "+ Add response")}
          </Button>
        }
      />
      <div className="page-content">
        <DataTable<ResponseRow>
          rows={all as unknown as ResponseRow[]}
          emptyLabel={t("console.procurement.requisitions.leveling.emptyLabel", undefined, "No Bid Responses")}
          emptyDescription={t(
            "console.procurement.requisitions.leveling.emptyDescription",
            undefined,
            "No bid responses yet. Invite vendors to bid from the requisition detail.",
          )}
          columns={[
            {
              key: "vendor",
              header: t("console.procurement.requisitions.leveling.columns.vendor", undefined, "Vendor"),
              render: (r) => r.vendor?.name ?? "—",
              accessor: (r) => r.vendor?.name ?? "",
              sortable: true,
            },
            {
              key: "response_state",
              header: t("console.procurement.requisitions.leveling.columns.state", undefined, "State"),
              render: (r) => (
                <Badge variant={STATE_TONE[r.response_state] ?? "muted"}>{toTitle(r.response_state)}</Badge>
              ),
              accessor: (r) => r.response_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "total_cents",
              header: t("console.procurement.requisitions.leveling.columns.total", undefined, "Total"),
              render: (r) => (r.total_cents != null ? formatMoney(Number(r.total_cents)) : "—"),
              accessor: (r) => (r.total_cents != null ? Number(r.total_cents) : 0),
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "delta",
              header: t("console.procurement.requisitions.leveling.columns.delta", undefined, "Δ vs lowest"),
              render: (r) => {
                const total = r.total_cents == null ? null : Number(r.total_cents);
                const delta = total != null && lowest != null ? total - lowest : null;
                return delta != null && delta > 0 ? `+${formatMoney(delta)}` : "—";
              },
              accessor: (r) => {
                const total = r.total_cents == null ? null : Number(r.total_cents);
                return total != null && lowest != null ? total - lowest : 0;
              },
              tabular: true,
              sortable: true,
              className: "text-right",
              headerClassName: "text-right",
            },
            {
              key: "submitted_at",
              header: t("console.procurement.requisitions.leveling.columns.submitted", undefined, "Submitted"),
              render: (r) => (r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : "—"),
              accessor: (r) => r.submitted_at ?? "",
              mono: true,
              sortable: true,
            },
            {
              key: "actions",
              header: "",
              render: (r) =>
                !awardedRow && r.response_state === "responded" ? (
                  <form action={awardResponse.bind(null, reqId, r.id)}>
                    <button
                      type="submit"
                      className="hover-lift rounded border border-[var(--border-color)] px-2 py-1 text-[11px]"
                    >
                      {t("console.procurement.requisitions.leveling.award", undefined, "Award")}
                    </button>
                  </form>
                ) : null,
            },
          ]}
        />
      </div>
    </>
  );
}
