import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

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
  const tabs = [
    { label: "Overview", href: `/console/leads/${leadId}` },
    { label: "Activity", href: `/console/leads/${leadId}/activity` },
    { label: "Proposals", href: `/console/leads/${leadId}/proposals` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
