import Link from "next/link";
import { REPORTS_BY_APP, REPORT_APP_ORDER, REPORTS_LIST, METRIC_IDS } from "@/lib/reports/registry";
import { Badge } from "@/components/ui/Badge";

/**
 * Reports & Analytics hub (kit v6.3). The full 43-report library across the 4
 * apps — every report renders live from the canonical metric registry
 * (`metrics.json`) via the shared ReportEngine, brand-aware + print-ready.
 *
 * The registry data is static, but this page lives under the auth-gated
 * `(platform)` layout (`requireSession()` reads cookies), so it renders
 * dynamically with the rest of the console — `force-static` would bake in the
 * unauthenticated redirect at build time.
 */

const APP_META: Record<string, { name: string; tagline: string }> = {
  ALL: { name: "Cross-app", tagline: "Executive & portfolio scorecards" },
  ATLVS: { name: "ATLVS", tagline: "Production · finance · governance" },
  COMPVSS: { name: "COMPVSS", tagline: "Workforce · safety · assets" },
  GVTEWAY: { name: "GVTEWAY", tagline: "Commerce · marketplace · audience" },
  LEG3ND: { name: "LEG3ND", tagline: "Learning · certification · compliance" },
};

export default function ReportsHubPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="border-ink mb-8 border-b-3 pb-6">
        <div className="text-xs font-semibold tracking-wider text-[var(--p-accent)] uppercase">Reports & Analytics</div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">REPORT LIBRARY</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--p-text-2)]">
          {REPORTS_LIST.length} reports across the four apps, each bound to the canonical{" "}
          <code>{METRIC_IDS.length}</code>-metric registry and rendered live from your org&rsquo;s data —
          brand-aware, contract-bound, and print/PDF-ready. Click any report to open it.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {REPORT_APP_ORDER.map((app) => {
          const list = REPORTS_BY_APP[app] ?? [];
          if (list.length === 0) return null;
          const meta = APP_META[app] ?? { name: app, tagline: "" };
          return (
            <section key={app}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 className="text-xl font-semibold tracking-tight">{meta.name}</h2>
                <span className="text-sm text-[var(--p-text-3)]">{meta.tagline}</span>
                <Badge>{list.length}</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((r) => (
                  <Link
                    key={r.id}
                    href={`/console/reports/${r.id}`}
                    className="surface-raised hover-lift press-scale flex flex-col gap-1 rounded-lg border border-[var(--p-border)] p-4"
                  >
                    <span className="flex items-center gap-2 font-semibold tracking-tight">
                      {r.title}
                      {r.status === "template" && (
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--p-accent)]"
                          title="Turnkey template"
                          aria-label="Turnkey template"
                        />
                      )}
                    </span>
                    <span className="font-mono text-[11px] tracking-wide text-[var(--p-text-3)] uppercase">
                      {r.kind} · {r.cadence} · {r.metrics.length} KPIs
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
