import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

/**
 * /m/incident — singular "My Incidents" view. Shows only the incidents
 * the caller filed, with a prominent quick-file CTA pointing at
 * /m/incident/new (the express one-field form). Distinct from
 * /m/incidents which shows the org-wide queue.
 */

type IncidentRow = {
  id: string;
  summary: string;
  severity: string;
  status: string;
  location: string | null;
  occurred_at: string;
};

const SEVERITY_TONE: Record<string, "info" | "warning" | "error" | "muted"> = {
  minor: "info",
  moderate: "warning",
  major: "error",
  critical: "error",
  fatal: "error",
};

export default async function MyIncidentsPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();

  const { data } = await supabase
    .from("incidents")
    .select("id, summary, severity, status, location, occurred_at")
    .eq("org_id", session.orgId)
    .eq("reporter_id", session.userId)
    .order("occurred_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as IncidentRow[];
  const openCount = rows.filter((r) => r.status === "open" || r.status === "investigating").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field</div>
      <h1 className="mt-1 text-2xl font-semibold">My Incidents</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Reports you filed. {openCount} open. See the org-wide queue at{" "}
        <a className="underline" href="/m/incidents">
          /m/incidents
        </a>
        .
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button href="/m/incident/new" size="sm">
          Quick-file (one field)
        </Button>
        <Button href="/m/incidents/new" variant="secondary" size="sm">
          Full report
        </Button>
      </div>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Reports Yet"
              description="Anything you file from this screen or /m/incidents/new appears here."
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link href={`/m/incidents`} className="surface block p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant={SEVERITY_TONE[r.severity] ?? "muted"}>{r.severity}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{fmt.date(r.occurred_at)}</span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-sm font-semibold">{r.summary}</h2>
                <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Badge variant={r.status === "closed" ? "muted" : "info"}>{r.status}</Badge>
                  {r.location && <span className="font-mono">{r.location}</span>}
                </div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
