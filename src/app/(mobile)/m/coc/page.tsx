import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type AuditRow = {
  id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: unknown;
  at: string;
};

const COC_TABLES = ["incidents", "incident_photos", "credentials", "evidence_uploads", "deliverables", "ticket_scans"];

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function MobileCocPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("audit_log")
    .select("id, action, target_table, target_id, metadata, at")
    .eq("org_id", session.orgId)
    .eq("actor_id", session.userId)
    .in("target_table", COC_TABLES)
    .gte("at", since)
    .order("at", { ascending: false })
    .limit(20);
  const rows = (data ?? []) as AuditRow[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--org-primary))] uppercase">
        Field
      </div>
      <h1 className="mt-1 text-2xl font-semibold">Chain of Custody</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Evidence + sample handover trail. Capture by uploading evidence on an incident, scan, or credential.
      </p>

      <section className="mt-5 grid grid-cols-2 gap-2">
        <Link href="/m/incidents/new" className="surface-raised p-3 text-center text-sm font-medium">
          + Log incident
        </Link>
        <Link href="/m/inventory/scan" className="surface-raised p-3 text-center text-sm font-medium">
          Scan asset
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          My recent custody events
        </h2>
        <ul className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <li>
              <EmptyState
                size="compact"
                title="Nothing in the Last 7 Days"
                description="Custody events you create are auto-logged into the audit trail and appear here."
              />
            </li>
          ) : (
            rows.map((r) => (
              <li key={r.id} className="surface flex items-center justify-between p-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{r.action.replace(/[._]/g, " ")}</div>
                  {r.target_table && (
                    <div className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      {r.target_table}
                      {r.target_id ? ` · ${r.target_id.slice(0, 8)}` : ""}
                    </div>
                  )}
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Badge variant="muted">Audit</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">{relativeTime(r.at)}</span>
                </div>
              </li>
            ))
          )}
        </ul>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Need the desktop view?{" "}
          <Link href="/console/compliance/coc" className="text-[var(--org-primary)]">
            Open Chain of Custody
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
