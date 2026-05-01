import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import type { ServiceRequest } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const SEV: Record<ServiceRequest["severity"], "error" | "warning" | "info" | "muted"> = {
  P1: "error",
  P2: "warning",
  P3: "info",
  P4: "muted",
};

export default async function MobileRequests() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_requests")
    .select("id, severity, category, summary, status, opened_at")
    .eq("org_id", session.orgId)
    .neq("status", "resolved")
    .neq("status", "cancelled")
    .order("opened_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as Pick<
    ServiceRequest,
    "id" | "severity" | "category" | "summary" | "status" | "opened_at"
  >[];

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Field</div>
      <div className="mt-1 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Service Requests</h1>
        <Link href="/m/requests/new" className="btn btn-primary btn-sm">
          + Open
        </Link>
      </div>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Active requests across the org.</p>

      <ul className="mt-5 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState size="compact" title="Nothing Open" description="All quiet right now." />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id}>
              <Link href={`/m/requests/${r.id}`} className="surface-raised flex flex-col gap-1 p-4">
                <div className="flex items-center gap-2">
                  <Badge variant={SEV[r.severity]}>{r.severity}</Badge>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">{r.category}</span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--text-muted)]">
                    {new Date(r.opened_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-sm font-medium">{r.summary}</div>
                <div className="font-mono text-[10px] text-[var(--text-muted)]">{r.status.replace("_", " ")}</div>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
