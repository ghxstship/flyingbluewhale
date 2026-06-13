import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  const tabs = [
    { label: t("console.clients.detail.tabs.overview", undefined, "Overview"), href: `/console/clients/${clientId}` },
    {
      label: t("console.clients.detail.tabs.projects", undefined, "Projects"),
      href: `/console/clients/${clientId}/projects`,
    },
    {
      label: t("console.clients.detail.tabs.proposals", undefined, "Proposals"),
      href: `/console/clients/${clientId}/proposals`,
    },
    {
      label: t("console.clients.detail.tabs.invoices", undefined, "Invoices"),
      href: `/console/clients/${clientId}/invoices`,
    },
    {
      label: t("console.clients.detail.tabs.branding", undefined, "Brand"),
      href: `/console/clients/${clientId}/branding`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
