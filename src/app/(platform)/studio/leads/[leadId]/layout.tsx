import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Lead detail layout — Activity bridges to the audit log scoped to
 * this lead; Proposals waits on a `source_lead_id` column.
 */
export default async function LeadLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const { t } = await getRequestT();
  const tabs = [
    { label: t("console.leads.detail.tabs.overview", undefined, "Overview"), href: `/studio/leads/${leadId}` },
    {
      label: t("console.leads.detail.tabs.activity", undefined, "Activity"),
      href: `/studio/leads/${leadId}/activity`,
    },
    {
      label: t("console.leads.detail.tabs.proposals", undefined, "Proposals"),
      href: `/studio/leads/${leadId}/proposals`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
