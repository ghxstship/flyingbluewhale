import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";
import { DataView } from "@/components/views/DataViewServer";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo, toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type RfqRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
  awarded_to_vendor_id: string | null;
};

type ResponseRow = {
  id: string;
  response_state: string;
  total_cents: number | null;
  notes: string | null;
  submitted_at: string | null;
  awarded_at: string | null;
  vendor_id: string | null;
  vendor: { name: string | null } | null;
};

export default async function RfqResponsesPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.procurement.rfqs.responses.eyebrow", undefined, "Procurement")}
          title={t("console.procurement.rfqs.responses.titleFallback", undefined, "RFQ Responses")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.procurement.rfqs.responses.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: rfqData } = await supabase
    .from("rfqs")
    .select("id, title, status:rfq_state, due_at, awarded_to_vendor_id")
    .eq("id", rfqId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  const rfq = rfqData as RfqRow | null;
  if (!rfq) notFound();

  const { data: respData } = await supabase
    .from("rfq_responses")
    .select("id, response_state, total_cents, notes, submitted_at, awarded_at, vendor_id, vendor:vendor_id(name)")
    .eq("org_id", session.orgId)
    .eq("requisition_id", rfqId)
    .order("submitted_at", { ascending: false, nullsFirst: false });
  const responses = (respData ?? []) as unknown as ResponseRow[];

  const submitted = responses.filter((r) => r.response_state === "responded" || r.response_state === "awarded");
  const bidsWithTotal = submitted.filter((r) => r.total_cents != null);
  const lowest = bidsWithTotal.length ? Math.min(...bidsWithTotal.map((r) => r.total_cents ?? 0)) : null;
  const average = bidsWithTotal.length
    ? bidsWithTotal.reduce((s, r) => s + (r.total_cents ?? 0), 0) / bidsWithTotal.length
    : null;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.procurement.rfqs.responses.eyebrow", undefined, "Procurement")}
        title={t("console.procurement.rfqs.responses.title", undefined, "Responses")}
        subtitle={
          <span className="font-mono text-xs">
            {rfq.title} · {responses.length}{" "}
            {responses.length === 1
              ? t("console.procurement.rfqs.responses.responseSingular", undefined, "response")
              : t("console.procurement.rfqs.responses.responsePlural", undefined, "responses")}
          </span>
        }
        breadcrumbs={[
          {
            label: t("console.procurement.rfqs.responses.breadcrumbProcurement", undefined, "Procurement"),
            href: "/studio/procurement",
          },
          {
            label: t("console.procurement.rfqs.responses.breadcrumbRfqs", undefined, "RFQs"),
            href: "/studio/procurement/rfqs",
          },
          { label: rfq.title, href: `/studio/procurement/rfqs/${rfqId}` },
          { label: t("console.procurement.rfqs.responses.breadcrumbResponses", undefined, "Responses") },
        ]}
        action={<Badge variant="muted">{toTitle(rfq.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.procurement.rfqs.responses.metricSubmitted", undefined, "Submitted")}
            value={String(submitted.length)}
          />
          <MetricCard
            label={t("console.procurement.rfqs.responses.metricLowestBid", undefined, "Lowest Bid")}
            value={lowest != null ? formatMoney(lowest) : "—"}
            accent={lowest != null}
          />
          <MetricCard
            label={t("console.procurement.rfqs.responses.metricAvgBid", undefined, "Avg Bid")}
            value={average != null ? formatMoney(Math.round(average)) : "—"}
          />
        </div>

        <DataView<ResponseRow>
          rows={responses}
          emptyLabel={t("console.procurement.rfqs.responses.emptyLabel", undefined, "No Responses Yet")}
          emptyDescription={t(
            "console.procurement.rfqs.responses.emptyDescription",
            undefined,
            "Vendors invited to this RFQ appear here once they view, bid, or decline. Use the public RFQ link (or invite vendors via requisitions) to start collecting responses.",
          )}
          columns={[
            {
              key: "vendor",
              header: t("console.procurement.rfqs.responses.colVendor", undefined, "Vendor"),
              render: (r) => (
                <Link href={`/studio/procurement/rfqs/${rfqId}/responses/${r.id}`} className="hover:underline">
                  {r.vendor?.name ?? "—"}
                </Link>
              ),
              accessor: (r) => r.vendor?.name ?? null,
            },
            {
              key: "response_state",
              header: t("console.procurement.rfqs.responses.colState", undefined, "Status"),
              render: (r) => <Badge variant={toneFor(r.response_state)}>{toTitle(r.response_state)}</Badge>,
              accessor: (r) => r.response_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "total",
              header: t("console.procurement.rfqs.responses.colTotal", undefined, "Total"),
              render: (r) => (r.total_cents != null ? formatMoney(r.total_cents) : "—"),
              accessor: (r) => Number(r.total_cents ?? 0),
              mono: true,
              tabular: true,
              total: "min",
              totalFormat: { style: "money", dashWhenNotPositive: true },
            },
            {
              key: "submitted",
              header: t("console.procurement.rfqs.responses.colSubmitted", undefined, "Submitted"),
              render: (r) => (r.submitted_at ? timeAgo(r.submitted_at) : "—"),
              accessor: (r) => r.submitted_at ?? null,
              mono: true,
            },
            {
              key: "awarded",
              header: t("console.procurement.rfqs.responses.colAwarded", undefined, "Awarded"),
              render: (r) => (r.awarded_at ? timeAgo(r.awarded_at) : "—"),
              accessor: (r) => r.awarded_at ?? null,
              mono: true,
            },
            {
              key: "notes",
              header: t("console.procurement.rfqs.responses.colNotes", undefined, "Notes"),
              render: (r) => r.notes ?? "—",
              accessor: (r) => r.notes ?? null,
              defaultHidden: true,
            },
          ]}
        />
      </div>
    </>
  );
}
