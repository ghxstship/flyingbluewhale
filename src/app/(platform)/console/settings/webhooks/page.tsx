export const dynamic = "force-dynamic";

import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/components/detail/DetailShell";

const EVENTS = [
  "project.created", "project.status_changed",
  "invoice.sent", "invoice.paid",
  "proposal.sent", "proposal.signed",
  "deliverable.submitted", "deliverable.approved",
  "ticket.scanned",
  "po.acknowledged", "po.fulfilled",
  "incident.filed",
  "passkey.registered",
  "account.deletion_requested",
];

export default async function WebhooksPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data: endpoints } = await supabase
    .from("webhook_endpoints")
    .select("id, url, description, events, is_active, last_delivery_at, last_error, failure_count, created_at")
    .eq("org_id", session.orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  const rows = (endpoints ?? []) as Array<{
    id: string; url: string; description: string | null; events: string[];
    is_active: boolean; last_delivery_at: string | null; last_error: string | null;
    failure_count: number; created_at: string;
  }>;
  return (
    <>
      <ModuleHeader
        eyebrow="Settings"
        title="Webhooks"
        subtitle="Outgoing event notifications to your endpoints — HMAC-signed, retried up to 5× with exponential backoff."
        action={
          <Link
            href="/console/settings/webhooks/new"
            className="inline-flex items-center gap-1 rounded bg-[var(--org-primary)] px-3 py-1.5 text-xs font-medium text-white"
          >
            + New endpoint
          </Link>
        }
      />
      <div className="page-content space-y-4">
        <div className="surface p-5">
          <h3 className="text-sm font-semibold">Subscribable events</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {EVENTS.map((e) => (
              <Badge key={e} variant="muted">
                <span className="font-mono">{e}</span>
              </Badge>
            ))}
            <Badge variant="info">
              <span className="font-mono">*</span>
            </Badge>
          </div>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Use <span className="font-mono">*</span> to subscribe to every event.
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No endpoints registered"
            description="Register an endpoint to receive real-time events. Payloads are HMAC-signed with a secret shown once at creation."
          />
        ) : (
          <div className="surface">
            <table className="data-table w-full text-sm">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Events</th>
                  <th>State</th>
                  <th>Last delivery</th>
                  <th>Failures</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">
                      <div className="max-w-xs truncate" title={r.url}>{r.url}</div>
                      {r.description && <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{r.description}</div>}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {r.events.slice(0, 3).map((e) => (
                          <span key={e} className="rounded bg-[var(--surface-inset)] px-1.5 py-0.5 font-mono text-[10px]">{e}</span>
                        ))}
                        {r.events.length > 3 && (
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">+{r.events.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        r.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-slate-500/10 text-slate-600"
                      }`}>
                        {r.is_active ? "active" : "paused"}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{fmtDate(r.last_delivery_at)}</td>
                    <td className="font-mono text-xs">{r.failure_count}</td>
                    <td>
                      <Link href={`/console/settings/webhooks/${r.id}`} className="text-xs text-[var(--org-primary)]">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
