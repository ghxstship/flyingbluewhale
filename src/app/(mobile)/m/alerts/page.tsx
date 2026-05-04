import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { acknowledgeAlert } from "./actions";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AlertRow = {
  id: string;
  title: string;
  body: string;
  severity: string;
  sent_at: string | null;
  scheduled_at: string | null;
};

const SEVERITY_TONE: Record<string, "error" | "warning" | "info" | "muted"> = {
  critical: "error",
  emergency: "error",
  major: "error",
  warning: "warning",
  watch: "warning",
  advisory: "info",
  info: "info",
};

export default async function AlertsPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const [{ data: alerts }, { data: receipts }] = await Promise.all([
    supabase
      .from("crisis_alerts")
      .select("id, title, body, severity, sent_at, scheduled_at")
      .eq("org_id", session.orgId)
      .or(`sent_at.gte.${cutoff},scheduled_at.gte.${cutoff}`)
      .order("sent_at", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("crisis_alert_receipts")
      .select("alert_id, acknowledged_at")
      .eq("org_id", session.orgId)
      .eq("user_id", session.userId),
  ]);

  const ackMap = new Map<string, string | null>();
  for (const r of (receipts ?? []) as Array<{ alert_id: string; acknowledged_at: string | null }>) {
    ackMap.set(r.alert_id, r.acknowledged_at);
  }
  const rows = (alerts ?? []) as AlertRow[];
  const unacked = rows.filter((a) => !ackMap.get(a.id)).length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Alerts</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {rows.length === 0 ? "No active alerts." : `${unacked} unacknowledged of ${rows.length} active`}
      </p>

      <ul className="mt-5 space-y-3">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Active Alerts"
              description="Crisis notifications appear here when activated."
            />
          </li>
        ) : (
          rows.map((a) => {
            const ack = ackMap.get(a.id);
            const tone = SEVERITY_TONE[a.severity.toLowerCase()] ?? "muted";
            return (
              <li key={a.id} className={`surface p-4 ${ack ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <Badge variant={tone}>{a.severity}</Badge>
                  <span className="font-mono text-xs text-[var(--text-muted)]">
                    {a.sent_at ? fmt.time(a.sent_at) : "scheduled"}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-semibold">{a.title}</h2>
                <p className="mt-1 text-xs whitespace-pre-wrap text-[var(--text-secondary)]">{a.body}</p>
                <div className="mt-3 flex items-center justify-end gap-2">
                  {ack ? (
                    <span className="text-xs text-[var(--text-muted)]">Acknowledged {fmt.time(ack)}</span>
                  ) : (
                    <form action={acknowledgeAlert}>
                      <input type="hidden" name="alertId" value={a.id} />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Acknowledge
                      </button>
                    </form>
                  )}
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
