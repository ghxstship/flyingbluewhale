import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

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

const STATUS_TONE: Record<string, "muted" | "info" | "warning" | "success" | "error"> = {
  open: "info",
  acknowledged: "info",
  in_progress: "warning",
  resolved: "success",
  cancelled: "muted",
};

const SEVERITY_TONE: Record<string, "muted" | "info" | "warning" | "error"> = {
  low: "muted",
  normal: "info",
  high: "warning",
  urgent: "error",
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
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Portal" title="Service Requests" />
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
    .from("service_requests")
    .select(
      "id, category, description, severity, status, opened_at, resolved_at, sla_response_breached, sla_resolution_breached",
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
        eyebrow="Portal · Athlete"
        title="Service Requests"
        subtitle={`${rows.length} request${rows.length === 1 ? "" : "s"} · ${open} open`}
        breadcrumbs={[
          { label: "Portal", href: `/p/${slug}` },
          { label: "Athlete", href: `/p/${slug}/athlete` },
          { label: "Requests" },
        ]}
        action={
          <Link href={`/m/requests/new`} className="btn btn-primary btn-sm">
            + New Request
          </Link>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Open" value={fmtIntl.number(open)} />
          <MetricCard label="Resolved" value={fmtIntl.number(rows.length - open)} />
          <MetricCard label="SLA Breached" value={fmtIntl.number(breached)} />
        </div>

        <section className="surface p-5">
          <h3 className="text-sm font-semibold">Your Requests</h3>
          {rows.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              No requests filed. Use the mobile app or the link above to log a new one.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--border-color)]">
              {rows.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{r.category}</div>
                    {r.description && <p className="mt-0.5 text-xs text-[var(--text-secondary)]">{r.description}</p>}
                    <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                      opened {fmt(r.opened_at)}
                      {r.resolved_at ? ` · resolved ${fmt(r.resolved_at)}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                    <Badge variant={SEVERITY_TONE[r.severity] ?? "muted"}>{r.severity}</Badge>
                    {(r.sla_response_breached || r.sla_resolution_breached) && <Badge variant="error">SLA</Badge>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-xs text-[var(--text-muted)]">
          Service requests cover medical, transport, room, dietary, equipment, and accreditation issues. Urgent medical
          concerns should always go through your medical lead first.
        </p>
      </div>
    </>
  );
}
