import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getDashboard } from "@/lib/db/dashboards";
import { getRequestT } from "@/lib/i18n/request";
import { DashboardEditorClient } from "./DashboardEditorClient";

export const dynamic = "force-dynamic";

/**
 * Dashboard editor — Phase 3.6c. Server component that loads the row
 * and hands it to the client editor; the client owns the local layout
 * state + debounced save.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.dashboards.edit.title", undefined, "Edit Dashboard")} />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.dashboards.edit.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.dashboards.edit.eyebrow", undefined, "Dashboard / Edit")}
        title={dashboard.name}
        subtitle={t("console.dashboards.edit.subtitle", undefined, "Drag widgets onto the canvas.")}
        action={
          <div className="flex items-center gap-2">
            <Button href={`/console/dashboards/${id}`} variant="ghost" size="sm">
              {t("console.dashboards.edit.done", undefined, "Done")}
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
