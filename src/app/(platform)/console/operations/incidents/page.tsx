export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Incidents list — Opportunity #18 UI surface. */

const SEVERITY_COLORS: Record<string, string> = {
  near_miss: "#A16207",
  minor: "#2563EB",
  major: "#EA580C",
  critical: "#991B1B",
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
        action={
          <Link href="/m/incidents/new" className="btn btn-primary btn-sm">
            Log on mobile
          </Link>
        }
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
                    <span
                      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                      style={{ backgroundColor: SEVERITY_COLORS[i.severity] ?? "#666" }}
                    >
                      {i.severity}
                    </span>
                  </td>
                  <td>{i.summary}</td>
                  <td className="text-[var(--text-muted)]">{i.location ?? "—"}</td>
                  <td>{i.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="surface p-6 text-center text-sm text-[var(--text-muted)]">
            No incidents reported. Crews can log them from the mobile shell at
            <Link className="ml-1 underline" href="/m/incidents/new">/m/incidents/new</Link>.
          </div>
        )}
      </div>
    </>
  );
}
