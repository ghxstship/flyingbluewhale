import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

/**
 * Person detail layout — absorbs the sub-resources removed from the
 * primary sidebar in the WAYFINDER remediation (Crew, Credentials,
 * Offer Letters) into per-record tabs. Tabs render inside each page's
 * ModuleHeader via context.
 */
export default async function PersonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ personId: string }>;
}) {
  const { personId } = await params;
  const tabs = [
    { label: "Profile", href: `/console/people/${personId}` },
    { label: "Assignments", href: `/console/people/${personId}/assignments` },
    { label: "Credentials", href: `/console/people/${personId}/credentials` },
    { label: "Time", href: `/console/people/${personId}/time` },
    { label: "Documents", href: `/console/people/${personId}/documents` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
