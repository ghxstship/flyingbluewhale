import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Badge } from "@/components/ui/Badge";
import { MetricCard } from "@/components/ui/MetricCard";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

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

const HUB_TILES: Array<{
  href: string;
  labelKey: string;
  labelFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
}> = [
  {
    href: "/studio/workforce/rosters",
    labelKey: "console.workforce.services.tiles.rosters.label",
    labelFallback: "Rosters",
    descriptionKey: "console.workforce.services.tiles.rosters.description",
    descriptionFallback: "Daily check-in source of truth",
  },
  {
    href: "/studio/transport/workforce",
    labelKey: "console.workforce.services.tiles.shuttles.label",
    labelFallback: "Workforce Shuttles",
    descriptionKey: "console.workforce.services.tiles.shuttles.description",
    descriptionFallback: "Shift-linked routes",
  },
  {
    href: "/studio/accommodation/blocks",
    labelKey: "console.workforce.services.tiles.accommodation.label",
    labelFallback: "Accommodation",
    descriptionKey: "console.workforce.services.tiles.accommodation.description",
    descriptionFallback: "Group blocks for staff",
  },
  {
    href: "/studio/services/requests",
    labelKey: "console.workforce.services.tiles.tickets.label",
    labelFallback: "Service Tickets",
    descriptionKey: "console.workforce.services.tiles.tickets.description",
    descriptionFallback: "Cleaning, IT, hospitality",
  },
];

export default async function Page() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader
          eyebrow={t("console.workforce.services.eyebrow", undefined, "Workforce")}
          title={t("console.workforce.services.title", undefined, "Services")}
        />
        <div className="page-content">
          <div className="surface p-6 text-sm">
            {t("console.workforce.services.configureSupabase", undefined, "Configure Supabase.")}
          </div>
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
        eyebrow={t("console.workforce.services.eyebrow", undefined, "Workforce")}
        title={t("console.workforce.services.title", undefined, "Services")}
        subtitle={t(
          "console.workforce.services.subtitle",
          {
            shiftCount: fmt.number(totalShifts),
            shiftLabel: totalShifts === 1 ? "Shift" : "Shifts",
            mealCount: fmt.number(mealCredits),
            mealLabel: mealCredits === 1 ? "meal credit" : "meal credits",
          },
          `${fmt.number(totalShifts)} ${totalShifts === 1 ? "Shift" : "Shifts"} · ${fmt.number(mealCredits)} ${mealCredits === 1 ? "meal credit" : "meal credits"} · 7-day window`,
        )}
      />
      <div className="page-content space-y-5">
        <div className="metric-grid-3">
          <MetricCard
            label={t("console.workforce.services.metrics.mealCredits", undefined, "Meal Credits · 7d")}
            value={fmt.number(mealCredits)}
            accent
          />
          <MetricCard
            label={t("console.workforce.services.metrics.breakMinutes", undefined, "Break Minutes · 7d")}
            value={fmt.number(totalBreakMinutes)}
          />
          <MetricCard
            label={t("console.workforce.services.metrics.checkedInNow", undefined, "Checked In Now")}
            value={fmt.number(checkedIn)}
          />
        </div>

        {days.length > 0 && (
          <section className="surface p-4">
            <h3 className="text-sm font-semibold">
              {t("console.workforce.services.mealCreditsByDay", undefined, "Meal Credits by Day")}
            </h3>
            <ul className="mt-3 space-y-1.5">
              {days.map(([day, agg]) => (
                <li key={day} className="flex items-center justify-between text-sm">
                  <span>{fmtDay(day)}</span>
                  <span>
                    <Badge variant="muted">
                      {t(
                        "console.workforce.services.shiftsCount",
                        { meals: agg.meals, total: agg.total },
                        `${agg.meals} / ${agg.total} shifts`,
                      )}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h3 className="text-sm font-semibold">{t("console.workforce.services.drillIn", undefined, "Drill In")}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {HUB_TILES.map((tile) => (
              <Link key={tile.href} href={tile.href} className="surface hover-lift p-4">
                <div className="text-sm font-medium">{t(tile.labelKey, undefined, tile.labelFallback)}</div>
                <div className="mt-1 text-xs text-[var(--p-text-2)]">
                  {t(tile.descriptionKey, undefined, tile.descriptionFallback)}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
