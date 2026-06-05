import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { env } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import Anthropic from "@anthropic-ai/sdk";

export const dynamic = "force-dynamic";

type Anomaly = {
  entry_id: string;
  severity: "high" | "medium" | "low";
  reason: string;
  suggestion: string;
};

type ScanResult = {
  anomalies: Anomaly[];
  summary: string;
  scanned_count: number;
};

async function runAnomalyScan(orgId: string): Promise<ScanResult | { error: string }> {
  if (!env.ANTHROPIC_API_KEY) return { error: "ANTHROPIC_API_KEY is not configured" };

  const supabase = await createClient();

  // Fetch last 90 days of time entries for the org
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: entries, error } = await supabase
    .from("time_entries")
    .select("id, user_id, project_id, description, duration_minutes, billable, started_at")
    .eq("org_id", orgId)
    .gte("started_at", cutoff)
    .order("started_at", { ascending: false })
    .limit(200);

  if (error) return { error: error.message };
  if (!entries || entries.length === 0) return { anomalies: [], summary: "No time entries found in the last 90 days.", scanned_count: 0 };

  const entrySummary = entries.map((e) => ({
    id: e.id,
    user: e.user_id?.slice(0, 8),
    project: e.project_id?.slice(0, 8),
    description: e.description?.slice(0, 60),
    duration_minutes: e.duration_minutes,
    billable: e.billable,
    started_at: e.started_at,
  }));

  const prompt = `You are an auditor reviewing time entries for a live event production company. Analyze these entries for anomalies.

Time entries (last 90 days, max 200):
${JSON.stringify(entrySummary, null, 2)}

Flag entries that show:
- Unusually long durations (>16 hours in a single entry)
- Suspiciously round numbers that may indicate estimated rather than tracked time (e.g. exactly 480, 600, 720 minutes)
- Duplicate entries: same user, same project, same description, within the same week
- Very short billable entries (<15 minutes) that may represent miscoded admin time
- Missing descriptions on billable entries

Return ONLY valid JSON (no markdown):
{
  "anomalies": [
    {
      "entry_id": "uuid",
      "severity": "high" | "medium" | "low",
      "reason": "short description of the issue",
      "suggestion": "one-sentence corrective action"
    }
  ],
  "summary": "1-2 sentence overall assessment"
}

Flag at most 20 anomalies. If everything looks clean, return an empty anomalies array with a clean summary.`;

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let raw = "";
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });
    raw = msg.content[0]?.type === "text" ? msg.content[0].text : "";
  } catch (_e) {
    return { error: "AI scan failed — try again in a moment" };
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { error: "AI returned an unexpected format" };

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ScanResult;
    return { ...parsed, scanned_count: entries.length };
  } catch {
    return { error: "Failed to parse AI response" };
  }
}

const SEVERITY_TONE = {
  high: "error" as const,
  medium: "warning" as const,
  low: "info" as const,
};

export default async function AnomaliesPage() {
  const { t } = await getRequestT();

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.finance.time.anomalies.eyebrow", undefined, "Finance")}
          title={t("console.finance.time.anomalies.title", undefined, "Timesheet Anomalies")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase to use this feature.</div>
        </div>
      </>
    );
  }

  const session = await requireSession();
  const result = await runAnomalyScan(session.orgId);

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.finance.time.anomalies.eyebrow", undefined, "Finance")}
        title={t("console.finance.time.anomalies.title", undefined, "Timesheet Anomalies")}
        subtitle={
          "error" in result
            ? undefined
            : t(
                "console.finance.time.anomalies.subtitle",
                { count: result.scanned_count, flags: result.anomalies.length },
                `${result.scanned_count} entries scanned · ${result.anomalies.length} flags`,
              )
        }
        action={
          <Button href="/console/finance/time">
            {t("console.finance.time.anomalies.backToTime", undefined, "← Time Tracking")}
          </Button>
        }
      />
      <div className="page-content space-y-5">
        {"error" in result ? (
          <div className="surface rounded-xl p-6 border border-[var(--border-error)] text-sm text-[var(--text-error)]">
            {result.error}
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div className="surface rounded-xl p-5 border border-[var(--border)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                {t("console.finance.time.anomalies.summaryHeading", undefined, "AI Assessment")}
              </p>
              <p className="text-sm">{result.summary}</p>
            </div>

            {result.anomalies.length === 0 ? (
              <div className="surface rounded-xl p-8 text-center border border-[var(--border)]">
                <p className="text-sm font-medium">
                  {t("console.finance.time.anomalies.clean", undefined, "No anomalies detected")}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {t(
                    "console.finance.time.anomalies.cleanDescription",
                    undefined,
                    "All scanned entries look consistent. Run the scan again after new entries are logged.",
                  )}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {result.anomalies.map((a) => (
                  <div
                    key={a.entry_id}
                    className="surface rounded-xl p-4 border border-[var(--border)] flex items-start gap-4"
                  >
                    <div className="pt-0.5">
                      <Badge variant={SEVERITY_TONE[a.severity] ?? "muted"}>
                        {a.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.reason}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">{a.suggestion}</p>
                      <p className="font-mono text-xs text-[var(--text-tertiary)] mt-1">{a.entry_id}</p>
                    </div>
                    <Button
                      href={`/console/finance/time/${a.entry_id}/edit`}
                      size="sm"
                      variant="secondary"
                    >
                      {t("console.finance.time.anomalies.review", undefined, "Review")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
