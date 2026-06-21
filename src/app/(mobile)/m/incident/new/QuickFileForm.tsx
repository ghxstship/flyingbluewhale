"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { KIcon } from "@/components/mobile/kit";
import { quickFileIncident } from "../actions";

/**
 * Express one-field incident quick-file. A single textarea + amber CTA — the
 * fastest path to logging a hazard from the field. Routes back on success.
 */
export function QuickFileForm() {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(fd: FormData) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await quickFileIncident(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.push("/m/incident");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.incident.back", undefined, "My Incidents")}
      </button>
      <div className="scr-eye">{t("m.incident.quick.eyebrow", undefined, "Express")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.incident.quick.title", undefined, "Quick File")}
      </h1>
      <p className="form-intro">
        {t("m.incident.quick.intro", undefined, "One line. We'll route it to Ops and you can add detail later.")}
      </p>

      <form action={onSubmit}>
        <div className="fld">
          <label>
            {t("m.incident.quick.label", undefined, "What Happened")}
            <span className="req"> *</span>
          </label>
          <textarea
            name="summary"
            required
            autoFocus
            placeholder={t("m.incident.quick.placeholder", undefined, "Describe the incident…")}
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
            {t("m.incident.quick.cancel", undefined, "Cancel")}
          </button>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
            disabled={pending}
          >
            {pending
              ? t("m.incident.quick.filing", undefined, "Filing…")
              : t("m.incident.quick.submit", undefined, "File Incident")}
          </button>
        </div>
      </form>
    </div>
  );
}
