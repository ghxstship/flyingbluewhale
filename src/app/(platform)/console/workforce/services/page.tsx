import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

type ShiftRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  break_minutes: number;
  meal_credit: boolean;
  attendance: string;
  venue: { name: string | null } | null;
};

const HUB_TILES: Array<{ href: string; label: string; description: string }> = [
  { href: "/console/workforce/rosters", label: "Rosters", description: "Daily check-in source of truth" },
  { href: "/console/transport/workforce", label: "Workforce Shuttles", description: "Shift-linked routes" },
  { href: "/console/accommodation/blocks", label: "Accommodation", description: "Group blocks for staff" },
  { href: "/console/services/requests", label: "Service Tickets", description: "Cleaning, IT, hospitality" },
];

export default async function Page() {
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader eyebrow="Workforce" title="Services" />
        <div className="page-content">
          <div className="surface p-6 text-sm">Configure Supabase.</div>
        </div>
      </>
    );
  }
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const fmtDay = (iso: string): string => fmt.dateParts(iso, { weekday: "short", month: "short", day: "numeric" });
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7).toISOString();
  const { data } = await supabase
    .from("shifts")
    .select("id, starts_at, ends_at, break_minutes, meal_credit, attendance, venue:venue_id(name)")
    .eq("org_id", session.orgId)
    .gte("starts_at", startOfDay)
    .lt("starts_at", endOfWeek)
    .order("starts_at", { ascending: true })
    .limit(2000);
  const rows = (data ?? []) as unknown as ShiftRow[];

  const totalShifts = rows.length;
  const mealCredits = rows.filter((s) => s.meal_credit).length;
  const totalBreakMinutes = rows.reduce((s, r) => s + r.break_minutes, 0);
  const checkedIn = rows.filter((s) => s.attendance === "checked_in").length;

  // Group meal credits by day
  const byDay = rows.reduce<Map<string, { meals: number; total: number }>>((map, s) => {
    const k = new Date(s.starts_at).toDateString();
    const acc = map.get(k) ?? { meals: 0, total: 0 };
    acc.total += 1;
    if (s.meal_credit) acc.meals += 1;
    map.set(k, acc);
    return map;
  }, new Map());

  const days = Array.from(byDay.entries())
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .slice(0, 7);

  return (
    <>
      <ModuleHeader
        eyebrow="Workforce"
        title="Services"
        subtitle={`${fmt.number(totalShifts)} Shift${totalShifts === 1 ? "" : "s"} · ${fmt.number(mealCredits)} meal credit${mealCredits === 1 ? "" : "s"} · 7-day window`}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard label="Meal Credits · 7d" value={fmt.number(mealCredits)} accent />
          <MetricCard label="Break Minutes · 7d" value={fmt.number(totalBreakMinutes)} />
          <MetricCard label="Checked In Now" value={fmt.number(checkedIn)} />
        </div>

        {days.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">Meal Credits by Day</h3>
            <ul className="mt-3 space-y-1.5">
              {days.map(([day, agg]) => (
                <li key={day} className="flex items-center justify-between text-sm">
                  <span>{fmtDay(day)}</span>
                  <span>
                    <Badge variant="muted">
                      {agg.meals} / {agg.total} shifts
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">Drill In</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((t) => (
              <Link key={t.href} href={t.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{t.label}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">{t.description}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
