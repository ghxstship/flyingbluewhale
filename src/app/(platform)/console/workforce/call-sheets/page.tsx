import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";

export const dynamic = "force-dynamic";

type WfMember = { id: string; full_name: string; role: string | null; email: string | null; phone: string | null };

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  workforce_member_id: string | null;
  venue_id: string | null;
  role: string | null;
};

function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
  return { start, end };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const sp = await searchParams;
  const tomorrow = new Date(Date.now() + 86400_000);
  const dateStr = sp.date ?? tomorrow.toISOString().slice(0, 10);
  const focusDate = new Date(`${dateStr}T00:00:00.000Z`);

  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title="Call sheets" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();
  const { start, end } = dayBounds(focusDate);

  const { data: shifts } = await supabase
    .from("shifts")
    .select("id, starts_at, ends_at, workforce_member_id, venue_id, role")
    .eq("org_id", session.orgId)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  const rows = (shifts ?? []) as ShiftRow[];

  const memberIds = Array.from(new Set(rows.map((s) => s.workforce_member_id).filter(Boolean) as string[]));
  let members: WfMember[] = [];
  if (memberIds.length > 0) {
    const { data: m } = await supabase
      .from("workforce_members")
      .select("id, full_name, role, email, phone")
      .eq("org_id", session.orgId)
      .in("id", memberIds);
    members = (m ?? []) as WfMember[];
  }
  const byMember = new Map<string, ShiftRow[]>();
  for (const s of rows) {
    if (!s.workforce_member_id) continue;
    const list = byMember.get(s.workforce_member_id) ?? [];
    list.push(s);
    byMember.set(s.workforce_member_id, list);
  }

  const prevDate = new Date(focusDate.getTime() - 86400_000).toISOString().slice(0, 10);
  const nextDate = new Date(focusDate.getTime() + 86400_000).toISOString().slice(0, 10);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Call sheets"
        subtitle={`${members.length} member${members.length === 1 ? "" : "s"} on shift · ${dateStr}`}
      />
      <div className="page-content space-y-4">
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={`/console/workforce/call-sheets?date=${prevDate}`}
            className="text-[var(--org-primary)] hover:underline"
          >
            ← {prevDate}
          </Link>
          <span className="font-mono text-xs text-[var(--text-muted)]">{dateStr}</span>
          <Link
            href={`/console/workforce/call-sheets?date=${nextDate}`}
            className="text-[var(--org-primary)] hover:underline"
          >
            {nextDate} →
          </Link>
        </nav>
        {members.length === 0 ? (
          <EmptyState
            title={`No shifts scheduled for ${dateStr}`}
            description="Author a roster + shifts to materialise per-person call sheets."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((m) => {
              const ms = byMember.get(m.id) ?? [];
              const first = ms[0];
              const last = ms[ms.length - 1];
              const callTime = first ? new Date(first.starts_at) : null;
              return (
                <Link
                  key={m.id}
                  href={`/console/workforce/call-sheets/${m.id}?date=${dateStr}`}
                  className="surface hover-lift p-4"
                >
                  <div className="text-sm font-semibold">{m.full_name}</div>
                  <div className="font-mono text-xs text-[var(--text-muted)]">{m.role ?? "—"}</div>
                  <div className="mt-3 flex items-baseline justify-between text-xs">
                    <span className="text-[var(--text-secondary)]">Call</span>
                    <span className="font-mono text-base font-semibold">
                      {callTime ? callTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                  </div>
                  {first && last && first !== last && (
                    <div className="mt-1 flex items-baseline justify-between text-[10px]">
                      <span className="text-[var(--text-muted)]">Wrap</span>
                      <span className="font-mono">
                        {new Date(last.ends_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  )}
                  <div className="mt-2 font-mono text-[10px] text-[var(--text-muted)]">
                    {ms.length} shift{ms.length === 1 ? "" : "s"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
