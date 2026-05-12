import { ModuleHeader } from "@/components/Shell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type SurveyResponseRow = {
  id: string;
  submitted_at: string | null;
  survey: { title: string } | null;
};

type PollVoteRow = {
  created_at: string;
  poll_option: { label: string; sentiment_score: number | null } | null;
};

type RecognitionRow = {
  id: string;
  points: number;
  value_tag: string | null;
  created_at: string;
};

type WeekBucket = {
  week: string;
  surveyCount: number;
  pollPositive: number;
  pollTotal: number;
  kudosCount: number;
  sentimentScore: number;
};

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${thursday.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function sentimentLabel(score: number): "success" | "warning" | "error" | "muted" {
  if (score >= 70) return "success";
  if (score >= 40) return "warning";
  if (score > 0) return "error";
  return "muted";
}

export default async function SentimentPage() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Insights" title="Workforce Sentiment" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [surveyRes, pollRes, kudosRes] = await Promise.all([
    supabase
      .from("survey_responses")
      .select("id, submitted_at, survey:survey_id(title)")
      .eq("org_id", session.orgId)
      .gte("submitted_at", since)
      .order("submitted_at", { ascending: false })
      .limit(500),

    supabase
      .from("poll_votes")
      .select("created_at, poll_option:option_id(label, sentiment_score)")
      .eq("org_id", session.orgId)
      .gte("created_at", since)
      .limit(1000),

    supabase
      .from("recognition_posts")
      .select("id, points, value_tag, created_at")
      .eq("org_id", session.orgId)
      .is("deleted_at", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const surveys = (surveyRes.data ?? []) as SurveyResponseRow[];
  const pollVotes = (pollRes.data ?? []) as PollVoteRow[];
  const kudos = (kudosRes.data ?? []) as RecognitionRow[];

  // Bucket by ISO week
  const buckets = new Map<string, WeekBucket>();
  const ensure = (week: string) => {
    if (!buckets.has(week)) {
      buckets.set(week, { week, surveyCount: 0, pollPositive: 0, pollTotal: 0, kudosCount: 0, sentimentScore: 0 });
    }
    return buckets.get(week)!;
  };

  surveys.forEach((s) => {
    if (!s.submitted_at) return;
    ensure(isoWeek(s.submitted_at)).surveyCount++;
  });

  pollVotes.forEach((v) => {
    const b = ensure(isoWeek(v.created_at));
    b.pollTotal++;
    const score = (v.poll_option as { sentiment_score?: number | null } | null)?.sentiment_score;
    if (typeof score === "number" && score > 0) b.pollPositive++;
  });

  kudos.forEach((k) => {
    ensure(isoWeek(k.created_at)).kudosCount++;
  });

  // Compute composite sentiment score per week (0-100)
  // Weights: poll positivity 50%, kudos density 30%, survey participation 20%
  const maxKudos = Math.max(...[...buckets.values()].map((b) => b.kudosCount), 1);
  const maxSurveys = Math.max(...[...buckets.values()].map((b) => b.surveyCount), 1);
  buckets.forEach((b) => {
    const pollScore = b.pollTotal > 0 ? (b.pollPositive / b.pollTotal) * 100 : 0;
    const kudosScore = (b.kudosCount / maxKudos) * 100;
    const surveyScore = (b.surveyCount / maxSurveys) * 100;
    b.sentimentScore = Math.round(pollScore * 0.5 + kudosScore * 0.3 + surveyScore * 0.2);
  });

  const weeks = [...buckets.values()].sort((a, b) => b.week.localeCompare(a.week)).slice(0, 12);
  const latest = weeks[0];
  const overallScore = latest?.sentimentScore ?? 0;

  const totalSurveys = surveys.length;
  const totalKudos = kudos.length;
  const topTags = kudos
    .map((k) => k.value_tag)
    .filter((t): t is string => !!t)
    .reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  const topTagList = Object.entries(topTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <>
      <ModuleHeader
        eyebrow="Insights"
        title="Workforce Sentiment"
        subtitle="Beekeeper Frontline Intelligence parity — composite engagement score from polls, kudos, and survey participation over the last 90 days."
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label="Current Sentiment Score"
            value={overallScore > 0 ? `${overallScore}/100` : "—"}
            accent={overallScore >= 70}
          />
          <MetricCard label="Survey Responses (90d)" value={String(totalSurveys)} />
          <MetricCard label="Kudos Given (90d)" value={String(totalKudos)} />
        </div>

        {topTagList.length > 0 && (
          <div className="surface p-5">
            <h2 className="mb-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
              Top Recognition Values
            </h2>
            <div className="flex flex-wrap gap-2">
              {topTagList.map(([tag, count]) => (
                <div key={tag} className="flex items-center gap-1.5">
                  <Badge variant="info">{tag}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="surface p-5">
          <h2 className="mb-3 text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Weekly Sentiment Trend (last 12 weeks)
          </h2>
          {weeks.length === 0 ? (
            <EmptyState
              size="compact"
              title="No Data Yet"
              description="Sentiment aggregates from polls, kudos, and survey responses will appear here once crew engagement begins."
            />
          ) : (
            <ul className="space-y-2">
              {weeks.map((w) => (
                <li key={w.week} className="flex items-center gap-4">
                  <span className="w-20 font-mono text-xs text-[var(--text-muted)]">{w.week}</span>
                  <div className="flex flex-1 items-center gap-2">
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-[var(--surface-inset)]">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[var(--org-primary)]"
                        style={{ width: `${w.sentimentScore}%` }}
                      />
                    </div>
                    <Badge variant={sentimentLabel(w.sentimentScore)}>
                      {w.sentimentScore > 0 ? `${w.sentimentScore}` : "—"}
                    </Badge>
                  </div>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {w.surveyCount}s · {w.kudosCount}k · {w.pollTotal}p
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Score = poll positivity (50%) + kudos density (30%) + survey participation (20%). s = surveys, k = kudos,
            p = poll votes.
          </p>
        </div>
      </div>
    </>
  );
}
