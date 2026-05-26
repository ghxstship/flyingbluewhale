import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { UploadInvoiceClient } from "./upload-client";

export const dynamic = "force-dynamic";

type State = "queued" | "extracting" | "extracted" | "review" | "matched" | "promoted" | "rejected" | "failed";

type Row = {
  id: string;
  file_name: string | null;
  state: State;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount_cents: number | null;
  confidence: number | null;
  uploaded_at: string;
};

const STATE_TONE: Record<State, "muted" | "info" | "warning" | "success" | "error"> = {
  queued: "muted",
  extracting: "info",
  extracted: "info",
  review: "warning",
  matched: "info",
  promoted: "success",
  rejected: "muted",
  failed: "error",
};

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Finance" title="AP Invoice OCR" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = (await createClient()) as unknown as LooseSupabase;
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("ap_invoice_extractions")
    .select(
      "id, file_name, state, vendor_name, invoice_number, invoice_date, total_amount_cents, confidence, uploaded_at",
    )
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("uploaded_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as unknown as Row[];

  const reviewCount = rows.filter((r) => r.state === "review" || r.state === "extracted").length;
  const promotedCount = rows.filter((r) => r.state === "promoted").length;
  const failedCount = rows.filter((r) => r.state === "failed").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Finance"
        title="AP Invoice OCR"
        subtitle={`${rows.length} extraction${rows.length === 1 ? "" : "s"} · ${reviewCount} awaiting review · ${promotedCount} promoted to invoices · ${failedCount} failed`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Awaiting review" value={fmt.number(reviewCount)} accent />
          <MetricCard label="Promoted" value={fmt.number(promotedCount)} />
          <MetricCard label="Failed" value={fmt.number(failedCount)} />
        </div>
        <section className="surface space-y-3 p-4">
          <h2 className="text-sm font-semibold">Upload an invoice PDF</h2>
          <p className="text-xs text-[var(--text-muted)]">
            Anthropic Vision (Claude Sonnet 4.6) extracts vendor + invoice + line-items + amounts. Low-confidence
            extractions land in &ldquo;Review&rdquo; for human verification before promoting to an invoices row.
          </p>
          <UploadInvoiceClient />
        </section>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/console/finance/ap-ocr/${r.id}`}
          emptyLabel="No extractions yet"
          emptyDescription="Upload an invoice PDF to start the OCR + matching workflow."
          columns={[
            {
              key: "file",
              header: "File",
              render: (r) => r.file_name ?? "—",
              accessor: (r) => r.file_name,
            },
            {
              key: "vendor",
              header: "Vendor",
              render: (r) => r.vendor_name ?? "—",
              accessor: (r) => r.vendor_name,
              filterable: true,
              groupable: true,
            },
            {
              key: "invoice",
              header: "Invoice #",
              render: (r) => r.invoice_number ?? "—",
              accessor: (r) => r.invoice_number,
              className: "font-mono text-xs",
            },
            {
              key: "date",
              header: "Date",
              render: (r) =>
                r.invoice_date
                  ? fmt.dateParts(r.invoice_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" })
                  : "—",
              accessor: (r) => r.invoice_date,
              className: "font-mono text-xs",
            },
            {
              key: "amount",
              header: "Amount",
              render: (r) => (r.total_amount_cents != null ? fmt.money(Number(r.total_amount_cents)) : "—"),
              accessor: (r) => Number(r.total_amount_cents ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "confidence",
              header: "Conf",
              render: (r) => (r.confidence != null ? `${(Number(r.confidence) * 100).toFixed(0)}%` : "—"),
              accessor: (r) => Number(r.confidence ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: "State",
              render: (r) => <Badge variant={STATE_TONE[r.state]}>{toTitle(r.state)}</Badge>,
              accessor: (r) => r.state,
              filterable: true,
              groupable: true,
            },
          ]}
        />
      </div>
    </>
  );
}
