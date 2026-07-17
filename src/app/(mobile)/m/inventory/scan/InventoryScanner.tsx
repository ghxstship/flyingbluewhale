"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { GatedCameraScanner, useScanSubmit } from "@/components/scanners";
import { formatsForMode } from "@/lib/scan/formats";

export type RecentScan = {
  id: string;
  result: string;
  body: string | null;
  at: string;
};

export type InventoryScanLabels = {
  eyebrow: string;
  title: string;
  hint: string;
  back: string;
  enableCamera?: string;
  cameraDenied?: string;
  manualLabel: string;
  manualPlaceholder: string;
  cta: string;
  scanning: string;
  recentTitle: string;
  recentEmpty: string;
  logged: string;
  queuedTitle?: string;
  queuedBody?: string;
};

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  // resolver 2 identified an asset — a hit, though not an entitlement accept.
  asset: "ok",
  duplicate: "warn",
  expired: "warn",
  wrong_zone: "warn",
  voided: "danger",
  not_found: "neutral",
};

/**
 * COMPVSS inventory scanner. A REAL camera decoder (shared `CameraScanner`
 * behind a tap-to-enable gate) plus a manual asset-tag entry form, both
 * submitting through `useScanSubmit` → the queueable `/api/v1/scan` endpoint,
 * so an offline scan is durably queued and replayed on reconnect. Haptic +
 * beep feedback per outcome. Recent activity is server-fetched scan events.
 */
export function InventoryScanner({
  recent,
  labels,
}: {
  recent: RecentScan[];
  labels: InventoryScanLabels;
}) {
  const [code, setCode] = useState("");
  const { submit, pending, outcome } = useScanSubmit("asset");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    void submit(code);
    setCode("");
  };

  return (
    <>
      <Link href="/m/inventory" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {labels.back}
      </Link>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {labels.title}
      </h1>

      <GatedCameraScanner
        onScan={(scanned) => void submit(scanned.value, scanned.format)}
        formats={formatsForMode("asset")}
        enableLabel={labels.enableCamera ?? "Enable Camera"}
        deniedLabel={labels.cameraDenied ?? "Camera Unavailable, Use Manual Entry"}
      />
      <div className="scanhint">
        <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {labels.hint}
      </div>

      <form onSubmit={onSubmit}>
        <div className="fld" style={{ marginTop: 6 }}>
          <label className="wl" htmlFor="code">
            {labels.manualLabel}
          </label>
          <input
            id="code"
            name="code"
            className="ps-input"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={labels.manualPlaceholder}
            style={{ fontFamily: "var(--p-mono)" }}
          />
        </div>
        <button
          type="submit"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
          disabled={pending}
        >
          <KIcon name="ScanLine" size={16} /> {pending ? labels.scanning : labels.cta}
        </button>
      </form>

      {outcome?.kind === "result" && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className={`ps-badge ps-badge--${RESULT_TONE[outcome.result.result] ?? "neutral"}`}>
            {outcome.result.result}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{("title" in outcome.result && outcome.result.title) || labels.logged}</div>
          </div>
        </div>
      )}
      {outcome?.kind === "queued" && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className="ps-badge ps-badge--warn">{labels.queuedTitle ?? "Recorded"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t" style={{ fontFamily: "var(--p-mono)" }}>{outcome.code}</div>
            <div className="s">
              {labels.queuedBody ?? "Saved on this device. It will sync and verify when you're back online."}
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

      <div className="sech">
        <h2>{labels.recentTitle}</h2>
      </div>
      {recent.length === 0 ? (
        <div className="hint" style={{ padding: "12px 4px" }}>
          {labels.recentEmpty}
        </div>
      ) : (
        recent.map((s) => {
          const tone = RESULT_TONE[s.result] ?? "neutral";
          return (
            <div className="item" key={s.id}>
              <span
                className="bar"
                style={{
                  background: `var(--p-${tone === "warn" ? "warning" : tone === "danger" ? "danger" : tone === "ok" ? "success" : "border"})`,
                }}
              />
              <KIcon name="Package" size={18} style={{ color: "var(--p-text-2)" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="t">{s.body ?? s.result}</div>
                <div className="s">
                  {s.result}
                  {s.at ? ` · ${s.at}` : ""}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${tone}`}>{s.result}</span>
            </div>
          );
        })
      )}
    </>
  );
}
