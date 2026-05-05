import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getDashboard } from "@/lib/db/dashboards";
import { DashboardEditorClient } from "./DashboardEditorClient";

export const dynamic = "force-dynamic";

/**
 * Dashboard editor — Phase 3.6c. Server component that loads the row
 * and hands it to the client editor; the client owns the local layout
 * state + debounced save.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Edit Dashboard" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  await requireSession();
  const dashboard = await getDashboard({ id });
  if (!dashboard) notFound();

  return (
    <>
      <ModuleHeader
        eyebrow="Dashboard / Edit"
        title={dashboard.name}
        subtitle="Drag widgets onto the canvas. Changes save automatically."
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/dashboards/${id}`} variant="ghost" size="sm">
              Done
            </Button>
          </div>
        }
      />
      <div className="page-content">
        <DashboardEditorClient dashboardId={id} initialLayout={dashboard.layout} />
      </div>
    </>
  );
}
