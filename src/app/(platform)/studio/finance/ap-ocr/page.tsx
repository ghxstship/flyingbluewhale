import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
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
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.apOcr.eyebrow", undefined, "Finance")}
          title={t("console.finance.apOcr.title", undefined, "AP Invoice OCR")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.finance.apOcr.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.finance.apOcr.eyebrow", undefined, "Finance")}
        title={t("console.finance.apOcr.title", undefined, "AP Invoice OCR")}
        subtitle={`${rows.length} ${rows.length === 1 ? t("console.finance.apOcr.extractionSingular", undefined, "extraction") : t("console.finance.apOcr.extractionPlural", undefined, "extractions")} · ${reviewCount} ${t("console.finance.apOcr.awaitingReviewSuffix", undefined, "awaiting review")} · ${promotedCount} ${t("console.finance.apOcr.promotedToInvoicesSuffix", undefined, "promoted to invoices")} · ${failedCount} ${t("console.finance.apOcr.failedSuffix", undefined, "failed")}`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.finance.apOcr.metric.awaitingReview", undefined, "Awaiting review")}
            value={fmt.number(reviewCount)}
            accent
          />
          <MetricCard
            label={t("console.finance.apOcr.metric.promoted", undefined, "Promoted")}
            value={fmt.number(promotedCount)}
          />
          <MetricCard
            label={t("console.finance.apOcr.metric.failed", undefined, "Failed")}
            value={fmt.number(failedCount)}
          />
        </div>
        <section className="surface space-y-3 p-4">
          <h2 className="text-sm font-semibold">
            {t("console.finance.apOcr.upload.heading", undefined, "Upload an invoice PDF")}
          </h2>
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.finance.apOcr.upload.description",
              undefined,
              "Anthropic Vision (Claude Sonnet 4.6) extracts vendor + invoice + line-items + amounts. Low-confidence extractions land in “Review” for human verification before promoting to an invoices row.",
            )}
          </p>
          <UploadInvoiceClient />
        </section>
        <DataTable<Row>
          rows={rows}
          rowHref={(r) => `/studio/finance/ap-ocr/${r.id}`}
          emptyLabel={t("console.finance.apOcr.empty.label", undefined, "No extractions yet")}
          emptyDescription={t(
            "console.finance.apOcr.empty.description",
            undefined,
            "Upload an invoice PDF to start the OCR + matching workflow.",
          )}
          columns={[
            {
              key: "file",
              header: t("console.finance.apOcr.column.file", undefined, "File"),
              render: (r) => r.file_name ?? "—",
              accessor: (r) => r.file_name,
            },
            {
              key: "vendor",
              header: t("console.finance.apOcr.column.vendor", undefined, "Vendor"),
              render: (r) => r.vendor_name ?? "—",
              accessor: (r) => r.vendor_name,
              filterable: true,
              groupable: true,
            },
            {
              key: "invoice",
              header: t("console.finance.apOcr.column.invoice", undefined, "Invoice #"),
              render: (r) => r.invoice_number ?? "—",
              accessor: (r) => r.invoice_number,
              className: "font-mono text-xs",
            },
            {
              key: "date",
              header: t("console.finance.apOcr.column.date", undefined, "Date"),
              render: (r) =>
                r.invoice_date
                  ? fmt.dateParts(r.invoice_date + "T00:00:00", { month: "short", day: "numeric", year: "2-digit" })
                  : "—",
              accessor: (r) => r.invoice_date,
              className: "font-mono text-xs",
            },
            {
              key: "amount",
              header: t("console.finance.apOcr.column.amount", undefined, "Amount"),
              render: (r) => (r.total_amount_cents != null ? fmt.money(Number(r.total_amount_cents)) : "—"),
              accessor: (r) => Number(r.total_amount_cents ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "confidence",
              header: t("console.finance.apOcr.column.confidence", undefined, "Conf"),
              render: (r) => (r.confidence != null ? `${(Number(r.confidence) * 100).toFixed(0)}%` : "—"),
              accessor: (r) => Number(r.confidence ?? 0),
              className: "font-mono text-xs text-right",
            },
            {
              key: "state",
              header: t("console.finance.apOcr.column.state", undefined, "State"),
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
