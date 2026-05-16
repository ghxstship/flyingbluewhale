import { notFound } from "next/navigation";
import { createServiceClient, isServiceClientAvailable } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TokenRow = {
  id: string;
  org_id: string;
  project_id: string | null;
  title: string;
  view_type: string;
  is_active: boolean;
  expires_at: string | null;
};

type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  location_id: string | null;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_DOT: Record<string, string> = {
  confirmed: "bg-[var(--color-success)]",
  live: "bg-[var(--brand-color)]",
  complete: "bg-[var(--color-success)] opacity-50",
  cancelled: "bg-[var(--color-error)]",
  draft: "bg-[var(--color-warning)]",
  scheduled: "bg-[var(--color-info)]",
};

export default async function ScheduleSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!isServiceClientAvailable()) return notFound();
  const supabase = createServiceClient();

  // Verify token
  const { data: tokenRow } = await supabase
    .from("schedule_share_tokens")
    .select("id, org_id, project_id, title, view_type, is_active, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!tokenRow) return notFound();
  const row = tokenRow as TokenRow;
  if (!row.is_active) return notFound();
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="surface p-8 text-center">
          <h1 className="text-lg font-semibold">Schedule Link Expired</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            This schedule link is no longer active. Contact the organizer for an updated link.
          </p>
        </div>
      </main>
    );
  }

  // Increment view count (fire-and-forget)
  supabase.rpc("increment_schedule_share_view", { p_token: token }).then(() => {});

  // Fetch events
  let query = supabase
    .from("events")
    .select("id, name, starts_at, ends_at, status, location_id")
    .eq("org_id", row.org_id)
    .not("status", "eq", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(500);

  if (row.project_id) {
    query = query.eq("project_id", row.project_id);
  }

  const { data: events } = await query;
  const eventList = (events ?? []) as EventRow[];

  // Group by day
  const byDay = new Map<string, EventRow[]>();
  for (const e of eventList) {
    const key = e.starts_at.slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(e);
    byDay.set(key, arr);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold tracking-widest text-[var(--text-muted)] uppercase">
          A T L V S Technologies
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{row.title}</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {eventList.length} event{eventList.length === 1 ? "" : "s"} · Live schedule
        </p>
      </div>

      {eventList.length === 0 ? (
        <div className="surface p-8 text-center text-sm text-[var(--text-muted)]">
          No events scheduled yet.
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byDay.entries()).map(([day, dayEvents]) => (
            <section key={day}>
              <h2 className="mb-3 text-sm font-semibold text-[var(--text-muted)]">
                {fmtDate(day + "T12:00:00")}
              </h2>
              <ul className="space-y-2">
                {dayEvents.map((e) => (
                  <li key={e.id} className="surface flex items-start gap-3 p-4">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[e.status] ?? "bg-[var(--text-muted)]"}`}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{e.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-[var(--text-muted)]">
                        {fmt(e.starts_at)} – {fmt(e.ends_at)}
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 text-xs capitalize text-[var(--text-muted)]">
                      {e.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="mt-12 text-center text-xs text-[var(--text-muted)]">
        Powered by{" "}
        <span className="font-semibold tracking-widest">A T L V S</span> Technologies ·
        Schedule is live and updates automatically.
      </footer>
    </main>
  );
}
