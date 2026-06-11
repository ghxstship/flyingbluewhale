import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { hasSupabase } from "@/lib/env";
import type { GuardTour } from "@/lib/supabase/types";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { toTitle } from "@/lib/format";
import { urlFor } from "@/lib/urls";
import { toneFor } from "@/lib/tones";

export const dynamic = "force-dynamic";

type TourRow = GuardTour;

export default async function MobileGuardPage() {
  const { t } = await getRequestT();
  if (!hasSupabase) {
    return (
      <div className="px-4 pt-6 pb-24 text-sm text-[var(--p-text-2)]">
        {t("m.guard.configureSupabase", undefined, "Configure Supabase.")}
      </div>
    );
  }
  const session = await requireSession();
  const fmt = await getRequestFormatters();
  const fmtTime = (iso: string | null): string => {
    if (!iso) return "—";
    return fmt.time(iso);
  };
  const all = (await listOrgScoped("guard_tours", session.orgId, {
    orderBy: "next_run_at",
    ascending: true,
    limit: 200,
  })) as TourRow[];
  const rows = all.filter((r) => r.guard_id === session.userId).slice(0, 50);

  const active = rows.filter((r) => r.tour_state === "in_progress").length;
  const overdue = rows.filter((r) => r.tour_state === "overdue").length;
  const upcoming = rows.filter((r) => r.tour_state === "scheduled").length;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--brand-color,var(--p-accent))] uppercase">
        {t("m.guard.eyebrow", undefined, "Field")}
      </div>
      <h1 className="mt-1 text-2xl font-semibold">{t("m.guard.title", undefined, "Guard")}</h1>
      <p className="mt-1 text-xs text-[var(--p-text-2)]">
        {rows.length === 0
          ? t("m.guard.noToursAssigned", undefined, "No tours assigned to you.")
          : t(
              "m.guard.summary",
              { active, overdue, upcoming },
              `${active} in progress · ${overdue} overdue · ${upcoming} scheduled`,
            )}
      </p>

      <ul className="mt-6 space-y-2">
        {rows.length === 0 ? (
          <li>
            <EmptyState
              size="compact"
              title={t("m.guard.empty.title", undefined, "No Assigned Tours")}
              description={t(
                "m.guard.empty.description",
                undefined,
                "Patrol routes appear here when a supervisor assigns you. See all tours in Safety → Guard tours.",
              )}
              action={
                <Link href={urlFor("platform", "/safety/guard-tours")} className="ps-btn ps-btn--ghost ps-btn--sm">
                  {t("m.guard.empty.action", undefined, "Open guard tours")}
                </Link>
              }
            />
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{r.name}</div>
                  <div className="mt-1 text-xs text-[var(--p-text-2)]">
                    {r.venue_id
                      ? t("m.guard.venue.assigned", undefined, "Assigned venue")
                      : t("m.guard.venue.any", undefined, "Any venue")}
                    {r.cadence_minutes
                      ? t("m.guard.cadenceSuffix", { minutes: r.cadence_minutes }, ` · every ${r.cadence_minutes}m`)
                      : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={toneFor(r.tour_state)}>{toTitle(r.tour_state)}</Badge>
                    {r.next_run_at && r.tour_state === "scheduled" && (
                      <Badge variant="muted">
                        {t("m.guard.badge.next", { time: fmtTime(r.next_run_at) }, `Next ${fmtTime(r.next_run_at)}`)}
                      </Badge>
                    )}
                    {r.started_at && !r.completed_at && (
                      <Badge variant="info">
                        {t(
                          "m.guard.badge.started",
                          { time: fmtTime(r.started_at) },
                          `Started ${fmtTime(r.started_at)}`,
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
