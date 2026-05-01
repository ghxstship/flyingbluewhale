import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type EventRow = { id: string; name: string; starts_at: string; ends_at: string; status: string };
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
  live: "error",
  done: "success",
  cancelled: "muted",
};

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(s: number | null): string {
  if (s == null) return "";
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}m` : `${m}m ${r}s`;
}

export default async function Page({ params }: { params: Promise<{ showId: string }> }) {
  const { showId } = await params;
  if (!hasSupabase) {
    return <div className="px-4 pt-6 pb-24 text-sm text-[var(--text-muted)]">Configure Supabase.</div>;
  }
  const session = await requireSession();
  const supabase = await createClient();

  const [{ data: showData }, { data: cueData }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, starts_at, ends_at, status")
      .eq("id", showId)
      .eq("org_id", session.orgId)
      .maybeSingle(),
    supabase
      .from("cues")
      .select("id, scheduled_at, lane, label, description, status, duration_seconds")
      .eq("event_id", showId)
      .eq("org_id", session.orgId)
      .order("scheduled_at", { ascending: true }),
  ]);

  const show = showData as EventRow | null;
  if (!show) notFound();
  const cues = ((cueData ?? []) as unknown as CueRow[]) ?? [];

  const live = cues.find((c) => c.status === "live");
  const upcoming = cues.filter((c) => c.status === "pending" || c.status === "standby");
  const done = cues.filter((c) => c.status === "done");

  return (
    <div className="px-4 pt-6 pb-24">
      <Link href="/m/ros" className="text-xs text-[var(--text-muted)]">
        ← All cues
      </Link>
      <div className="mt-2 text-xs font-semibold tracking-wider text-[var(--org-primary)] uppercase">Show</div>
      <h1 className="mt-1 text-2xl leading-tight font-semibold">{show.name}</h1>
      <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
        {fmtTime(show.starts_at)} → {fmtTime(show.ends_at)} · {show.status}
      </p>

      {live && (
        <section className="surface-raised mt-6 p-4 ring-2 ring-[var(--color-error)]">
          <div className="text-[10px] font-semibold tracking-wider text-[var(--color-error)] uppercase">Live</div>
          <div className="mt-1 text-base leading-snug font-semibold">{live.label}</div>
          <div className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
            {live.lane} · started {fmtTime(live.scheduled_at)}
            {live.duration_seconds ? ` · ${fmtDuration(live.duration_seconds)}` : ""}
          </div>
          {live.description && <p className="mt-2 text-xs text-[var(--text-secondary)]">{live.description}</p>}
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
          Upcoming · {upcoming.length}
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--text-muted)]">No more cues queued.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[var(--border-color)]">
            {upcoming.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2">
                <div className="w-12 shrink-0 font-mono text-xs tabular-nums">{fmtTime(c.scheduled_at)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm leading-snug font-medium">{c.label}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]">
                        {c.lane}
                        {c.duration_seconds ? ` · ${fmtDuration(c.duration_seconds)}` : ""}
                      </div>
                    </div>
                    <Badge variant={STATUS_TONE[c.status] ?? "muted"}>{c.status}</Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-6 opacity-70">
          <h2 className="text-xs font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            Completed · {done.length}
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border-color)]">
            {done.map((c) => (
              <li key={c.id} className="flex items-start gap-3 py-2 text-xs">
                <div className="w-12 shrink-0 font-mono tabular-nums">{fmtTime(c.scheduled_at)}</div>
                <div className="min-w-0 flex-1">{c.label}</div>
                <Badge variant="success">done</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
