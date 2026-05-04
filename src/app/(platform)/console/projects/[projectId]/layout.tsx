import { RecordTabsProvider } from "@/components/ui/RecordTabsContext";

/**
 * Project detail layout — declares the record-tabs strip that the
 * page's `ModuleHeader` then renders directly under the title (Stripe /
 * Linear / Attio pattern). Routes back the state — one page per tab —
 * so deep links and browser back work natively.
 */
export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const tabs = [
    { label: "Overview", href: `/console/projects/${projectId}/overview` },
    { label: "Tasks", href: `/console/projects/${projectId}/tasks` },
    { label: "Gantt", href: `/console/projects/${projectId}/gantt` },
    { label: "Files", href: `/console/projects/${projectId}/files` },
    { label: "Photos", href: `/console/projects/${projectId}/photos` },
    { label: "Calendar", href: `/console/projects/${projectId}/calendar` },
    { label: "Budget", href: `/console/projects/${projectId}/budget` },
    { label: "P&L", href: `/console/projects/${projectId}/finance` },
    { label: "Crew", href: `/console/projects/${projectId}/crew` },
    { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
    { label: "Guides", href: `/console/projects/${projectId}/guides` },
    { label: "Sustainability", href: `/console/projects/${projectId}/sustainability` },
  ];
  return <RecordTabsProvider tabs={tabs}>{children}</RecordTabsProvider>;
}
