import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

// Competitive parity with Connecteam "Attendance Widget" (Mar 2026) — shows
// who is currently clocked in across the org. Server component; caller wraps
// in a Suspense boundary if needed.

type EntryRow = {
  user_id: string;
  started_at: string;
  duration_minutes: number | null;
};

type UserRow = { id: string; name: string | null; email: string | null };

export async function ClockedInWidget() {
  const session = await requireSession();
  const supabase = await createClient();

  const { data: entries } = await supabase
    .from("time_entries")
    .select("user_id, started_at, duration_minutes")
    .eq("org_id", session.orgId)
    .is("ended_at", null)
    .order("started_at", { ascending: true });

  const rows = (entries ?? []) as EntryRow[];
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));

  const userMap = new Map<string, string>();
  if (userIds.length) {
    const { data: users } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);
    for (const u of (users ?? []) as UserRow[]) {
      userMap.set(u.id, u.name ?? u.email ?? u.id.slice(0, 8));
    }
  }

  const now = Date.now();

  function elapsedLabel(startedAt: string) {
    const ms = Math.max(0, now - new Date(startedAt).getTime());
    const minutes = Math.floor(ms / 60000);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  return (
    <section className="surface p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">On The Clock</h2>
        <span
          className={`ps-badge ${rows.length > 0 ? "ps-badge--ok" : "ps-badge--neutral"}`}
          aria-label={`${rows.length} clocked in`}
        >
          {rows.length} live
        </span>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--p-text-2)]">No one is currently clocked in.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map((entry) => {
            const name = userMap.get(entry.user_id) ?? "Unknown";
            return (
              <li key={entry.user_id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2 shrink-0 rounded-full bg-[var(--p-success)]"
                    aria-hidden
                  />
                  <span className="truncate text-sm">{name}</span>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-[var(--p-text-2)]">
                  {elapsedLabel(entry.started_at)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
