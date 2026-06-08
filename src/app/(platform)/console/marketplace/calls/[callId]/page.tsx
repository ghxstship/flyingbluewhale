import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { notFound } from "next/navigation";
import { formatFeeRange, STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { getRequestT } from "@/lib/i18n/request";
import { CallControls } from "./CallControls";

export const dynamic = "force-dynamic";

type Call = {
  id: string;
  title: string;
  public_slug: string;
  kind: string;
  description: string | null;
  status: string;
  region: string | null;
  venue_type: string | null;
  genre_tags: string[];
  trade_categories: string[];
  performance_date: string | null;
  slot_length_min: number | null;
  fee_min_cents: number | null;
  fee_max_cents: number | null;
  currency: string;
  deadline_at: string | null;
  submission_count: number;
};

export default async function Page({ params }: { params: Promise<{ callId: string }> }) {
  const { callId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const { t } = await getRequestT();
  const { data } = await supabase
    .from("open_calls")
    .select("*")
    .eq("id", callId)
    .eq("org_id", session.orgId)
    .maybeSingle();
  if (!data) return notFound();
  const c = data as Call;

  // Submission insights — aggregate metrics for the Lead Insights panel
  const { data: subs } = await supabase
    .from("open_call_submissions")
    .select("submission_state, score, ai_match_score, submitted_at, reviewed_at")
    .eq("open_call_id", callId)
    .eq("org_id", session.orgId);

  const subRows = subs ?? [];
  const totalSubs = subRows.length;
  const reviewedSubs = subRows.filter((s) => s.reviewed_at).length;
  const avgScore =
    subRows.filter((s) => s.score != null).length > 0
      ? Math.round(
          subRows.filter((s) => s.score != null).reduce((a, s) => a + (s.score ?? 0), 0) /
            subRows.filter((s) => s.score != null).length,
        )
      : null;
  const avgAiScore =
    subRows.filter((s) => s.ai_match_score != null).length > 0
      ? Number(
          (
            subRows.filter((s) => s.ai_match_score != null).reduce((a, s) => a + Number(s.ai_match_score ?? 0), 0) /
            subRows.filter((s) => s.ai_match_score != null).length
          ).toFixed(1),
        )
      : null;
  const shortlistedCount = subRows.filter((s) => s.submission_state === "shortlisted").length;
  const responseRate = totalSubs > 0 ? Math.round((reviewedSubs / totalSubs) * 100) : 0;

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.marketplace.calls.detail.eyebrow", undefined, "Marketplace")} · ${toTitle(c.kind)}`}
        title={c.title}
        subtitle={[c.region, c.venue_type].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{toTitle(c.status)}</Badge>
            <Button href={`/console/marketplace/calls/${c.id}/submissions`} size="sm" variant="ghost">
              {t(
                "console.marketplace.calls.detail.submissionsCount",
                { count: c.submission_count },
                `${c.submission_count} submissions`,
              )}
            </Button>
            <Button href={`/console/marketplace/calls/${c.id}/edit`} size="sm" variant="ghost">
              {t("common.edit", undefined, "Edit")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-5">
        <CallControls callId={c.id} status={c.status} publicSlug={c.public_slug} />

        {/* Lead Insights — inspired by GigSalad (Mar 2025): surface competition + review velocity */}
        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.detail.insights.title", undefined, "Lead Insights")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="surface-inset rounded-lg p-3 text-center">
              <div className="text-2xl font-bold tabular-nums">{totalSubs}</div>
              <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.insights.submissions", undefined, "Submissions")}
              </div>
            </div>
            <div className="surface-inset rounded-lg p-3 text-center">
              <div className="text-2xl font-bold tabular-nums">{shortlistedCount}</div>
              <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.insights.shortlisted", undefined, "Shortlisted")}
              </div>
            </div>
            <div className="surface-inset rounded-lg p-3 text-center">
              <div className="text-2xl font-bold tabular-nums">{responseRate}%</div>
              <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.insights.reviewRate", undefined, "Review rate")}
              </div>
            </div>
            <div className="surface-inset rounded-lg p-3 text-center">
              <div className="text-2xl font-bold tabular-nums">
                {avgAiScore != null ? avgAiScore : avgScore != null ? avgScore : "—"}
              </div>
              <div className="mt-0.5 text-xs text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.insights.avgScore", undefined, "Avg match score")}
              </div>
            </div>
          </div>
          {totalSubs === 0 && c.status === "published" && (
            <p className="mt-3 text-xs text-[var(--p-text-2)]">
              {t(
                "console.marketplace.calls.detail.insights.empty",
                undefined,
                "No submissions yet. Share the public link to start receiving applicants.",
              )}
            </p>
          )}
        </section>

        <section className="surface p-5">
          <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.detail.description", undefined, "Description")}
          </h2>
          <div className="text-sm whitespace-pre-wrap text-[var(--p-text-1)]">{c.description ?? "—"}</div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.calls.detail.eligibility", undefined, "Eligibility")}
            </h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.performance", undefined, "Performance")}
              </dt>
              <dd>{c.performance_date ?? "—"}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.slotLength", undefined, "Slot length")}
              </dt>
              <dd>
                {c.slot_length_min
                  ? t(
                      "console.marketplace.calls.detail.slotLengthMin",
                      { min: c.slot_length_min },
                      `${c.slot_length_min} min`,
                    )
                  : "—"}
              </dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.feeBand", undefined, "Fee band")}
              </dt>
              <dd>{formatFeeRange(c.fee_min_cents, c.fee_max_cents, c.currency)}</dd>
              <dt className="text-[var(--p-text-2)]">
                {t("console.marketplace.calls.detail.deadline", undefined, "Deadline")}
              </dt>
              <dd>{c.deadline_at ? new Date(c.deadline_at).toLocaleString() : "—"}</dd>
            </dl>
          </div>
          <div className="surface p-5">
            <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
              {t("console.marketplace.calls.detail.tags", undefined, "Tags")}
            </h2>
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-xs text-[var(--p-text-2)]">
                  {t("console.marketplace.calls.detail.genres", undefined, "Genres")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.genre_tags.length === 0 ? (
                    <span className="text-sm text-[var(--p-text-2)]">—</span>
                  ) : (
                    c.genre_tags.map((g) => (
                      <Badge key={g} variant="muted">
                        {g}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs text-[var(--p-text-2)]">
                  {t("console.marketplace.calls.detail.trades", undefined, "Trades")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {c.trade_categories.length === 0 ? (
                    <span className="text-sm text-[var(--p-text-2)]">—</span>
                  ) : (
                    c.trade_categories.map((tag) => (
                      <Badge key={tag} variant="muted">
                        {tag}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
