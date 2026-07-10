import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { REPORTS_BY_APP, REPORT_APP_ORDER, REPORTS_LIST, METRIC_IDS, type ReportDef } from "@/lib/reports/registry";
import { Badge } from "@/components/ui/Badge";
import { getRequestT } from "@/lib/i18n/request";

/**
 * Reports & Analytics hub (kit v6.3). The full 43-report library across the 4
 * apps — every report renders live from the canonical metric registry
 * (`metrics.json`) via the shared ReportEngine, brand-aware + print-ready.
 *
 * The registry data is static, but this page lives under the auth-gated
 * `(platform)` layout (`requireSession()` reads cookies), so it renders
 * dynamically with the rest of the console — `force-static` would bake in the
 * unauthenticated redirect at build time.
 *
 * B-13: the hub now wears the console chrome (ModuleHeader), speaks i18n, and
 * carries a `searchParams`-driven search + app/status filter row so 43 reports
 * are findable without scrolling. Template status is a labeled badge, not a dot.
 */

const APP_META: Record<string, { name: string; taglineKey: string; tagline: string }> = {
  ALL: { name: "Cross-app", taglineKey: "all", tagline: "Executive & portfolio scorecards" },
  ATLVS: { name: "ATLVS", taglineKey: "atlvs", tagline: "Production · finance · governance" },
  COMPVSS: { name: "COMPVSS", taglineKey: "compvss", tagline: "Workforce · safety · assets" },
  GVTEWAY: { name: "GVTEWAY", taglineKey: "gvteway", tagline: "Commerce · marketplace · audience" },
  LEG3ND: { name: "LEG3ND", taglineKey: "leg3nd", tagline: "Learning · certification · compliance" },
};

const STATUS_FILTERS = ["all", "template", "preconfigured"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function hubHref(params: { q?: string; app?: string; status?: string }): string {
  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  if (params.app && params.app !== "all") usp.set("app", params.app);
  if (params.status && params.status !== "all") usp.set("status", params.status);
  const qs = usp.toString();
  return qs ? `/studio/reports?${qs}` : "/studio/reports";
}

function matches(r: ReportDef, q: string): boolean {
  const hay = `${r.title} ${r.id} ${r.kind} ${r.cadence}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export default async function ReportsHubPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; app?: string; status?: string }>;
}) {
  const { t } = await getRequestT();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const appFilter = sp.app && REPORT_APP_ORDER.includes(sp.app as (typeof REPORT_APP_ORDER)[number]) ? sp.app : null;
  const statusFilter: StatusFilter = STATUS_FILTERS.includes(sp.status as StatusFilter)
    ? (sp.status as StatusFilter)
    : "all";

  const keep = (r: ReportDef) =>
    (!q || matches(r, q)) &&
    (statusFilter === "all" || r.status === statusFilter) &&
    (!appFilter || r.app === appFilter);
  const shownCount = REPORTS_LIST.filter(keep).length;
  const filtered = q.length > 0 || statusFilter !== "all" || appFilter != null;

  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
      active
        ? "border-[var(--p-accent)] bg-[var(--p-accent)] text-[var(--p-accent-contrast,var(--p-bg))]"
        : "border-[var(--p-border)] hover:bg-[var(--p-surface-2)]"
    }`;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.reports.hub.eyebrow", undefined, "Reports & Analytics")}
        title={t("console.reports.hub.title", undefined, "Report Library")}
        subtitle={t(
          "console.reports.hub.subtitle",
          { reports: REPORTS_LIST.length, metrics: METRIC_IDS.length },
          `${REPORTS_LIST.length} reports over a ${METRIC_IDS.length}-metric registry, computed live from your org's data and print-ready`,
        )}
      />
      <div className="page-content space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <form action="/studio/reports" method="get" role="search" className="flex items-center gap-2">
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder={t("console.reports.hub.searchPlaceholder", undefined, "Search reports")}
              aria-label={t("console.reports.hub.searchAriaLabel", undefined, "Search reports")}
              className="ps-input ps-input--sm w-56"
            />
            {appFilter && <input type="hidden" name="app" value={appFilter} />}
            {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
            <button type="submit" className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("console.reports.hub.searchLabel", undefined, "Search")}
            </button>
          </form>
          <div
            role="tablist"
            aria-label={t("console.reports.hub.appFilterAriaLabel", undefined, "Filter by app")}
            className="inline-flex flex-wrap items-center gap-1.5"
          >
            <Link
              href={hubHref({ q, status: statusFilter })}
              role="tab"
              aria-selected={!appFilter}
              className={chipClass(!appFilter)}
            >
              {t("console.reports.hub.filter.allApps", undefined, "All apps")}
            </Link>
            {REPORT_APP_ORDER.map((app) => (
              <Link
                key={app}
                href={hubHref({ q, app, status: statusFilter })}
                role="tab"
                aria-selected={appFilter === app}
                className={chipClass(appFilter === app)}
              >
                {APP_META[app]?.name ?? app}
              </Link>
            ))}
          </div>
          <div
            role="tablist"
            aria-label={t("console.reports.hub.statusFilterAriaLabel", undefined, "Filter by report status")}
            className="inline-flex flex-wrap items-center gap-1.5"
          >
            {(
              [
                ["all", t("console.reports.hub.filter.anyStatus", undefined, "Any status")],
                ["template", t("console.reports.hub.filter.templates", undefined, "Templates")],
                ["preconfigured", t("console.reports.hub.filter.preconfigured", undefined, "Preconfigured")],
              ] as const
            ).map(([value, label]) => (
              <Link
                key={value}
                href={hubHref({ q, app: appFilter ?? undefined, status: value })}
                role="tab"
                aria-selected={statusFilter === value}
                className={chipClass(statusFilter === value)}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {filtered && (
          <p className="text-xs text-[var(--p-text-2)]">
            {t(
              "console.reports.hub.matchCount",
              { shown: shownCount, total: REPORTS_LIST.length },
              `Showing ${shownCount} of ${REPORTS_LIST.length} reports`,
            )}{" "}
            <Link href="/studio/reports" className="text-[var(--p-accent)] hover:underline">
              {t("console.reports.hub.clearFilters", undefined, "Clear filters")}
            </Link>
          </p>
        )}

        {shownCount === 0 ? (
          <div className="surface p-8 text-center text-sm text-[var(--p-text-2)]">
            {t("console.reports.hub.emptyTitle", undefined, "No reports match your search.")}
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {REPORT_APP_ORDER.map((app) => {
              const list = (REPORTS_BY_APP[app] ?? []).filter(keep);
              if (list.length === 0) return null;
              const meta = APP_META[app] ?? { name: app, taglineKey: app.toLowerCase(), tagline: "" };
              return (
                <section key={app}>
                  <div className="mb-4 flex items-baseline gap-3">
                    <h2>{meta.name}</h2>
                    <span className="text-sm text-[var(--p-text-3)]">
                      {t(`console.reports.hub.tagline.${meta.taglineKey}`, undefined, meta.tagline)}
                    </span>
                    <Badge>{list.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((r) => (
                      <Link
                        key={r.id}
                        href={`/studio/reports/${r.id}`}
                        className="surface-raised hover-lift press-scale flex flex-col gap-1 rounded-lg border border-[var(--p-border)] p-4"
                      >
                        <span className="flex items-center gap-2 font-semibold tracking-tight">
                          {r.title}
                          {r.status === "template" && (
                            <Badge variant="brand-soft">
                              {t("console.reports.hub.templateBadge", undefined, "Template")}
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">
                          {r.kind} · {r.cadence} ·{" "}
                          {t("console.reports.hub.kpiCount", { count: r.metrics.length }, `${r.metrics.length} KPIs`)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
