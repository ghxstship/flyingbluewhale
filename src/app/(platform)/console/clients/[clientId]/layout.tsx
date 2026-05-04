import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

/**
 * Client detail layout — Projects / Proposals / Invoices filter their
 * lists by client_id so the user can cross-pivot from a client to
 * every artifact attached to them in one click warm.
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const tabs = [
    { label: "Overview", href: `/console/clients/${clientId}` },
    { label: "Projects", href: `/console/clients/${clientId}/projects` },
    { label: "Proposals", href: `/console/clients/${clientId}/proposals` },
    { label: "Invoices", href: `/console/clients/${clientId}/invoices` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
