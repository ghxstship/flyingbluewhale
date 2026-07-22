import Link from "next/link";
import { FileDown } from "lucide-react";
import { PortalSubpage } from "@/components/PortalSubpage";
import { DataView } from "@/components/views/DataViewServer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/server";
import { projectIdFromSlug } from "@/lib/db/advancing";
import { formatMoney } from "@/lib/i18n/format";
import { getRequestT } from "@/lib/i18n/request";
import type { Invoice } from "@/lib/supabase/types";
import { PayInvoiceButton } from "./PayInvoiceButton";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  const project = await projectIdFromSlug(slug);
  const supabase = await createClient();
  const rows = project
    ? (((
        await supabase
          .from("invoices")
          .select("*")
          .is("deleted_at", null)
          // Clients see outbound (AR) billing only — vendor payables that
          // share the merged invoices store are not theirs to browse.
          .eq("source", "ar")
          .eq("project_id", project.id)
          .order("issued_at", { ascending: false })
          .limit(200)
      ).data as Invoice[]) ?? [])
    : [];
  return (
    <PortalSubpage
      slug={slug}
      persona="client"
      title={t("p.client.invoices.title", undefined, "Invoices")}
      subtitle={t("p.client.invoices.subtitle", undefined, "Pay invoices and download receipts")}
    >
      <DataView<Invoice>
        rows={rows}
        emptyLabel={t("p.client.invoices.empty", undefined, "No Invoices Yet")}
        emptyDescription={t(
          "p.client.invoices.emptyDescription",
          undefined,
          "Invoices for this project appear here as your producer issues them. You can pay and download receipts straight from this list.",
        )}
        columns={[
          {
            key: "number",
            header: t("p.client.invoices.col.number", undefined, "Number"),
            render: (r) => r.number,
            mono: true,
            accessor: (r) => r.number ?? null,
          },
          {
            key: "title",
            header: t("p.client.invoices.col.title", undefined, "Title"),
            render: (r) => r.title,
            accessor: (r) => r.title,
          },
          {
            key: "amount",
            header: t("p.client.invoices.col.amount", undefined, "Amount"),
            render: (r) => formatMoney(r.amount_cents, r.currency),
            mono: true,
            accessor: (r) => r.amount_cents ?? null,
          },
          {
            key: "invoice_state",
            header: t("p.client.invoices.col.invoice_state", undefined, "Status"),
            render: (r) => <StatusBadge status={r.invoice_state} />,
            accessor: (r) => r.invoice_state,
            filterable: true,
            groupable: true,
          },
          {
            key: "due",
            header: t("p.client.invoices.col.due", undefined, "Due"),
            render: (r) => r.due_at ?? "—",
            mono: true,
            accessor: (r) => r.due_at ?? null,
          },
          {
            key: "pay",
            header: t("p.client.invoices.col.pay", undefined, "Pay"),
            render: (r) =>
              r.source === "ar" && ["sent", "overdue"].includes(r.invoice_state) ? (
                <PayInvoiceButton invoiceId={r.id} slug={slug} number={r.number} />
              ) : r.invoice_state === "paid" ? (
                <span className="text-xs text-[var(--p-text-2)]">
                  {t("p.client.invoices.pay.settled", undefined, "Paid")}
                </span>
              ) : (
                "—"
              ),
            accessor: (r) => r.invoice_state,
          },
          {
            key: "download",
            header: t("p.client.invoices.col.pdf", undefined, "PDF"),
            render: (r) => (
              <Link
                href={`/api/v1/invoices/${r.id}/pdf`}
                className="inline-flex items-center gap-1 text-xs hover:underline"
                aria-label={t(
                  "p.client.invoices.download.aria",
                  { number: r.number ?? "" },
                  `Download invoice ${r.number} as PDF`,
                )}
              >
                <FileDown size={12} aria-hidden="true" />
                {t("p.client.invoices.download", undefined, "Download")}
              </Link>
            ),
            accessor: (r) => r.id ?? null,
          },
        ]}
      />
    </PortalSubpage>
  );
}
