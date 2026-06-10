import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type Report = {
  id: string;
  status: string;
  narrative: string;
  subject_ref: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  filed: "info",
  triage: "warning",
  in_progress: "warning",
  closed: "success",
  escalated: "error",
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.athlete.safeguarding.eyebrowShort", undefined, "Portal")}
          title={t("p.athlete.safeguarding.title", undefined, "Safeguarding")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.athlete.safeguarding.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("safeguarding_reports")
    .select("id, report_state, narrative, subject_ref, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("created_at", { ascending: false });

  const reports = ((data ?? []) as unknown as Report[]) ?? [];
  const open = reports.filter((r) => r.status !== "closed").length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.athlete.safeguarding.eyebrow", undefined, "Portal · Athlete")}
        title={t("p.athlete.safeguarding.title", undefined, "Safeguarding")}
        subtitle={
          reports.length === 1
            ? t(
                "p.athlete.safeguarding.subtitleOne",
                { count: reports.length, open },
                `${reports.length} Report On File · ${open} Open`,
              )
            : t(
                "p.athlete.safeguarding.subtitleMany",
                { count: reports.length, open },
                `${reports.length} Reports On File · ${open} Open`,
              )
        }
        breadcrumbs={[
          { label: t("p.athlete.safeguarding.crumbPortal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.athlete.safeguarding.crumbAthlete", undefined, "Athlete"), href: `/p/${slug}/athlete` },
          { label: t("p.athlete.safeguarding.crumbSafeguarding", undefined, "Safeguarding") },
        ]}
      />
      <div className="page-content space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.athlete.safeguarding.channelTitle", undefined, "Confidential Reporting Channel")}
          </h3>
          <p className="mt-2 text-xs text-[var(--p-text-2)]">
            {t(
              "p.athlete.safeguarding.channelDescription",
              undefined,
              "Use this channel for any concerns about welfare, harassment, abuse, doping, or unsafe behaviour. Reports are routed to a dedicated safeguarding lead. Your identity is protected — reports are visible only to the assigned investigator.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`mailto:safeguarding@atlvs.pro?subject=Safeguarding%20report%20—%20${slug}`}
              className="ps-btn ps-btn--sm"
            >
              {t("p.athlete.safeguarding.emailLead", undefined, "Email safeguarding lead")}
            </Link>
            <Link href={`/m/incidents/new?kind=safeguarding`} className="ps-btn ps-btn--ghost ps-btn--sm">
              {t("p.athlete.safeguarding.fileViaMobile", undefined, "File via mobile")}
            </Link>
          </div>
        </section>

        <div className="metric-grid-3">
          <MetricCard label={t("p.athlete.safeguarding.metricOpen", undefined, "Open")} value={fmtIntl.number(open)} />
          <MetricCard
            label={t("p.athlete.safeguarding.metricClosed", undefined, "Closed")}
            value={fmtIntl.number(reports.length - open)}
          />
          <MetricCard
            label={t("p.athlete.safeguarding.metricTotal", undefined, "Total")}
            value={fmtIntl.number(reports.length)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">
            {t("p.athlete.safeguarding.yourReports", undefined, "Your Reports")}
          </h3>
          {reports.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.athlete.safeguarding.emptyState",
                undefined,
                "No reports filed. The channel is here when you need it.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">
                      {r.subject_ref ?? t("p.athlete.safeguarding.confidential", undefined, "Confidential")}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--p-text-2)]">{r.narrative}</p>
                    <div className="mt-1 font-mono text-[10px] text-[var(--p-text-2)]">
                      {t(
                        "p.athlete.safeguarding.filedUpdated",
                        { filed: fmt(r.created_at), updated: fmt(r.updated_at) },
                        `filed ${fmt(r.created_at)} · updated ${fmt(r.updated_at)}`,
                      )}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.athlete.safeguarding.emergencyNote",
            undefined,
            "If someone is in immediate danger, contact local emergency services first, then file a report. Anonymous reports are accepted — leave the subject blank if needed.",
          )}
        </p>
      </div>
    </>
  );
}
