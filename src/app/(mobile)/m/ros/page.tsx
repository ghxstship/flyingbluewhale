import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type CueRow = {
  id: string;
  scheduled_at: string;
  lane: string;
  label: string;
  description: string | null;
  status: "pending" | "standby" | "live" | "done" | "cancelled" | string;
  duration_seconds: number | null;
};

const STATUS_TONE: Record<string, "muted" | "warning" | "info" | "success" | "error"> = {
  pending: "muted",
  standby: "warning",
  live: "error", // bright dot — currently running
  done: "success",
  cancelled: "muted",
};

function fmtDuration(s: number | null): string {
  if (s == null) return "";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}

export default async function MobileRosPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();
  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string) => fmt.time(iso);

  // Today's window: from start of today to start of tomorrow.
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const { data } = await supabase
    .from("cues")
    .select("id, scheduled_at, lane, label, description, status, duration_seconds")
    .eq("org_id", session.orgId)
    .gte("scheduled_at", startOfToday)
    .lt("scheduled_at", startOfTomorrow)
    .order("scheduled_at", { ascending: true })
    .limit(500);
  const cues = (data ?? []) as CueRow[];

  const live = cues.filter((c) => c.status === "live").length;
  const upcoming = cues.filter((c) => c.status === "pending" || c.status === "standby").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Run of Show</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {cues.length === 0
          ? "No cues scheduled today."
          : `${live} live · ${upcoming} upcoming · ${cues.length} total today`}
      </p>

      <ul className="mt-5 space-y-2">
        {cues.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title="No Cues Today"
              description="Cues authored on the desktop ROS will appear here on the day they're scheduled."
            />
          </li>
        ) : (
          cues.map((c) => {
            const tone = STATUS_TONE[c.status] ?? "muted";
            const isLive = c.status === "live";
            return (
              <li
                key={c.id}
                className={`surface flex items-start gap-3 p-3 ${isLive ? "ring-2 ring-[var(--color-error)]" : ""}`}
              >
                <div className="mt-0.5 flex flex-none flex-col items-center">
                  <span className="font-mono text-base font-semibold tabular-nums">{fmtTime(c.scheduled_at)}</span>
                  {c.duration_seconds != null && (
                    <span className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                      {fmtDuration(c.duration_seconds)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm leading-snug font-semibold">{c.label}</div>
                    <Badge variant={tone}>{toTitle(c.status)}</Badge>
                  </div>
                  {c.description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{c.description}</p>}
                  <div className="mt-1.5">
                    <Badge variant="muted">{c.lane}</Badge>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
