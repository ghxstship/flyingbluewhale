import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { formatDateParts } from "@/lib/i18n/format";

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
  return formatDateParts(iso, { month: "short", day: "numeric", year: "numeric" });
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Safeguarding" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmtIntl = await getRequestFormatters();
  const { data } = await supabase
    .from("safeguarding_reports")
    .select("id, status, narrative, subject_ref, created_at, updated_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("created_at", { ascending: false });

  const reports = ((data ?? []) as unknown as Report[]) ?? [];
  const open = reports.filter((r) => r.status !== "closed").length;

  return (
    <>
      <ModuleHeader
        eyebrow="Portal · Athlete"
        title="Safeguarding"
        subtitle={`${reports.length} Report${reports.length === 1 ? "" : "s"} On File · ${open} Open`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Athlete", href: `/p/${slug}/athlete` },
          { label: "Safeguarding" },
        ]}
      />
      <div className="page-content space-y-5">
        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Confidential Reporting Channel</h3>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">
            Use this channel for any concerns about welfare, harassment, abuse, doping, or unsafe behaviour. Reports are
            routed to a dedicated safeguarding lead. Your identity is protected — reports are visible only to the
            assigned investigator.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`mailto:safeguarding@atlvs.pro?subject=Safeguarding%20report%20—%20${slug}`}
              className="btn btn-primary btn-sm"
            >
              Email safeguarding lead
            </Link>
            <Link href={`/m/incidents/new?kind=safeguarding`} className="btn btn-secondary btn-sm">
              File via mobile
            </Link>
          </div>
        </section>

        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmtIntl.number(open)} />
          <MetricCard label="Closed" value={fmtIntl.number(reports.length - open)} />
          <MetricCard label="Total" value={fmtIntl.number(reports.length)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Reports</h3>
          {reports.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No reports filed. The channel is here when you need it.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {reports.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{r.subject_ref ?? "Confidential"}</div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-secondary)]">{r.narrative}</p>
                    <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                      filed {fmt(r.created_at)} · updated {fmt(r.updated_at)}
                    </div>
                  </div>
                  <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{toTitle(r.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          If someone is in immediate danger, contact local emergency services first, then file a report. Anonymous
          reports are accepted — leave the subject blank if needed.
        </p>
      </div>
    </>
  );
}
