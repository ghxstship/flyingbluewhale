import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type AutomationRow = {
  id: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  enabled: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  updated_at: string;
};

const TRIGGER_TONE: Record<string, "muted" | "info" | "success" | "warning"> = {
  manual: "muted",
  schedule: "info",
  webhook: "info",
  event: "success",
};

const RUN_TONE: Record<string, "muted" | "success" | "warning" | "error"> = {
  ok: "success",
  success: "success",
  failed: "error",
  error: "error",
  running: "warning",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="AI" title="Automations" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const { data } = await supabase
    .from("automations")
    .select("id, name, description, trigger_kind, enabled, last_run_at, last_run_status, updated_at")
    .eq("org_id", session.orgId)
    .order("updated_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as AutomationRow[];
  const enabled = rows.filter((r) => r.enabled).length;
  const failing = rows.filter((r) => r.last_run_status && ["failed", "error"].includes(r.last_run_status)).length;

  return (
    <>
      <ModuleHeader
        eyebrow="AI"
        title="Automations"
        subtitle={`${rows.length} automation${rows.length === 1 ? "" : "s"} · ${enabled} enabled${failing ? ` · ${failing} failing` : ""}`}
        action={
          <Button href="/console/ai/automations/new" size="sm">
            + New Automation
          </Button>
        }
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Enabled" value={fmt.number(enabled)} accent />
          <MetricCard label="Total" value={fmt.number(rows.length)} />
          <MetricCard label="Failing Last Run" value={fmt.number(failing)} />
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No Automations Yet"
            description="Author AI-driven automations triggered manually, on a cron schedule, by webhooks, or by domain events."
            action={
              <Button href="/console/ai/automations/new" size="sm">
                + New Automation
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/console/ai/automations/${r.id}`}
                  className="surface flex items-center justify-between p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {r.name}
                      <Badge variant={TRIGGER_TONE[r.trigger_kind] ?? "muted"}>{r.trigger_kind}</Badge>
                      {!r.enabled && <Badge variant="muted">Disabled</Badge>}
                    </div>
                    {r.description && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--text-muted)]">{r.description}</p>
                    )}
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      Last run {relativeTime(r.last_run_at)}
                    </div>
                  </div>
                  {r.last_run_status && (
                    <Badge variant={RUN_TONE[r.last_run_status] ?? "muted"}>{r.last_run_status}</Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
