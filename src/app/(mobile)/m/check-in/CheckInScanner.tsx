"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { GatedCameraScanner, useScanSubmit } from "@/components/scanners";
import { formatsForMode } from "@/lib/scan/formats";
import { posGtinCandidate } from "@/lib/scan/product";
import { BindGtinCard, ProductMatchCard, type BindableCatalogItem, type ProductLabels } from "./ProductMatchCard";

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
  qr: string;
  scanHintCamera: string;
  scanHintAccess: string;
  enableCamera?: string;
  cameraDenied?: string;
  ctaAccess: string;
  ctaAsset: string;
  ctaPos: string;
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

type Mode = "access" | "asset" | "pos";

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  // resolver 2 identified an asset — a hit, though not an entitlement accept.
  asset: "ok",
  // resolver 3 matched a catalog GTIN binding (rendered by ProductMatchCard).
  product: "ok",
  duplicate: "warn",
  expired: "warn",
  wrong_zone: "warn",
  voided: "danger",
  not_found: "neutral",
};

/**
 * COMPVSS field check-in scanner. Segmented Access / Asset / POS over a REAL
 * camera decoder (shared `CameraScanner` behind a tap-to-enable gate) and a
 * manual code-entry form.
 *
 * `mode` is a CONSTRAINT, not decoration: it selects the symbology set the
 * camera will decode (`formatsForMode`) and is sent to the server, which
 * refuses to resolve a retail barcode on an access surface. It previously
 * changed only labels — all three modes hit the same resolver.
 *
 * There is no NFC mode. It rendered animated rings and read nothing: Web NFC
 * is unavailable in WKWebView and, on Android, the System WebView never plumbs
 * the `nfc` permission — so it cannot work in the Capacitor shell on either
 * platform. Real NFC needs a native plugin. See
 * docs/compvss/SCANNING_UNIVERSAL_CAPTURE_PLAN.md §1.5. Both paths submit through `useScanSubmit`, which
 * POSTs the queueable `/api/v1/scan` endpoint — so an offline gate scan is
 * durably queued by the service worker and replayed on reconnect (shown as
 * "recorded, will sync", never a false accept). Haptic + beep per outcome.
 */
export function CheckInScanner({
  recent,
  labels,
  gateSlug,
  initialMode,
  backHref,
  backLabel,
  productLabels,
  canFulfill = false,
  canBind = false,
  catalogItems = [],
}: {
  recent: RecentScan[];
  labels: CheckInLabels;
  gateSlug?: string;
  /** Preset segment — the §C Inventory preset opens on Asset. Default Access. */
  initialMode?: Mode;
  /** Optional back link rendered above the surface (Inventory preset → Assets). */
  backHref?: string;
  backLabel?: string;
  /** POS product-match card copy. Optional so callers roll out additively. */
  productLabels?: ProductLabels;
  /** Manager-band: may flip an approved advance line to delivered on-scan. */
  canFulfill?: boolean;
  /** Manager-band (`people:manage`): may bind an unknown GTIN to a catalog item. */
  canBind?: boolean;
  /** Org catalog items for the bind picker. Only sent when `canBind`. */
  catalogItems?: BindableCatalogItem[];
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? "access");
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { submit, pending, outcome } = useScanSubmit(mode);

  const modes = useMemo(
    () =>
      [
        ["access", labels.access],
        ["asset", labels.asset],
        ["pos", labels.pos],
      ] as Array<[Mode, string]>,
    [labels],
  );

  const cta = mode === "access" ? labels.ctaAccess : mode === "asset" ? labels.ctaAsset : labels.ctaPos;

  // Keep the manual field focused. This IS the RFID/UHF story: no phone reads
  // UHF, but a Bluetooth sled in HID keyboard-wedge mode types the tag EPC into
  // whatever has focus — so an auto-focused input makes sleds work today on
  // both platforms with no plugin and no native-shell change.
  // `preventScroll` keeps the reticle in view when focus lands.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [mode]);
  const scanHint = mode === "access" ? labels.scanHintAccess : labels.scanHintCamera;

  const onManualSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    void submit(code);
    setCode("");
    // Re-focus so a wedge scanner can fire the next tag straight into the field
    // without a tap. Harmless for humans, load-bearing for sleds.
    inputRef.current?.focus();
  };

  return (
    <>
      {backHref && backLabel && (
        <Link href={backHref} className="backbtn">
          <KIcon name="ChevronLeft" size={17} /> {backLabel}
        </Link>
      )}
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {gateSlug ? `${labels.title} · ${gateSlug}` : labels.title}
      </h1>

      <div className="seg2" style={{ marginBottom: 14, display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
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

      <GatedCameraScanner
        onScan={(scanned) => void submit(scanned.value, scanned.format)}
        formats={formatsForMode(mode)}
        enableLabel={labels.enableCamera ?? "Enable Camera"}
        deniedLabel={labels.cameraDenied ?? "Camera Unavailable, Use Manual Entry"}
      />
      <div className="scanhint">
        <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {scanHint}
      </div>

      {/* Manual code entry — the always-available resolver path, and the
          Bluetooth-sled (HID keyboard-wedge) input surface. Same submit path as
          the camera, so the offline queue applies to typed codes too. */}
      <form onSubmit={onManualSubmit}>
        <div className="fld" style={{ marginTop: 6 }}>
          <label className="wl" htmlFor="code">
            {labels.manualLabel}
          </label>
          <input
            ref={inputRef}
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
          <KIcon name="ScanLine" size={16} /> {pending ? labels.scanning : cta}
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

      {outcome?.kind === "result" && outcome.result.result === "product" && productLabels ? (
        <ProductMatchCard
          key={`${outcome.result.gtin14}:${outcome.code}`}
          product={outcome.result}
          canFulfill={canFulfill}
          labels={productLabels}
        />
      ) : (
        outcome?.kind === "result" && (
          <div className="item" style={{ marginTop: 14 }}>
            <span className={`ps-badge ps-badge--${RESULT_TONE[outcome.result.result] ?? "neutral"}`}>
              {outcome.result.result}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{("title" in outcome.result && outcome.result.title) || labels.logged}</div>
            </div>
          </div>
        )
      )}
      {/* Unknown GTIN on the POS segment: the miss is journaled server-side;
          a manager can bind it to a catalog item right here so the next scan
          resolves. Keyed by code so a new scan resets the picker. */}
      {outcome?.kind === "result" &&
        outcome.result.result === "not_found" &&
        mode === "pos" &&
        canBind &&
        productLabels &&
        posGtinCandidate(outcome.code) && (
          <BindGtinCard key={outcome.code} code={outcome.code} catalogItems={catalogItems} labels={productLabels} />
        )}
      {outcome?.kind === "queued" && (
        <div className="item" style={{ marginTop: 14 }}>
          <span className="ps-badge ps-badge--warn">{labels.queuedTitle ?? "Recorded"}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t" style={{ fontFamily: "var(--p-mono)" }}>
              {outcome.code}
            </div>
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
