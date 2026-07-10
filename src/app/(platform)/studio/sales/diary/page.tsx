import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfigureSupabase } from "@/components/ui/ConfigureSupabase";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import { dayKey, dayRange, timeLabel, isBlockingBooking, type BookingState } from "@/lib/function_diary";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

type SpaceRow = Database["public"]["Tables"]["function_spaces"]["Row"];
type BookingRow = Database["public"]["Tables"]["function_bookings"]["Row"];

const WINDOW_DAYS = 7;

/** Parse ?start=YYYY-MM-DD into a local Date floored to midnight; default today. */
function parseStart(raw: string | undefined): Date {
  const base = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00`) : new Date();
  base.setHours(0, 0, 0, 0);
  return base;
}

function shiftDay(d: Date, days: number): string {
  const n = new Date(d);
  n.setDate(d.getDate() + days);
  return dayKey(n.toISOString());
}

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <>
        <ModuleHeader title={t("console.diary.title", undefined, "Function Diary")} />
        <ConfigureSupabase />
      </>
    );
  }
  const { start } = await searchParams;
  const session = await requireSession();
  const windowStart = parseStart(start);
  const days = dayRange(windowStart, WINDOW_DAYS);
  const rangeStartIso = new Date(`${days[0]}T00:00:00`).toISOString();
  const rangeEndIso = new Date(`${shiftDay(windowStart, WINDOW_DAYS)}T00:00:00`).toISOString();

  const [spaces, bookings] = await Promise.all([
    listOrgScoped("function_spaces", session.orgId, { orderBy: "sort_order", ascending: true, limit: 0 }),
    listOrgScoped("function_bookings", session.orgId, {
      orderBy: "starts_at",
      ascending: true,
      limit: 0,
      filters: [
        { column: "starts_at", op: "gte", value: rangeStartIso },
        { column: "starts_at", op: "lte", value: rangeEndIso },
      ],
    }),
  ]);

  const activeSpaces = (spaces as SpaceRow[]).filter((s) => s.space_state !== "archived");

  // Index bookings by (space_id → dayKey → rows)
  const grid = new Map<string, Map<string, BookingRow[]>>();
  for (const b of bookings as BookingRow[]) {
    const dk = dayKey(b.starts_at);
    if (!grid.has(b.space_id)) grid.set(b.space_id, new Map());
    const bySpace = grid.get(b.space_id)!;
    if (!bySpace.has(dk)) bySpace.set(dk, []);
    bySpace.get(dk)!.push(b);
  }

  const prevHref = `/studio/sales/diary?start=${shiftDay(windowStart, -WINDOW_DAYS)}`;
  const nextHref = `/studio/sales/diary?start=${shiftDay(windowStart, WINDOW_DAYS)}`;
  const todayHref = `/studio/sales/diary`;

  return (
    <>
      <ModuleHeader
        eyebrow={t("console.diary.eyebrow", undefined, "Sales")}
        title={t("console.diary.title", undefined, "Function Diary")}
        subtitle={t(
          "console.diary.subtitle",
          { count: activeSpaces.length },
          `${activeSpaces.length} bookable spaces`,
        )}
        action={
          <div className="flex items-center gap-2">
            <Button href="/studio/sales/diary/spaces" size="sm" variant="secondary">
              {t("console.diary.manageSpaces", undefined, "Spaces")}
            </Button>
            <Button href="/studio/sales/diary/new" size="sm">
              {t("console.diary.newBooking", undefined, "+ New Booking")}
            </Button>
          </div>
        }
      />
      <div className="page-content space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button href={prevHref} size="sm" variant="ghost">
              {t("console.diary.prev", undefined, "← Prev")}
            </Button>
            <Button href={todayHref} size="sm" variant="ghost">
              {t("console.diary.today", undefined, "Today")}
            </Button>
            <Button href={nextHref} size="sm" variant="ghost">
              {t("console.diary.next", undefined, "Next →")}
            </Button>
          </div>
          <span className="text-xs text-[var(--p-text-2)]">
            {days[0]} → {days[days.length - 1]}
          </span>
        </div>

        {activeSpaces.length === 0 ? (
          <EmptyState
            title={t("console.diary.empty.title", undefined, "No spaces yet")}
            description={t(
              "console.diary.empty.desc",
              undefined,
              "Add a bookable room or space to start building the diary.",
            )}
            action={
              <Button href="/studio/sales/diary/spaces/new">
                {t("console.diary.empty.cta", undefined, "+ New Space")}
              </Button>
            }
          />
        ) : (
          <div className="surface overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left">{t("console.diary.col.space", undefined, "Space")}</th>
                  {days.map((d) => (
                    <th key={d} className="text-left whitespace-nowrap">
                      {d.slice(5)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeSpaces.map((space) => {
                  const bySpace = grid.get(space.id);
                  return (
                    <tr key={space.id}>
                      <td className="align-top">
                        <Link href={`/studio/sales/diary/spaces`} className="text-sm font-medium">
                          {space.name}
                        </Link>
                        {space.venue && (
                          <div className="text-[11px] text-[var(--p-text-2)]">{space.venue}</div>
                        )}
                      </td>
                      {days.map((d) => {
                        const cell = bySpace?.get(d) ?? [];
                        return (
                          <td key={d} className="align-top">
                            <div className="flex flex-col gap-1">
                              {cell.map((b) => (
                                <Link
                                  key={b.id}
                                  href={`/studio/sales/diary/${b.id}`}
                                  className="surface-inset hover-lift block p-1.5"
                                  style={{
                                    opacity: isBlockingBooking(b.booking_state as BookingState) ? 1 : 0.55,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <StatusBadge status={b.booking_state} />
                                  </div>
                                  <div className="mt-1 truncate text-[11px] font-medium">{b.title}</div>
                                  <div className="text-[11px] text-[var(--p-text-2)]">
                                    {timeLabel(b.starts_at)}–{timeLabel(b.ends_at)}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
