import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession, isManagerPlus } from "@/lib/auth";
import { hasSupabase } from "@/lib/env";
import { usageSeries, usageTotal, dailyTotals } from "@/lib/usage";

export const dynamic = "force-dynamic";

const WINDOW_DAYS = 14;
const n = (x: number) => x.toLocaleString("en-US");

export default async function UsagePage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Usage" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  if (!isManagerPlus(session)) {
    return (
      <>
        <ModuleHeader eyebrow="Settings" title="Usage" />
        <div className="page-content">
          <EmptyState
            title="Manager access required"
            description="Only owners, admins, and managers can view workspace usage."
          />
        </div>
      </>
    );
  }

  const [reqs, inTok, outTok, apiReqs] = await Promise.all([
    usageSeries(session.orgId, "ai.request"),
    usageSeries(session.orgId, "ai.tokens.input"),
    usageSeries(session.orgId, "ai.tokens.output"),
    usageSeries(session.orgId, "api.request"),
  ]);

  const reqTotal = usageTotal(reqs);
  const inTotal = usageTotal(inTok);
  const outTotal = usageTotal(outTok);
  const apiTotal = usageTotal(apiReqs);

  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Usage"
        subtitle={`AI & API usage · trailing ${WINDOW_DAYS} days`}
      />
      <div className="page-content max-w-5xl space-y-4">
        <div className="metric-grid">
          <MetricCard label="AI Requests" value={n(reqTotal)} sparkline={dailyTotals(reqs, WINDOW_DAYS)} accent />
          <MetricCard label="Input Tokens" value={n(inTotal)} sparkline={dailyTotals(inTok, WINDOW_DAYS)} />
          <MetricCard label="Output Tokens" value={n(outTotal)} sparkline={dailyTotals(outTok, WINDOW_DAYS)} />
          <MetricCard label="Total Tokens" value={n(inTotal + outTotal)} />
        </div>
        <div className="metric-grid">
          <MetricCard label="API Requests" value={n(apiTotal)} sparkline={dailyTotals(apiReqs, WINDOW_DAYS)} />
        </div>
        <div className="surface space-y-1 p-4 text-sm text-[var(--p-text-2)]">
          <p className="font-medium text-[var(--p-text-1)]">About these numbers</p>
          <p>
            Counts are aggregated hourly into <code className="font-mono text-xs">usage_rollups</code> and summed over
            the trailing {WINDOW_DAYS} days. The AI assistant is rate-limited to 30 requests/minute per user and keeps a
            40-turn conversation window to bound token cost.
          </p>
          <p>
            {reqTotal === 0
              ? "No AI activity recorded in this window yet."
              : "Sparklines show daily totals across the window, oldest to newest."}
          </p>
        </div>
      </div>
    </>
  );
}
