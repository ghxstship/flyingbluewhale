"use client";

import * as React from "react";
import { DashboardCanvas, type DashboardWidgetData } from "@/components/dashboards/DashboardCanvas";
import type { DashboardLayout } from "@/lib/dashboards/types";
import { useT } from "@/lib/i18n/LocaleProvider";
import { saveLayoutAction } from "../actions";

const DEBOUNCE_MS = 500;

/**
 * Client wrapper for the dashboard editor — owns the debounced save loop
 * + the latest-known layout. The parent server page resolves real chart
 * rows + saved-view embeds and passes them in as `data`, so widget previews
 * render live org data instead of empty fixtures.
 */
export function DashboardEditorClient({
  dashboardId,
  initialLayout,
  data,
}: {
  dashboardId: string;
  initialLayout: DashboardLayout;
  data: DashboardWidgetData;
}): React.ReactElement {
  const [layout, setLayout] = React.useState<DashboardLayout>(initialLayout);
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = React.useCallback(
    async (next: DashboardLayout) => {
      setStatus("saving");
      setError(null);
      const result = await saveLayoutAction(dashboardId, next);
      if (result?.error) {
        setStatus("error");
        setError(result.error);
      } else {
        setStatus("saved");
      }
    },
    [dashboardId],
  );

  const handleLayoutChange = React.useCallback(
    (next: DashboardLayout) => {
      setLayout(next);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void persist(next);
      }, DEBOUNCE_MS);
    },
    [persist],
  );

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-xs">
        <SaveIndicator status={status} error={error} />
      </div>
      <DashboardCanvas layout={layout} data={data} editable onLayoutChange={handleLayoutChange} />
    </div>
  );
}

function SaveIndicator({
  status,
  error,
}: {
  status: "idle" | "saving" | "saved" | "error";
  error: string | null;
}): React.ReactElement {
  const t = useT();
  if (status === "saving") {
    return <span className="text-[var(--p-text-2)]">{t("console.dashboards.edit.saving", undefined, "Saving…")}</span>;
  }
  if (status === "saved") {
    return <span className="text-[var(--p-success)]">{t("console.dashboards.edit.saved", undefined, "Saved")}</span>;
  }
  if (status === "error") {
    return (
      <span className="text-[var(--p-danger)]" role="alert">
        {error ?? t("console.dashboards.edit.saveFailed", undefined, "Save failed")}
      </span>
    );
  }
  return <span className="text-[var(--p-text-2)]">{t("console.dashboards.edit.idle", undefined, "Idle")}</span>;
}
