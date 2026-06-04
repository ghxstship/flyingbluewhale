import { notFound } from "next/navigation";
import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type Member = {
  id: string;
  full_name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
};

type Shift = {
  id: string;
  starts_at: string;
  ends_at: string;
  role: string | null;
  meal_credit: boolean;
  break_minutes: number;
  venue: { name: string | null; locations: { address: string | null; city: string | null } | null } | null;
};

function dayBounds(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();
  return { start, end };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ memberId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { memberId } = await params;
  const sp = await searchParams;
  const tomorrow = new Date(Date.now() + 86400_000);
  const dateStr = sp.date ?? tomorrow.toISOString().slice(0, 10);
  const focusDate = new Date(`${dateStr}T00:00:00.000Z`);

  if (!hasSupabase) return notFound();
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const { data: m } = await supabase
    .from("workforce_members")
    .select("id, full_name, role, email, phone")
    .eq("org_id", session.orgId)
    .eq("id", memberId)
    .maybeSingle();
  if (!m) notFound();
  const member = m as Member;

  const { start, end } = dayBounds(focusDate);
  const { data: shiftsData } = await supabase
    .from("shifts")
    .select("id, starts_at, ends_at, role, meal_credit, break_minutes, venue:venue_id(name, locations(address, city))")
    .eq("org_id", session.orgId)
    .eq("workforce_member_id", memberId)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  const shifts = (shiftsData ?? []) as unknown as Shift[];

  const callTime = shifts[0] ? new Date(shifts[0].starts_at) : null;
  const wrapTime = shifts[shifts.length - 1] ? new Date(shifts[shifts.length - 1].ends_at) : null;

  return (
    <>
      <ModuleHeader
        eyebrow={`Call sheet · ${dateStr}`}
        title={member.full_name}
        action={
          <div className="flex items-center gap-2 print:hidden">
            <Button href={`/console/workforce/call-sheets?date=${dateStr}`} variant="ghost" size="sm">
              Back
            </Button>
            <span className="text-xs text-[var(--text-muted)]">⌘P to print or save as PDF</span>
          </div>
        }
      />
      <div className="page-content max-w-2xl">
        <div className="surface space-y-6 p-6 print:border-0 print:p-0 print:shadow-none">
          <header className="border-b border-[var(--border-color)] pb-4">
            <div className="text-[10px] font-semibold tracking-[0.25em] text-[var(--text-muted)] uppercase">
              Call sheet · {dateStr}
            </div>
            <div className="mt-1 text-2xl font-bold">{member.full_name}</div>
            <div className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
              {member.role ?? "—"}
              {member.phone && <span className="ms-3">{member.phone}</span>}
              {member.email && <span className="ms-3">{member.email}</span>}
            </div>
          </header>

          <section className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">Call</div>
              <div className="mt-1 font-mono text-2xl font-semibold">{callTime ? fmt.time(callTime) : "—"}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-wide text-[var(--text-muted)] uppercase">Wrap</div>
              <div className="mt-1 font-mono text-2xl font-semibold">{wrapTime ? fmt.time(wrapTime) : "—"}</div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold">Shifts</h3>
            {shifts.length === 0 ? (
              <p className="mt-2 text-xs text-[var(--text-muted)]">No shifts scheduled on this date.</p>
            ) : (
              <ol className="mt-2 space-y-3">
                {shifts.map((s) => (
                  <li key={s.id} className="surface p-4">
                    <div className="flex items-baseline justify-between">
                      <div className="font-mono text-base font-semibold">
                        {fmt.time(s.starts_at)}
                        {" – "}
                        {fmt.time(s.ends_at)}
                      </div>
                      {s.meal_credit && <Badge variant="success">Meal</Badge>}
                    </div>
                    <div className="mt-1 text-sm">
                      {s.venue?.name ?? "Unassigned venue"}
                      {s.role && <span className="ms-2 font-mono text-xs text-[var(--text-muted)]">· {s.role}</span>}
                    </div>
                    {s.venue?.locations?.address && (
                      <div className="mt-0.5 text-xs text-[var(--text-secondary)]">
                        {s.venue.locations.address}
                        {s.venue.locations.city && `, ${s.venue.locations.city}`}
                      </div>
                    )}
                    {s.break_minutes > 0 && (
                      <div className="mt-1 text-[10px] text-[var(--text-muted)]">{s.break_minutes}m break</div>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

          <footer className="border-t border-[var(--border-color)] pt-3 text-[10px] text-[var(--text-muted)]">
            Generated {fmt.dateTime(new Date())} · Check{" "}
            <Link href="/m/clock" className="text-[var(--org-primary)] underline">
              /m/clock
            </Link>{" "}
            on arrival to clock in.
          </footer>
        </div>
      </div>
    </>
  );
}
