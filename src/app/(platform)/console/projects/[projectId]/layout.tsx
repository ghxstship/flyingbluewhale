import { RouteTabs } from "@/components/ui/RouteTabs";

/**
 * Project detail layout — renders the persistent record-tabs strip above
 * every sub-route under `/console/projects/[projectId]/*` so the user
 * never loses the project context when crossing sub-views (Stripe /
 * Linear / Attio pattern). Each sub-page still renders its own
 * `<ModuleHeader>` for the section title; the tab strip is the link
 * between them.
 *
 * Phase B of the WAYFINDER remediation. Promotes the previously hand-
 * rolled `<nav>` strip in `[projectId]/page.tsx` into a shared layout.
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
    { label: "Calendar", href: `/console/projects/${projectId}/calendar` },
    { label: "Budget", href: `/console/projects/${projectId}/budget` },
    { label: "P&L", href: `/console/projects/${projectId}/finance` },
    { label: "Crew", href: `/console/projects/${projectId}/crew` },
    { label: "Advancing", href: `/console/projects/${projectId}/advancing` },
    { label: "Guides", href: `/console/projects/${projectId}/guides` },
  ];
  return (
    <>
      <div className="sticky top-14 z-20 border-b border-[var(--border-color)] bg-[var(--background)]/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/65">
        <RouteTabs tabs={tabs} />
      </div>
      {children}
    </>
  );
}
