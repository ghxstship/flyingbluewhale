"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { KIcon } from "@/components/mobile/kit";
import { CameraScanner, type ScannedCode } from "@/components/scanners";
import { formatsForMode } from "@/lib/scan/formats";
import { scanFeedback } from "@/lib/haptics";
import { redeemTicket, type DoorResult, type DoorScanRow } from "./actions";

export type DoorListing = {
  id: string;
  title: string;
  slug: string;
  venueName: string | null;
  startsAt: string | null;
};

export type DoorLabels = {
  eyebrow: string;
  title: string;
  scanHint: string;
  manualLabel: string;
  manualPlaceholder: string;
  cta: string;
  scanning: string;
  recentTitle: string;
  recentEmpty: string;
  holder: string;
  seat: string;
  gatePlaceholder: string;
  /** Honest offline copy — door redeems run an RPC and cannot queue. */
  offlineError?: string;
  /** Humanized, i18n'd scan-result labels; falls back to the raw enum. */
  results?: Partial<Record<DoorResult, string>>;
};

const RESULT_TONE: Record<DoorResult, "ok" | "warn" | "danger"> = {
  accepted: "ok",
  duplicate: "warn",
  refunded: "warn",
  voided: "warn",
  not_found: "danger",
};

const RESULT_TOKEN: Record<"ok" | "warn" | "danger", string> = {
  ok: "var(--p-success)",
  warn: "var(--p-warning)",
  danger: "var(--p-danger)",
};

const RESULT_BADGE: Record<"ok" | "warn" | "danger", string> = {
  ok: "ok",
  warn: "warn",
  danger: "danger",
};

type SessionScan = DoorScanRow & { key: string };

/**
 * COMPVSS first-party box-office door scanner. Reuses the shared
 * `CameraScanner` for live QR / barcode decode and a manual code-entry form as
 * the always-available fallback (camera bridge drops on some clients). Every
 * scanned or typed code runs `redeemTicket`, which calls the
 * `redeem_event_ticket` RPC. The latest outcome is painted prominently via the
 * semantic `--p-success` / `--p-warning` / `--p-danger` tokens, and a running
 * session list keeps the recent gate activity in view.
 */
export function DoorScanner({
  listing,
  gate,
  labels,
}: {
  listing: DoorListing;
  gate: string;
  labels: DoorLabels;
}) {
  const [code, setCode] = useState("");
  const [last, setLast] = useState<DoorScanRow | null>(null);
  const [offlineError, setOfflineError] = useState(false);
  const [recent, setRecent] = useState<SessionScan[]>([]);
  const [pending, startTransition] = useTransition();
  const inFlightRef = useRef(false);
  // Decodes arriving while a redeem is in flight are buffered, not dropped —
  // a gate line often produces back-to-back scans faster than the round trip.
  const bufferRef = useRef<string[]>([]);

  const submit = useCallback(
    (raw: string) => {
      const value = raw.trim();
      if (!value) return;
      if (inFlightRef.current) {
        if (!bufferRef.current.includes(value)) bufferRef.current.push(value);
        return;
      }
      inFlightRef.current = true;
      setOfflineError(false);
      const fd = new FormData();
      fd.set("code", value);
      fd.set("gate", gate);
      fd.set("location", listing.venueName ?? listing.title);
      startTransition(async () => {
        try {
          const res = await redeemTicket(null, fd);
          if (!res) return;
          if (!res.ok) {
            scanFeedback("error");
            const miss: SessionScan = { result: "not_found", key: `${Date.now()}` };
            setLast({ result: "not_found" });
            setRecent((prev) => [miss, ...prev].slice(0, 12));
            return;
          }
          scanFeedback(
            res.scan.result === "accepted" ? "success" : res.scan.result === "not_found" ? "error" : "warning",
          );
          setLast(res.scan);
          setRecent((prev) => [{ ...res.scan, key: `${Date.now()}` }, ...prev].slice(0, 12));
          setCode("");
        } catch {
          // Server-action fetch failed (offline / transient). Ticket redeems
          // run an RPC that cannot be queued — be explicit that NOTHING was
          // recorded rather than throwing into the error boundary.
          scanFeedback("error");
          setOfflineError(true);
        } finally {
          // Always release the single-flight guard — a throw used to leave it
          // stuck true, bricking the scanner until reload.
          inFlightRef.current = false;
          const next = bufferRef.current.shift();
          if (next) submit(next);
        }
      });
    },
    [gate, listing.venueName, listing.title],
  );

  const onScan = useCallback((scanned: ScannedCode) => submit(scanned.value), [submit]);

  const lastTone = last ? RESULT_TONE[last.result] : null;
  const resultLabel = (result: DoorResult) => labels.results?.[result] ?? result;

  return (
    <>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {labels.title} · {listing.title}
      </h1>

      <div className="scanframe" style={{ position: "relative", overflow: "hidden" }}>
        <CameraScanner onScan={onScan} formats={formatsForMode("access")} className="!rounded-none" />
      </div>
      <div className="scanhint">
        <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {labels.scanHint}
      </div>

      {/* Manual code entry — the camera bridge drops on some clients; the form
          is the always-available redeem path. */}
      <form
        action={(fd) => submit(String(fd.get("code") ?? ""))}
      >
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

      {offlineError && (
        <div className="import-note" role="alert" style={{ marginTop: 14 }}>
          <KIcon name="TriangleAlert" size={15} style={{ color: "var(--p-danger)" }} />
          <span style={{ fontSize: 12 }}>
            {labels.offlineError ??
              "No connection. This scan was NOT recorded. Ticket redeems need a live connection; retry when back online."}
          </span>
        </div>
      )}

      {last && lastTone && (
        <div
          className="item"
          style={{
            marginTop: 14,
            borderColor: RESULT_TOKEN[lastTone],
            borderWidth: 2,
            borderStyle: "solid",
          }}
        >
          <span className="bar" style={{ background: RESULT_TOKEN[lastTone] }} />
          <KIcon
            name={lastTone === "ok" ? "CheckCircle2" : lastTone === "danger" ? "XCircle" : "TriangleAlert"}
            size={22}
            style={{ color: RESULT_TOKEN[lastTone] }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="t" style={{ color: RESULT_TOKEN[lastTone] }}>
              {resultLabel(last.result)}
            </div>
            <div className="s">
              {last.holder ? `${labels.holder}: ${last.holder}` : ""}
              {last.holder && last.seat ? " · " : ""}
              {last.seat ? `${labels.seat}: ${last.seat}` : ""}
            </div>
          </div>
          <span className={`ps-badge ps-badge--${RESULT_BADGE[lastTone]}`}>{resultLabel(last.result)}</span>
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
          const tone = RESULT_TONE[s.result];
          return (
            <div className="item" key={s.key}>
              <span className="bar" style={{ background: RESULT_TOKEN[tone] }} />
              <KIcon name="ScanLine" size={18} style={{ color: "var(--p-text-2)" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="t">{s.holder ?? resultLabel(s.result)}</div>
                <div className="s">
                  {resultLabel(s.result)}
                  {s.seat ? ` · ${labels.seat} ${s.seat}` : ""}
                </div>
              </div>
              <span className={`ps-badge ps-badge--${RESULT_BADGE[tone]}`}>{resultLabel(s.result)}</span>
            </div>
          );
        })
      )}
    </>
  );
}
