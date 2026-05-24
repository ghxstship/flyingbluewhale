import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";

export const dynamic = "force-dynamic";

type ManifestRow = {
  id: string;
  kind: string; // 'arrival' | 'departure'
  flight_ref: string | null;
  carrier: string | null;
  party_size: number;
  scheduled_at: string | null;
  actual_at: string | null;
  status: string;
};

const STATUS_TONE: Record<string, "muted" | "info" | "success" | "warning" | "error"> = {
  scheduled: "muted",
  in_progress: "info",
  arrived: "success",
  departed: "success",
  delayed: "warning",
  cancelled: "error",
};

export default async function MobileAdPage() {
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();

  const fmt = await getRequestFormatters();
  const fmtClock = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.time(iso);
  };
  const fmtDay = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  };
  const today = new Date();
  const startOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfWindow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const all = (await listOrgScoped("ad_manifests", session.orgId, {
    orderBy: "scheduled_at",
    ascending: true,
    limit: 200,
    filters: [
      { column: "scheduled_at", op: "gte", value: startOfWindow },
      { column: "scheduled_at", op: "lte", value: endOfWindow },
    ],
  })) as ManifestRow[];

  const arrivals = all.filter((m) => m.kind === "arrival");
  const departures = all.filter((m) => m.kind === "departure");

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Mobile</div>
      <h1 className="mt-1 text-2xl font-semibold">Arrivals & departures</h1>
      <p className="mt-1 text-xs text-[var(--text-muted)]">Today · {fmtDay(startOfWindow)}</p>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Arrivals · {arrivals.length}
        </h2>
        <ul className="mt-3 space-y-2">
          {arrivals.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No Arrivals Today" />
            </li>
          ) : (
            arrivals.map((m) => (
              <li key={m.id}>
                <Link href={`/console/transport/ad/${m.id}`} className="surface flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex flex-none flex-col items-center">
                    <span className="font-mono text-base font-semibold tabular-nums">{fmtClock(m.scheduled_at)}</span>
                    <span className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">ETA</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm leading-snug font-semibold">
                        {m.flight_ref ?? "—"}{" "}
                        {m.carrier ? <span className="text-[var(--text-muted)]">· {m.carrier}</span> : null}
                      </div>
                      <Badge variant={STATUS_TONE[m.status] ?? "muted"}>{toTitle(m.status)}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      Party of {m.party_size}
                      {m.actual_at && ` · landed ${fmtClock(m.actual_at)}`}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Departures · {departures.length}
        </h2>
        <ul className="mt-3 space-y-2">
          {departures.length === 0 ? (
            <li>
              <EmptyState size="compact" title="No Departures Today" />
            </li>
          ) : (
            departures.map((m) => (
              <li key={m.id}>
                <Link href={`/console/transport/ad/${m.id}`} className="surface flex items-start gap-3 p-4">
                  <div className="mt-0.5 flex flex-none flex-col items-center">
                    <span className="font-mono text-base font-semibold tabular-nums">{fmtClock(m.scheduled_at)}</span>
                    <span className="mt-0.5 font-mono text-[10px] text-[var(--text-muted)]">ETD</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm leading-snug font-semibold">
                        {m.flight_ref ?? "—"}{" "}
                        {m.carrier ? <span className="text-[var(--text-muted)]">· {m.carrier}</span> : null}
                      </div>
                      <Badge variant={STATUS_TONE[m.status] ?? "muted"}>{toTitle(m.status)}</Badge>
                    </div>
                    <div className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                      Party of {m.party_size}
                      {m.actual_at && ` · departed ${fmtClock(m.actual_at)}`}
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
