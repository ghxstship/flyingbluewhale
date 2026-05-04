import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

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
  const tabs = [
    { label: "Overview", href: `/console/finance/invoices/${invoiceId}` },
    { label: "Line Items", href: `/console/finance/invoices/${invoiceId}/line-items` },
    { label: "Activity", href: `/console/finance/invoices/${invoiceId}/activity` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
