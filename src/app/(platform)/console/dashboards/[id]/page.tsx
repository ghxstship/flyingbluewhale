import { notFound } from "next/navigation";

import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { DashboardCanvas } from "@/components/dashboards/DashboardCanvas";
import type { DashboardWidgetData } from "@/components/dashboards/DashboardCanvas";
import type { SavedViewWidgetData } from "@/components/dashboards/widgets/SavedViewWidget";
import { requireSession } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { getDashboard } from "@/lib/db/dashboards";
import { getViewConfig } from "@/lib/db/view-configs";
import { createClient } from "@/lib/supabase/server";
import type { ChartWidget, SavedViewWidget } from "@/lib/dashboards/types";

export const dynamic = "force-dynamic";

/**
 * Dashboard renderer — Phase 3.6c. Reads a dashboard row, resolves the
 * data each widget needs (chart rows, saved-view embeds), and hands the
 * pre-fetched bundle to the client canvas.
 *
 * KPI + Markdown widgets carry their state inside the layout JSONB; only
 * Chart and Saved-View widgets need server-side data resolution.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Dashboard" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  await requireSession();
  const dashboard = await getDashboard({ id });
  if (!dashboard) notFound();

  const data = await resolveWidgetData(dashboard.layout.widgets);

  return (
    <>
      <ModuleHeader
        eyebrow="Dashboard"
        title={dashboard.name}
        subtitle={dashboard.description ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Button href="/console/dashboards" variant="ghost" size="sm">
              Back
            </Button>
            <Button href={`/console/dashboards/${id}/edit`} size="sm">
              Edit
            </Button>
          </div>
        }
      />
      <div className="page-content">
        <DashboardCanvas layout={dashboard.layout} data={data} />
      </div>
    </>
  );
}

/**
 * Resolve the row data each widget needs.
 *
 * Chart widgets: a lightweight `select *` against the configured table,
 * filtered/limited to keep the dashboard render cheap.
 * Saved-view widgets: load the view_configs row + a sample of its
 * underlying rows.
 *
 * Errors are absorbed — a single broken widget shouldn't tank the whole
 * dashboard. Failed lookups produce empty rows and the renderer shows
 * "No rows".
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let q: any = (supabase as any).from(w.dataQuery.table).select("*").limit(limit);
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
        // The saved view's `tableId` is in the form `t:/path:col1,col2`.
        // For MVP we don't try to resolve it back into a Supabase table —
        // saved-view embeds preview the rows that the host page would
        // pass in. When a future iteration wires a `dataSource` slot into
        // SavedView.viewConfig, this branch can hydrate from there.
        const limit = w.rowLimit ?? 10;
        savedViews[w.id] = {
          view,
          rows: [],
          href: undefined,
        };
        // Suppress unused-var warning while we keep the limit hint in scope.
        void limit;
      } catch {
        savedViews[w.id] = { view: null, rows: [] };
      }
    }),
  ]);

  return { charts, savedViews };
}
