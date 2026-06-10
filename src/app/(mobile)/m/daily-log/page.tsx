import Link from "next/link";
import { ModuleHeader } from "@/components/Shell";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { quickCreateDailyLog } from "./actions";
import { getRequestFormatters, getRequestT } from "@/lib/i18n/request";

export const dynamic = "force-dynamic";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

export default async function Page() {
  if (!hasSupabase) return null;
  const session = await requireSession();
  const supabase = await createClient();

  const fmt = await getRequestFormatters();
  const { t } = await getRequestT();
  const fmtDate = (d: string): string =>
    fmt.dateParts(d + "T00:00:00", { weekday: "short", month: "short", day: "numeric" });
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: projects }, { data: recent }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name")
      .eq("org_id", session.orgId)
      .in("log_state", ["active", "draft"])
      .order("name"),
    supabase
      .from("daily_logs")
      .select("id, log_date, log_state, project:project_id(name)")
      .eq("org_id", session.orgId)
      .order("log_date", { ascending: false })
      .limit(7),
  ]);

  return (
    <>
      <ModuleHeader
        eyebrow={t("m.dailyLog.eyebrow", undefined, "Field")}
        title={t("m.dailyLog.title", undefined, "Daily Log")}
        subtitle={t("m.dailyLog.subtitle", undefined, "Quick capture from the floor")}
      />
      <div className="page-content space-y-4">
        <form action={quickCreateDailyLog} className="surface space-y-3 p-4">
          <h3 className="text-sm font-semibold">
            {t("m.dailyLog.todaysLog", { date: fmtDate(today) }, "Today's log — {date}")}
          </h3>
          <select name="project_id" required className={INPUT}>
            <option value="">{t("m.dailyLog.selectProject", undefined, "Select a project…")}</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            name="weather_summary"
            placeholder={t("m.dailyLog.weatherPlaceholder", undefined, "Weather — e.g. 78°F, Sunny")}
            className={INPUT}
          />
          <textarea
            name="notes"
            rows={4}
            placeholder={t(
              "m.dailyLog.notesPlaceholder",
              undefined,
              "Quick narrative — milestones, blockers, deliveries…",
            )}
            className={INPUT}
          />
          <input type="hidden" name="log_date" value={today} />
          <button type="submit" className="surface hover-lift w-full rounded-md py-2.5 text-sm font-medium">
            {t("m.dailyLog.saveLog", undefined, "Save log")}
          </button>
        </form>

        <section className="surface p-3">
          <h3 className="text-xs font-semibold tracking-wide text-[var(--p-text-2)] uppercase">
            {t("m.dailyLog.recent", undefined, "Recent")}
          </h3>
          <ul className="mt-2 space-y-1.5">
            {(
              (recent ?? []) as Array<{
                id: string;
                log_date: string;
                log_state: string;
                project: { name: string | null } | null;
              }>
            ).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/console/operations/daily-log/${r.id}`}
                  className="surface-inset flex items-center justify-between p-2 text-sm"
                >
                  <span>
                    {fmtDate(r.log_date)} · {r.project?.name ?? "—"}
                  </span>
                  <span className="text-xs text-[var(--p-text-2)]">{r.log_state}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
