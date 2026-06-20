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
  open_call_phase: string;
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

  // Bid Intelligence — submission breakdown by phase
  const { data: submissionStats } = await supabase
    .from("open_call_submissions")
    .select("open_call_submission_phase")
    .eq("open_call_id", callId)
    .eq("org_id", session.orgId);

  const stats = (submissionStats ?? []).reduce(
    (acc, row) => {
      const phase = (row.open_call_submission_phase as string) ?? "submitted";
      acc.total += 1;
      acc.byPhase[phase] = (acc.byPhase[phase] ?? 0) + 1;
      return acc;
    },
    { total: 0, byPhase: {} as Record<string, number> },
  );
  const acceptedCount = stats.byPhase["accepted"] ?? 0;
  const shortlistedCount = stats.byPhase["shortlisted"] ?? 0;
  const declinedCount = stats.byPhase["declined"] ?? 0;
  const pendingCount = stats.total - acceptedCount - shortlistedCount - declinedCount;

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.marketplace.calls.detail.eyebrow", undefined, "Marketplace")} · ${toTitle(c.kind)}`}
        title={c.title}
        subtitle={[c.region, c.venue_type].filter(Boolean).join(" · ") || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge variant={STATUS_TONE[c.open_call_phase] ?? "muted"}>{toTitle(c.open_call_phase)}</Badge>
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
        <CallControls callId={c.id} status={c.open_call_phase} publicSlug={c.public_slug} />

        {/* Bid Intelligence — GigSalad Lead Insights parity */}
        <section className="surface p-5">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            {t("console.marketplace.calls.detail.bidIntel", undefined, "Bid Intelligence")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: t("console.marketplace.calls.detail.totalBids", undefined, "Total Bids"), value: stats.total, accent: false },
              { label: t("console.marketplace.calls.detail.pending", undefined, "Under Review"), value: pendingCount, accent: false },
              { label: t("console.marketplace.calls.detail.shortlisted", undefined, "Shortlisted"), value: shortlistedCount, accent: true },
              { label: t("console.marketplace.calls.detail.accepted", undefined, "Accepted"), value: acceptedCount, accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="surface-raised rounded-lg p-3 text-center">
                <div
                  className={[
                    "text-2xl font-bold tabular-nums",
                    accent ? "text-[var(--p-accent)]" : "text-[var(--p-text-1)]",
                  ].join(" ")}
                >
                  {value}
                </div>
                <div className="mt-0.5 text-xs text-[var(--p-text-2)]">{label}</div>
              </div>
            ))}
          </div>
          {stats.total > 0 && (
            <div className="mt-3">
              <div className="flex h-2 overflow-hidden rounded-full bg-[var(--p-border)]">
                {acceptedCount > 0 && (
                  <div
                    className="h-full bg-[var(--p-ok)]"
                    style={{ width: `${(acceptedCount / stats.total) * 100}%` }}
                  />
                )}
                {shortlistedCount > 0 && (
                  <div
                    className="h-full bg-[var(--p-accent)]"
                    style={{ width: `${(shortlistedCount / stats.total) * 100}%` }}
                  />
                )}
                {declinedCount > 0 && (
                  <div
                    className="h-full bg-[var(--p-danger)]"
                    style={{ width: `${(declinedCount / stats.total) * 100}%` }}
                  />
                )}
              </div>
              <div className="mt-1 flex gap-3 text-xs text-[var(--p-text-2)]">
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--p-ok)] mr-1" />
                  {t("console.marketplace.calls.detail.accepted", undefined, "Accepted")}
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--p-accent)] mr-1" />
                  {t("console.marketplace.calls.detail.shortlisted", undefined, "Shortlisted")}
                </span>
                <span>
                  <span className="inline-block w-2 h-2 rounded-full bg-[var(--p-danger)] mr-1" />
                  {t("console.marketplace.calls.detail.declined", undefined, "Declined")}
                </span>
              </div>
            </div>
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
