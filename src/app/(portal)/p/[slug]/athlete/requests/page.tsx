import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { urlFor } from "@/lib/urls";
import { PRIORITY_TONE, toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  category: string;
  description: string | null;
  severity: string;
  status: string;
  opened_at: string;
  resolved_at: string | null;
  sla_response_breached: boolean;
  sla_resolution_breached: boolean;
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("p.athlete.requests.eyebrow.short", undefined, "Portal")}
          title={t("p.athlete.requests.title", undefined, "Service Requests")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("p.athlete.requests.configureSupabase", undefined, "Configure Supabase.")}
          </div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("service_requests")
    .select(
      "id, category, description, severity, status:request_state, opened_at, resolved_at, sla_response_breached, sla_resolution_breached",
    )
    .eq("org_id", session.orgId)
    .eq("requester_id", session.userId)
    .order("opened_at", { ascending: false });

  const rows = ((data ?? []) as unknown as RequestRow[]) ?? [];
  const open = rows.filter((r) => r.status !== "resolved" && r.status !== "cancelled").length;
  const breached = rows.filter((r) => r.sla_response_breached || r.sla_resolution_breached).length;

  return (
    <>
      <ModuleHeader
        eyebrow={t("p.athlete.requests.eyebrowLabel", undefined, "Portal · Athlete")}
        title={t("p.athlete.requests.title", undefined, "Service Requests")}
        subtitle={
          rows.length === 1
            ? t(
                "p.athlete.requests.subtitle.singular",
                { count: rows.length, open },
                `${rows.length} Request · ${open} Open`,
              )
            : t(
                "p.athlete.requests.subtitle.plural",
                { count: rows.length, open },
                `${rows.length} Requests · ${open} Open`,
              )
        }
        breadcrumbs={[
          { label: t("p.athlete.requests.breadcrumb.portal", undefined, "Portal"), href: `/p/${slug}` },
          { label: t("p.athlete.requests.breadcrumb.athlete", undefined, "Athlete"), href: `/p/${slug}/athlete` },
          { label: t("p.athlete.requests.breadcrumb.requests", undefined, "Requests") },
        ]}
        action={
          <Link href={urlFor("mobile", "/requests/new")} className="ps-btn ps-btn--sm">
            {t("p.athlete.requests.actions.new", undefined, "+ New Request")}
          </Link>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label={t("p.athlete.requests.metrics.open", undefined, "Open")} value={fmtIntl.number(open)} />
          <MetricCard
            label={t("p.athlete.requests.metrics.resolved", undefined, "Resolved")}
            value={fmtIntl.number(rows.length - open)}
          />
          <MetricCard
            label={t("p.athlete.requests.metrics.slaBreached", undefined, "SLA Breached")}
            value={fmtIntl.number(breached)}
          />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">{t("p.athlete.requests.list.heading", undefined, "Your Requests")}</h3>
          {rows.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--p-text-2)]">
              {t(
                "p.athlete.requests.empty",
                undefined,
                "No requests filed. Use the mobile app or the link above to log a new one.",
              )}
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--p-border)]">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{r.category}</div>
                    {r.description && <p className="mt-0.5 text-xs text-[var(--p-text-2)]">{r.description}</p>}
                    <div className="mt-1 font-mono text-[10px] text-[var(--p-text-2)]">
                      {t("p.athlete.requests.row.opened", { date: fmt(r.opened_at) }, `opened ${fmt(r.opened_at)}`)}
                      {r.resolved_at
                        ? t(
                            "p.athlete.requests.row.resolvedSuffix",
                            { date: fmt(r.resolved_at) },
                            ` · resolved ${fmt(r.resolved_at)}`,
                          )
                        : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={toneFor(r.status)}>{toTitle(r.status)}</Badge>
                    <Badge variant={PRIORITY_TONE[r.severity] ?? "default"}>{toTitle(r.severity)}</Badge>
                    {(r.sla_response_breached || r.sla_resolution_breached) && (
                      <Badge variant="error">{t("p.athlete.requests.badge.sla", undefined, "SLA")}</Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--p-text-2)]">
          {t(
            "p.athlete.requests.footnote",
            undefined,
            "Service requests cover medical, transport, room, dietary, equipment, and accreditation issues. Urgent medical concerns should always go through your medical lead first.",
          )}
        </p>
      </div>
    </>
  );
}
