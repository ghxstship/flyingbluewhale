import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";
import { Fab } from "@/components/mobile/kit";
import { DailyLogView, type DailyLogItem } from "./DailyLogView";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Daily Logs — the org's per-day site logs (weather + notes). Reads
 * `daily_logs` org-scoped; the FAB routes to the new-log form which upserts a
 * row keyed by (project, date).
 *
 * Kit 34: the list renders through the shared view engine (`DailyLogView` →
 * `NormalizedList`, calendar default). The DB read below is unchanged.
 */
type LogRow = {
  id: string;
  log_date: string | null;
  weather_summary: string | null;
  weather_temp_high_f: number | null;
  weather_temp_low_f: number | null;
  notes: string | null;
  log_state: string | null;
};

export default async function DailyLogPage() {
  const session = await requireSession();
  const rows = (await listOrgScoped("daily_logs", session.orgId)) as unknown as LogRow[];
  const { t } = await getRequestT();
  const fmt = await getRequestFormatters();

  const logs = rows
    .slice()
    .sort((a, b) => String(b.log_date ?? "").localeCompare(String(a.log_date ?? "")));

  const items: DailyLogItem[] = logs.map((r) => {
    const temps =
      r.weather_temp_high_f != null || r.weather_temp_low_f != null
        ? `${r.weather_temp_high_f ?? "—"}° / ${r.weather_temp_low_f ?? "—"}°`
        : null;
    const summary =
      [r.weather_summary, temps].filter(Boolean).join(" · ") ||
      (r.notes ? r.notes.slice(0, 60) : t("m.dailyLog.noWeather", undefined, "No weather logged"));
    return {
      id: r.id,
      logIso: r.log_date,
      dateLabel: r.log_date
        ? fmt.dateParts(new Date(r.log_date + "T00:00:00"), { weekday: "short", month: "short", day: "numeric" })
        : t("m.dailyLog.untitled", undefined, "Untitled Log"),
      log_state: r.log_state,
      summary,
    };
  });

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.dailyLog.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.dailyLog.title", undefined, "Daily Log")}
      </h1>

      <DailyLogView items={items} />

      <Fab href="/m/daily-log/new" label={t("m.dailyLog.newCta", undefined, "New Log")} />
    </div>
  );
}
