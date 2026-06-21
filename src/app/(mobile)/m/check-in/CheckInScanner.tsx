"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { scanCode, type CheckInState } from "./actions";

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
 * COMPVSS field check-in scanner. Segmented Access / Asset / POS / NFC, kit
 * `.scanframe` reticle (camera modes) and `.nfcframe` (NFC tap), plus a manual
 * code-entry form. All modes resolve through the surviving `scanCode` action —
 * the unified assignments domain is mode-agnostic; `mode`/`slug` are carried
 * only for UI context. Ref design: app.jsx 2527-2600.
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
  const [state, formAction, pending] = useActionState<CheckInState, FormData>(scanCode, null);

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
          <div className="scanframe">
            <div className="reticle">
              <span className="cnr tl" />
              <span className="cnr tr" />
              <span className="cnr bl" />
              <span className="cnr br" />
              <span className="laser" />
            </div>
          </div>
          <div className="scanhint">
            <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {scanHint}
          </div>
        </>
      )}

      {/* Manual code entry — the camera/NFC bridge drops on native clients; the
          form is the always-available resolver path. */}
      <form action={formAction}>
        <input type="hidden" name="mode" value={mode} />
        {gateSlug && <input type="hidden" name="slug" value={gateSlug} />}
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

      {state && state.ok && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className={`ps-badge ps-badge--${RESULT_TONE[state.result.result] ?? "neutral"}`}>
            {state.result.result}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t">{("title" in state.result && state.result.title) || labels.logged}</div>
          </div>
        </div>
      )}
      {state && !state.ok && (
        <div className="import-note" style={{ marginTop: 14 }}>
          <KIcon name="TriangleAlert" size={15} style={{ color: "var(--p-danger)" }} />
          <span style={{ fontSize: 12 }}>{state.error}</span>
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
