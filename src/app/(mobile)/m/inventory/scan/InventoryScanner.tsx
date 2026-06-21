"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KIcon } from "@/components/mobile/kit";
import { requestPermission } from "@/lib/native/permissions";
import { scanCode, type ScanState } from "./actions";

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
};

const RESULT_TONE: Record<string, "ok" | "warn" | "danger" | "neutral"> = {
  accepted: "ok",
  duplicate: "warn",
  expired: "warn",
  wrong_zone: "warn",
  voided: "danger",
  not_found: "neutral",
};

/**
 * COMPVSS inventory scanner. Kit `.scanframe` reticle plus a manual asset-tag
 * entry form, both resolving through the surviving `scanCode` action (which
 * journals via `scanAssignment`). Recent activity is server-fetched scan events.
 */
export function InventoryScanner({
  recent,
  labels,
}: {
  recent: RecentScan[];
  labels: InventoryScanLabels;
}) {
  const [code, setCode] = useState("");
  const [state, formAction, pending] = useActionState<ScanState, FormData>(scanCode, null);

  return (
    <>
      <Link href="/m/inventory" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {labels.back}
      </Link>
      <div className="scr-eye">{labels.eyebrow}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {labels.title}
      </h1>

      <CameraReticle
        enableLabel={labels.enableCamera ?? "Enable Camera"}
        deniedLabel={labels.cameraDenied ?? "Camera Unavailable — Use Manual Entry"}
      />
      <div className="scanhint">
        <KIcon name="QrCode" size={14} /> <KIcon name="Barcode" size={14} /> {labels.hint}
      </div>

      <form action={formAction}>
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

/**
 * Live camera reticle. Before grant, shows the static reticle with an "Enable
 * Camera" affordance; on grant, lights the frame with a `getUserMedia` preview.
 * The stream is torn down on unmount. Manual asset-tag entry stays available
 * regardless — this only lights the frame where camera access is granted.
 */
function CameraReticle({ enableLabel, deniedLabel }: { enableLabel: string; deniedLabel: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<"idle" | "requesting" | "live" | "denied">("idle");

  const stop = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => stop, []);

  const enable = async () => {
    setState("requesting");
    const res = await requestPermission("camera");
    if (!res.granted) {
      setState("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setState("live");
    } catch {
      setState("denied");
    }
  };

  return (
    <div className="scanframe" style={{ position: "relative", overflow: "hidden" }}>
      {state === "live" && (
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      <div className="reticle">
        <span className="cnr tl" />
        <span className="cnr tr" />
        <span className="cnr bl" />
        <span className="cnr br" />
        <span className="laser" />
      </div>
      {state !== "live" && (
        <button
          type="button"
          className="ps-btn ps-btn--cta"
          onClick={enable}
          disabled={state === "requesting"}
          style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}
        >
          <KIcon name="Camera" size={16} /> {state === "denied" ? deniedLabel : enableLabel}
        </button>
      )}
    </div>
  );
}
