import { notFound } from "next/navigation";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import Link from "next/link";
import { DataTable } from "@/components/DataTable";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { formatMoney } from "@/lib/i18n/format";
import { timeAgo, toTitle } from "@/lib/format";

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

const RESPONSE_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  invited: "muted",
  viewed: "info",
  responded: "info",
  no_bid: "muted",
  withdrawn: "warning",
  awarded: "success",
  declined: "error",
};

export default async function RfqResponsesPage({ params }: { params: Promise<{ rfqId: string }> }) {
  const { rfqId } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Procurement" title="RFQ Responses" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const { data: rfqData } = await supabase
    .from("rfqs")
    .select("id, title, status, due_at, awarded_to_vendor_id")
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
        eyebrow="Procurement"
        title="Responses"
        subtitle={
          <span className="font-mono text-xs">
            {rfq.title} · {responses.length} response
            {responses.length === 1 ? "" : "s"}
          </span>
        }
        breadcrumbs={[
          { label: "Procurement", href: "/console/procurement" },
          { label: "RFQs", href: "/console/procurement/rfqs" },
          { label: rfq.title, href: `/console/procurement/rfqs/${rfqId}` },
          { label: "Responses" },
        ]}
        action={<Badge variant="muted">{toTitle(rfq.status)}</Badge>}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Submitted" value={String(submitted.length)} />
          <MetricCard label="Lowest Bid" value={lowest != null ? formatMoney(lowest) : "—"} accent={lowest != null} />
          <MetricCard label="Avg Bid" value={average != null ? formatMoney(Math.round(average)) : "—"} />
        </div>

        <DataTable<ResponseRow>
          rows={responses}
          emptyLabel="No Responses Yet"
          emptyDescription="Vendors invited to this RFQ appear here once they view, bid, or decline. Use the public RFQ link (or invite vendors via requisitions) to start collecting responses."
          columns={[
            {
              key: "vendor",
              header: "Vendor",
              render: (r) => (
                <Link href={`/console/procurement/rfqs/${rfqId}/responses/${r.id}`} className="hover:underline">
                  {r.vendor?.name ?? "—"}
                </Link>
              ),
              accessor: (r) => r.vendor?.name ?? null,
            },
            {
              key: "response_state",
              header: "State",
              render: (r) => (
                <Badge variant={RESPONSE_TONE[r.response_state] ?? "muted"}>{toTitle(r.response_state)}</Badge>
              ),
              accessor: (r) => r.response_state,
              filterable: true,
              groupable: true,
            },
            {
              key: "total",
              header: "Total",
              render: (r) => (r.total_cents != null ? formatMoney(r.total_cents) : "—"),
              accessor: (r) => Number(r.total_cents ?? 0),
              mono: true,
              tabular: true,
              total: "min",
              totalFormat: (n) => (n > 0 ? formatMoney(n) : "—"),
            },
            {
              key: "submitted",
              header: "Submitted",
              render: (r) => (r.submitted_at ? timeAgo(r.submitted_at) : "—"),
              accessor: (r) => r.submitted_at ?? null,
              mono: true,
            },
            {
              key: "awarded",
              header: "Awarded",
              render: (r) => (r.awarded_at ? timeAgo(r.awarded_at) : "—"),
              accessor: (r) => r.awarded_at ?? null,
              mono: true,
            },
            {
              key: "notes",
              header: "Notes",
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
