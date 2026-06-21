import Link from "next/link";
import { NotebookPen } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listOrgScoped } from "@/lib/db/resource";
import { getRequestT } from "@/lib/i18n/request";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";

export const dynamic = "force-dynamic";

/**
 * COMPVSS · Daily Logs — the org's per-day site logs (weather + notes). Reads
 * `daily_logs` org-scoped; the FAB routes to the new-log form which upserts a
 * row keyed by (project, date).
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

const STATE_TONE: Record<string, string> = {
  draft: "neutral",
  submitted: "info",
  approved: "ok",
};

export default async function DailyLogPage() {
  const session = await requireSession();
  const rows = (await listOrgScoped("daily_logs", session.orgId)) as unknown as LogRow[];
  const { t } = await getRequestT();

  const logs = rows
    .slice()
    .sort((a, b) => String(b.log_date ?? "").localeCompare(String(a.log_date ?? "")));

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.dailyLog.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.dailyLog.title", undefined, "Daily Logs")}
      </h1>

      {logs.length === 0 ? (
        <EmptyState
          icon={<NotebookPen size={28} aria-hidden="true" />}
          title={t("m.dailyLog.emptyTitle", undefined, "No Logs Yet")}
          description={t("m.dailyLog.emptyBody", undefined, "Start the day's log with weather and notes.")}
        />
      ) : (
        logs.map((r) => {
          const tone = STATE_TONE[r.log_state ?? ""] ?? "neutral";
          const temps =
            r.weather_temp_high_f != null || r.weather_temp_low_f != null
              ? `${r.weather_temp_high_f ?? "—"}° / ${r.weather_temp_low_f ?? "—"}°`
              : null;
          return (
            <div className="item" key={r.id}>
              <span className="bar" style={{ background: "var(--p-info)" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">
                  {r.log_date
                    ? new Date(r.log_date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })
                    : t("m.dailyLog.untitled", undefined, "Untitled Log")}
                </div>
                <div className="s">
                  {[r.weather_summary, temps].filter(Boolean).join(" · ") ||
                    (r.notes ? r.notes.slice(0, 60) : t("m.dailyLog.noWeather", undefined, "No weather logged"))}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`} style={{ flex: "none" }}>
                {r.log_state ?? "—"}
              </span>
            </div>
          );
        })
      )}

      <Link href="/m/daily-log/new" className="fab" aria-label={t("m.dailyLog.newCta", undefined, "New Log")}>
        <KIcon name="Plus" size={22} />
      </Link>
    </div>
  );
}
