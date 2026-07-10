"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { GatedCameraScanner, useScanSubmit } from "@/components/scanners";

export type RecentScan = {
  id: string;
  result: string;
  body: string | null;
  at: string;
};

export type CheckInLabels = {
  eyebrow: string;
  title: string;
  access: string;
  asset: string;
  pos: string;
  nfc: string;
  rfid: string;
  qr: string;
  scanHintCamera: string;
  scanHintAccess: string;
  enableCamera?: string;
  cameraDenied?: string;
  nfcHint: string;
  ctaAccess: string;
  ctaAsset: string;
  ctaPos: string;
  ctaNfc: string;
  manual: string;
  manualLabel: string;
  manualPlaceholder: string;
  batch: string;
  scanning: string;
  recentTitle: string;
  recentEmpty: string;
  logged: string;
  /** Queued-offline result line. Optional so callers can roll out additively. */
  queuedTitle?: string;
  queuedBody?: string;
};

type Mode = "access" | "asset" | "pos" | "nfc";

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  duplicate: "warn",
  expired: "warn",
  wrong_zone: "warn",
  voided: "danger",
  not_found: "neutral",
};

/**
 * COMPVSS field check-in scanner. Segmented Access / Asset / POS / NFC with a
 * REAL camera decoder (shared `CameraScanner` behind a tap-to-enable gate) and
 * a manual code-entry form. Both paths submit through `useScanSubmit`, which
 * POSTs the queueable `/api/v1/scan` endpoint — so an offline gate scan is
 * durably queued by the service worker and replayed on reconnect (shown as
 * "recorded, will sync", never a false accept). Haptic + beep per outcome.
 */
export function CheckInScanner({
  recent,
  labels,
  gateSlug,
}: {
  recent: RecentScan[];
  labels: CheckInLabels;
  gateSlug?: string;
}) {
  const [mode, setMode] = useState<Mode>("access");
  const [code, setCode] = useState("");
  const { submit, pending, outcome } = useScanSubmit();

  const modes = useMemo(
    () =>
      [
        ["access", labels.access],
        ["asset", labels.asset],
        ["pos", labels.pos],
        ["nfc", labels.nfc],
      ] as Array<[Mode, string]>,
    [labels],
  );

  const isNfc = mode === "nfc";
  const cta =
    mode === "access"
      ? labels.ctaAccess
      : mode === "asset"
        ? labels.ctaAsset
        : mode === "pos"
          ? labels.ctaPos
          : labels.ctaNfc;
  const scanHint = mode === "access" ? labels.scanHintAccess : labels.scanHintCamera;

  const onManualSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    void submit(code);
    setCode("");
  };

  return (
    <>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {gateSlug ? `${labels.title} · ${gateSlug}` : labels.title}
      </h1>

      <div className="seg2" style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)" }}>
        {modes.map(([id, label]) => (
          <button
            key={id}
            className={mode === id ? "on" : ""}
            onClick={() => setMode(id)}
            type="button"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            {label}
          </button>
        ))}
      </div>

      {isNfc ? (
        <>
          <div className="nfcframe">
            <span className="nfc-ring r3" />
            <span className="nfc-ring r2" />
            <span className="nfc-ring r1" />
            <span className="nfc-core">
              <KIcon name="Nfc" size={30} />
            </span>
          </div>
          <div className="scanhint">
            <KIcon name="Radio" size={14} /> {labels.nfcHint}
          </div>
        </>
      ) : (
        <>
          <GatedCameraScanner
            onScan={(scanned) => void submit(scanned.value)}
            enableLabel={labels.enableCamera ?? "Enable Camera"}
            deniedLabel={labels.cameraDenied ?? "Camera Unavailable, Use Manual Entry"}
          />
          <div className="scanhint">
            <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {scanHint}
          </div>
        </>
      )}

      {/* Manual code entry — the camera/NFC bridge drops on native clients; the
          form is the always-available resolver path. Same submit path as the
          camera, so the offline queue applies to typed codes too. */}
      <form onSubmit={onManualSubmit}>
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
          <KIcon name={isNfc ? "Nfc" : "ScanLine"} size={16} /> {pending ? labels.scanning : cta}
        </button>
      </form>

      {mode === "asset" && (
        <Link
          href="/m/check-in/batch"
          className="ps-btn ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 8, textDecoration: "none" }}
        >
          <KIcon name="PackageCheck" size={16} /> {labels.batch}
        </Link>
      )}

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
              <KIcon name="ScanLine" size={18} style={{ color: "var(--p-text-2)" }} />
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
