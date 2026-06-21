"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { scanCode, type CheckInState } from "../actions";

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  duplicate: "warn",
  voided: "danger",
  expired: "warn",
  not_found: "neutral",
};

/** Manual code-entry fallback for the check-in scanner (no camera). */
export function ManualEntry() {
  const t = useT();
  const [state, formAction, pending] = useActionState<CheckInState, FormData>(scanCode, null);

  return (
    <>
      <Link href="/m/check-in" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.checkinManual.back", undefined, "Check-In")}
      </Link>
      <div className="scr-eye">{t("m.checkinManual.eyebrow", undefined, "Manual Entry")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>{t("m.checkinManual.title", undefined, "Enter Code")}</h1>
      <div className="hint" style={{ marginBottom: 10 }}>
        {t("m.checkinManual.hint", undefined, "Type a scan code or asset tag when the camera can't read it.")}
      </div>

      <form action={formAction}>
        <input type="hidden" name="mode" value="manual" />
        <div className="fld">
          <label className="wl" htmlFor="code">{t("m.checkinManual.code", undefined, "Code")}</label>
          <input id="code" name="code" className="ps-input" autoComplete="off" placeholder={t("m.checkinManual.placeholder", undefined, "e.g. R7-014")} style={{ fontFamily: "var(--p-mono)" }} />
        </div>
        <button type="submit" className="ps-btn ps-btn--cta ps-btn--lg" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={pending}>
          <KIcon name="ScanLine" size={16} /> {pending ? t("m.checkinManual.scanning", undefined, "Checking…") : t("m.checkinManual.cta", undefined, "Submit Code")}
        </button>
      </form>

      {state && state.ok && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className={`ps-badge ps-badge--${RESULT_TONE[state.result.result] ?? "neutral"}`}>{state.result.result}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{("title" in state.result && state.result.title) || t("m.checkinManual.logged", undefined, "Logged")}</div>
          </div>
        </div>
      )}
      {state && !state.ok && (
        <div className="import-note" style={{ marginTop: 14 }}>
          <KIcon name="TriangleAlert" size={15} style={{ color: "var(--p-danger)" }} />
          <span style={{ fontSize: 12 }}>{state.error}</span>
        </div>
      )}
    </>
  );
}
