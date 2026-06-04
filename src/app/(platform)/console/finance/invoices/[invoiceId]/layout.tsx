import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Invoice detail layout — Line items live in `invoice_line_items`
 * filtered by invoice_id; activity bridges to the audit log scoped to
 * this invoice.
 */
export default async function InvoiceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await params;
  const { t } = await getRequestT();
  const tabs = [
    {
      label: t("console.finance.invoices.detail.tabs.overview", undefined, "Overview"),
      href: `/console/finance/invoices/${invoiceId}`,
    },
    {
      label: t("console.finance.invoices.detail.tabs.lineItems", undefined, "Line Items"),
      href: `/console/finance/invoices/${invoiceId}/line-items`,
    },
    {
      label: t("console.finance.invoices.detail.tabs.activity", undefined, "Activity"),
      href: `/console/finance/invoices/${invoiceId}/activity`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
