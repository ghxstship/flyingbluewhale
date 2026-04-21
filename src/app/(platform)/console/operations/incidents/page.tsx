export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusChip, type StatusTone } from "@/components/ui/StatusChip";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Incidents list — Opportunity #18 UI surface. */

const SEVERITY_TONE: Record<string, StatusTone> = {
  near_miss: "warning",
  minor: "info",
  major: "warning",
  critical: "danger",
};

export default async function IncidentsPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: incidents } = await supabase
    .from("incidents")
    .select("id, summary, severity, status, occurred_at, location")
    .eq("org_id", session.orgId)
    .order("occurred_at", { ascending: false })
    .limit(200);

  return (
    <>
      <ModuleHeader
        eyebrow="Operations"
        title="Incidents"
        subtitle="Field-logged safety + near-miss reports."
        action={<Button href="/console/operations/incidents/new" size="sm">Log incident</Button>}
      />
      <div className="page-content max-w-6xl">
        {incidents && incidents.length > 0 ? (
          <table className="data-table w-full text-sm">
            <thead>
              <tr>
                <th>When</th>
                <th>Severity</th>
                <th>Summary</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr key={i.id}>
                  <td className="font-mono text-xs">{new Date(i.occurred_at).toLocaleString()}</td>
                  <td>
                    <StatusChip tone={SEVERITY_TONE[i.severity] ?? "neutral"}>
                      {i.severity}
                    </StatusChip>
                  </td>
                  <td>{i.summary}</td>
                  <td className="text-[var(--text-muted)]">{i.location ?? "—"}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            title="No incidents reported"
            description="Log one from the console or field-log from the mobile shell at /m/incidents/new."
            action={
              <Link className="text-xs text-[var(--org-primary)]" href="/console/operations/incidents/new">
                Log incident →
              </Link>
            }
          />
        )}
      </div>
    </>
  );
}
