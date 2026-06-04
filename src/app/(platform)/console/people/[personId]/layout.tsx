import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";
import { getRequestT } from "@/lib/i18n/request";

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
  const { t } = await getRequestT();
  const tabs = [
    { label: t("console.people.person.tabs.profile", undefined, "Profile"), href: `/console/people/${personId}` },
    {
      label: t("console.people.person.tabs.assignments", undefined, "Assignments"),
      href: `/console/people/${personId}/assignments`,
    },
    {
      label: t("console.people.person.tabs.credentials", undefined, "Credentials"),
      href: `/console/people/${personId}/credentials`,
    },
    { label: t("console.people.person.tabs.time", undefined, "Time"), href: `/console/people/${personId}/time` },
    {
      label: t("console.people.person.tabs.documents", undefined, "Documents"),
      href: `/console/people/${personId}/documents`,
    },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
