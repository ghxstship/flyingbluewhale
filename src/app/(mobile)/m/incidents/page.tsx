import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type IncidentRow = {
  id: string;
  occurred_at: string;
  location: string | null;
  summary: string;
  severity: string;
  status: string;
};

const SEVERITY_TONE: Record<string, "muted" | "warning" | "error"> = {
  low: "muted",
  medium: "warning",
  high: "error",
  critical: "error",
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  open: "warning",
  triage: "info",
  in_progress: "info",
  resolved: "success",
  closed: "muted",
};

export default async function MobileIncidentPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const relativeTime = (iso: string): string => {
    const ms = Date.now() - new Date(iso).getTime();
    const min = Math.floor(ms / 60_000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d`;
    return fmt.dateParts(iso, { month: "short", day: "numeric" });
  };
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("incidents")
    .select("id, occurred_at, location, summary, severity, status")
    .eq("org_id", session.orgId)
    .gte("occurred_at", since)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as IncidentRow[];

  const open = rows.filter((r) => !["resolved", "closed"].includes(r.status)).length;
  const critical = rows.filter((r) => r.severity === "critical").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">Incident</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0
          ? "No incidents logged in the last 30 days."
          : `${rows.length} in last 30 days · ${open} open${critical ? ` · ${critical} critical` : ""}`}
      </p>

      <Link href="/m/incidents/new" className="btn btn-primary mt-5 w-full">
        + Report incident
      </Link>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="All Quiet"
              description="Incidents reported here are routed to admin and EHS lead in real time."
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link href={`/console/operations/incidents/${r.id}`} className="surface flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm leading-snug font-semibold">{r.summary}</div>
                    <span className="flex-none font-mono text-xs text-[var(--text-muted)]">
                      {relativeTime(r.occurred_at)}
                    </span>
                  </div>
                  {r.location && <div className="mt-1 text-xs text-[var(--text-muted)]">{r.location}</div>}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={SEVERITY_TONE[r.severity] ?? "muted"}>{r.severity}</Badge>
                    <Badge variant={STATUS_TONE[r.status] ?? "muted"}>{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
