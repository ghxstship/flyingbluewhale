"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useScanSubmit } from "@/components/scanners";

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  // resolver 2 identified an asset — a hit, though not an entitlement accept.
  asset: "ok",
  duplicate: "warn",
  voided: "danger",
  expired: "warn",
  not_found: "neutral",
};

/** Manual code-entry fallback for the check-in scanner (no camera). Submits
 * through the queueable /api/v1/scan endpoint like the camera path, so a
 * typed code entered offline is durably queued and replayed on reconnect. */
export function ManualEntry() {
  const t = useT();
  const [code, setCode] = useState("");
  const { submit, pending, outcome } = useScanSubmit();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    void submit(code);
    setCode("");
  };

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

      <form onSubmit={onSubmit}>
        <div className="fld">
          <label className="wl" htmlFor="code">{t("m.checkinManual.code", undefined, "Code")}</label>
          <input
            id="code"
            name="code"
            className="ps-input"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("m.checkinManual.placeholder", undefined, "e.g. R7-014")}
            style={{ fontFamily: "var(--p-mono)" }}
          />
        </div>
        <button type="submit" className="ps-btn ps-btn--cta ps-btn--lg" style={{ width: "100%", justifyContent: "center", marginTop: 12 }} disabled={pending}>
          <KIcon name="ScanLine" size={16} /> {pending ? t("m.checkinManual.scanning", undefined, "Checking…") : t("m.checkinManual.cta", undefined, "Submit Code")}
        </button>
      </form>

      {outcome?.kind === "result" && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className={`ps-badge ps-badge--${RESULT_TONE[outcome.result.result] ?? "neutral"}`}>{outcome.result.result}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{("title" in outcome.result && outcome.result.title) || t("m.checkinManual.logged", undefined, "Logged")}</div>
          </div>
        </div>
      )}
      {outcome?.kind === "queued" && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className="ps-badge ps-badge--warn">{t("m.checkin.queuedTitle", undefined, "Recorded")}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t" style={{ fontFamily: "var(--p-mono)" }}>{outcome.code}</div>
            <div className="s">
              {t(
                "m.checkin.queuedBody",
                undefined,
                "Saved on this device. It will sync and verify when you're back online.",
              )}
            </div>
          </div>
        </div>
      )}
      {outcome?.kind === "error" && (
        <div className="import-note" style={{ marginTop: 14 }}>
          <KIcon name="TriangleAlert" size={15} style={{ color: "var(--p-danger)" }} />
          <span style={{ fontSize: 12 }}>{outcome.message}</span>
        </div>
      )}
    </>
  );
}
