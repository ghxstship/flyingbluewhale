import { ModuleHeader } from "@/components/Shell";
import { DataTable } from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { STATUS_TONE } from "@/lib/marketplace";
import { toTitle } from "@/lib/format";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AppRow = {
  id: string;
  applicant_user_id: string;
  status: string;
  score: number | null;
  day_rate_proposed_cents: number | null;
  applied_at: string;
  cover_note: string | null;
};

export default async function Page({ params }: { params: Promise<{ postingId: string }> }) {
  const { postingId } = await params;
  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const fmtDate = (iso: string) => fmt.dateParts(iso, { month: "short", day: "numeric", year: "numeric" });

  const [postingResp, appsResp] = await Promise.all([
    supabase
      .from("job_postings")
      .select("id, title, applicant_count, status")
      .eq("id", postingId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("job_applications")
      .select("id, applicant_user_id, status, score, day_rate_proposed_cents, applied_at, cover_note")
      .eq("job_posting_id", postingId)
      .eq("org_id", session.orgId)
      .order("applied_at", { ascending: false })
      .limit(500),
  ]);
  if (!postingResp.data) return notFound();
  const posting = postingResp.data as { id: string; title: string; applicant_count: number; status: string };
  const rows = (appsResp.data ?? []) as AppRow[];

  // Lead Insights — GigSalad parity: competitive intelligence on applicant pool
  const total = rows.length;
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const scoredRows = rows.filter((r) => r.score != null);
  const avgScore = scoredRows.length
    ? Math.round(scoredRows.reduce((s, r) => s + (r.score ?? 0), 0) / scoredRows.length)
    : null;
  const rateRows = rows.filter((r) => r.day_rate_proposed_cents != null);
  const avgRate = rateRows.length
    ? Math.round(rateRows.reduce((s, r) => s + (r.day_rate_proposed_cents ?? 0), 0) / rateRows.length)
    : null;
  const dates = rows.map((r) => new Date(r.applied_at).getTime()).sort((a, b) => a - b);
  const velocityDays = dates.length >= 2 ? Math.round((dates[dates.length - 1] - dates[0]) / 86_400_000) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={`${t("console.marketplace.postings.applicants.eyebrowPrefix", undefined, "Marketplace")} · ${posting.title}`}
        title={t("console.marketplace.postings.applicants.title", undefined, "Applicants")}
        subtitle={t(
          "console.marketplace.postings.applicants.subtitle",
          { total: rows.length, unreviewed: rows.filter((r) => r.status === "new").length },
          `${rows.length} Total · ${rows.filter((r) => r.status === "new").length} unreviewed`,
        )}
      />
      <div className="page-content space-y-5">
        {total > 0 && (
          <div className="surface rounded-xl p-5 border border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
              {t("console.marketplace.postings.applicants.insights.heading", undefined, "Lead Insights")}
            </p>
            <div className="metric-grid">
              <div>
                <p className="text-2xl font-bold tabular-nums">{total}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.postings.applicants.insights.total", undefined, "Total Applicants")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{byStatus["new"] ?? 0}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.postings.applicants.insights.pending", undefined, "Awaiting Review")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{byStatus["phone"] ?? 0}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.postings.applicants.insights.interview", undefined, "In Interview")}
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{byStatus["booked"] ?? 0}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {t("console.marketplace.postings.applicants.insights.booked", undefined, "Booked")}
                </p>
              </div>
              {avgScore != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">{avgScore}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.postings.applicants.insights.avgScore", undefined, "Avg Score")}
                  </p>
                </div>
              )}
              {avgRate != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">${Math.round(avgRate / 100)}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.postings.applicants.insights.avgRate", undefined, "Avg Day Rate")}
                  </p>
                </div>
              )}
              {velocityDays != null && (
                <div>
                  <p className="text-2xl font-bold tabular-nums">{velocityDays}d</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    {t("console.marketplace.postings.applicants.insights.spread", undefined, "Application Spread")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        <DataTable<AppRow>
          rows={rows}
          rowHref={(r) => `/console/marketplace/postings/${posting.id}/applicants/${r.id}`}
          emptyLabel={t("console.marketplace.postings.applicants.emptyLabel", undefined, "No applicants yet")}
          emptyDescription={t(
            "console.marketplace.postings.applicants.emptyDescription",
            undefined,
            "Once published, applications appear here.",
          )}
          columns={[
            {
              key: "applied",
              header: t("console.marketplace.postings.applicants.columns.applied", undefined, "Applied"),
              render: (r) => fmtDate(r.applied_at),
              accessor: (r) => r.applied_at,
              className: "font-mono text-xs",
            },
            {
              key: "applicant",
              header: t("console.marketplace.postings.applicants.columns.applicant", undefined, "Applicant"),
              render: (r) => <span className="font-mono text-xs">{r.applicant_user_id.slice(0, 8)}</span>,
              accessor: (r) => r.applicant_user_id,
            },
            {
              key: "status",
              header: t("console.marketplace.postings.applicants.columns.stage", undefined, "Stage"),
              render: (r) => <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>,
              accessor: (r) => r.status,
              filterable: true,
              groupable: true,
            },
            {
              key: "score",
              header: t("console.marketplace.postings.applicants.columns.score", undefined, "Score"),
              render: (r) => (r.score == null ? "—" : `${r.score}`),
              accessor: (r) => Number(r.score ?? 0),
              className: "font-mono text-xs tabular-nums",
            },
            {
              key: "rate",
              header: t("console.marketplace.postings.applicants.columns.proposedRate", undefined, "Proposed Rate"),
              render: (r) => (r.day_rate_proposed_cents ? `$${(r.day_rate_proposed_cents / 100).toFixed(0)}` : "—"),
              accessor: (r) => Number(r.day_rate_proposed_cents ?? 0),
              className: "font-mono text-xs",
            },
            {
              key: "cover",
              header: t("console.marketplace.postings.applicants.columns.note", undefined, "Note"),
              render: (r) => (r.cover_note ? r.cover_note.slice(0, 80) + (r.cover_note.length > 80 ? "…" : "") : "—"),
              accessor: (r) => r.cover_note ?? null,
            },
          ]}
        />
      </div>
    </>
  );
}
