import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import type { DashboardWidgetData } from "@/components/dashboards/DashboardCanvas";
import type { SavedViewWidgetData } from "@/components/dashboards/widgets/SavedViewWidget";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getDashboard } from "@/lib/db/dashboards";
import { getViewConfig } from "@/lib/db/view-configs";
import type { ChartWidget, SavedViewWidget } from "@/lib/dashboards/types";
import { getRequestT } from "@/lib/i18n/request";
import type { LooseSupabase } from "@/lib/supabase/loose";
import { createClient } from "@/lib/supabase/server";
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

  // Resolve the real per-widget data (org chart rows + saved-view embeds)
  // so the editor previews live data instead of empty fixtures. RLS gates
  // every read to the caller's org. Mirrors the detail-page resolver.
  const data = await resolveWidgetData(dashboard.layout.widgets);

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
        <DashboardEditorClient dashboardId={id} initialLayout={dashboard.layout} data={data} />
      </div>
    </>
  );
}

/**
 * Resolve the row data each widget needs for the editor preview.
 *
 * Chart widgets: a lightweight `select *` against the configured table,
 * filtered/limited to keep the render cheap. Saved-view widgets: load the
 * view_configs row. Errors are absorbed — one broken widget shouldn't tank
 * the editor; failed lookups produce empty rows. Mirrors the resolver on
 * the dashboard detail page.
 */
async function resolveWidgetData(widgets: ReadonlyArray<{ id: string; type: string }>): Promise<DashboardWidgetData> {
  const charts: Record<string, Array<Record<string, unknown>>> = {};
  const savedViews: Record<string, SavedViewWidgetData> = {};

  const chartWidgets = widgets.filter((w): w is ChartWidget => w.type === "chart");
  const savedViewWidgets = widgets.filter((w): w is SavedViewWidget => w.type === "saved_view");

  if (chartWidgets.length === 0 && savedViewWidgets.length === 0) {
    return { charts, savedViews };
  }

  const supabase = await createClient();

  await Promise.all([
    ...chartWidgets.map(async (w) => {
      try {
        if (!w.dataQuery?.table) {
          charts[w.id] = [];
          return;
        }
        const limit = w.dataQuery.limit ?? 1000;
        // Dynamic-table dispatch — `w.dataQuery.table` comes from the
        // dashboard's runtime JSON config, so the typed Supabase client
        // can't narrow it. LooseSupabase is the codebase's centralized
        // typed-loose escape hatch — it preserves the chainable query API
        // surface without `any` infesting the call site.
        const loose = supabase as unknown as LooseSupabase;
        type Filterable = {
          eq: (col: string, val: unknown) => Filterable;
          in: (col: string, vals: unknown[]) => Filterable;
        } & PromiseLike<{ data: Array<Record<string, unknown>> | null }>;
        let q = loose.from(w.dataQuery.table).select("*").limit(limit) as unknown as Filterable;
        if (w.dataQuery.filter) {
          for (const [k, v] of Object.entries(w.dataQuery.filter)) {
            q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
          }
        }
        const { data: rows } = await q;
        charts[w.id] = (rows as Array<Record<string, unknown>>) ?? [];
      } catch {
        charts[w.id] = [];
      }
    }),
    ...savedViewWidgets.map(async (w) => {
      try {
        if (!w.viewConfigId) {
          savedViews[w.id] = { view: null, rows: [] };
          return;
        }
        const view = await getViewConfig({ id: w.viewConfigId });
        if (!view || !view.tableId) {
          savedViews[w.id] = { view: null, rows: [] };
          return;
        }
        savedViews[w.id] = { view, rows: [], href: undefined };
      } catch {
        savedViews[w.id] = { view: null, rows: [] };
      }
    }),
  ]);

  return { charts, savedViews };
}
