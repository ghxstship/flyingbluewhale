"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FolderOpen } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { saveDailyLog } from "../actions";

export type ProjectOpt = { id: string; name: string };

/**
 * COMPVSS · New Daily Log — project + date + weather + notes. Submits to the
 * `saveDailyLog` upsert action and routes back to the log list.
 */
export function DailyLogForm({ projects }: { projects: ProjectOpt[] }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  function onSubmit(fd: FormData) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await saveDailyLog(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/daily-log");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.dailyLog.back", undefined, "Daily Logs")}
      </button>
      <div className="scr-eye">{t("m.dailyLog.new.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.dailyLog.new.title", undefined, "New Daily Log")}
      </h1>

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} aria-hidden="true" />}
          title={t("m.dailyLog.new.noProjects", undefined, "No Projects")}
          description={t("m.dailyLog.new.noProjectsBody", undefined, "Daily logs attach to a project. Ask Ops to add one.")}
        />
      ) : (
        <form action={onSubmit}>
          <div className="fld">
            <label>
              {t("m.dailyLog.new.project", undefined, "Project")}
              <span className="req"> *</span>
            </label>
            <select name="projectId" defaultValue={projects[0]?.id} required>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label>
              {t("m.dailyLog.new.date", undefined, "Date")}
              <span className="req"> *</span>
            </label>
            <input type="date" name="log_date" defaultValue={today} required />
          </div>
          <div className="fld">
            <label>{t("m.dailyLog.new.weather", undefined, "Weather")}</label>
            <input
              type="text"
              name="weather_summary"
              placeholder={t("m.dailyLog.new.weatherPh", undefined, "e.g. Clear · light wind")}
            />
          </div>
          <div className="frow">
            <div className="fld" style={{ width: "100%" }}>
              <label>{t("m.dailyLog.new.high", undefined, "High °F")}</label>
              <input type="number" name="weather_temp_high_f" placeholder="88" />
            </div>
            <div className="fld" style={{ width: "100%" }}>
              <label>{t("m.dailyLog.new.low", undefined, "Low °F")}</label>
              <input type="number" name="weather_temp_low_f" placeholder="74" />
            </div>
          </div>
          <div className="fld">
            <label>{t("m.dailyLog.new.notes", undefined, "Notes")}</label>
            <textarea
              name="notes"
              placeholder={t("m.dailyLog.new.notesPh", undefined, "Headcounts, deliveries, blockers, incidents…")}
            />
          </div>
          {error && (
            <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => router.back()}
            >
              {t("m.dailyLog.new.cancel", undefined, "Cancel")}
            </button>
            <button
              type="submit"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
              disabled={pending}
            >
              {pending
                ? t("m.dailyLog.new.saving", undefined, "Saving…")
                : t("m.dailyLog.new.submit", undefined, "Save Log")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
