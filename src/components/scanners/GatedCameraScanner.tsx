"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { requestPermission } from "@/lib/native/permissions";
import { formatsForMode } from "@/lib/scan/formats";
import { CameraScanner, type ScannedCode } from "./CameraScanner";

/**
 * Kit-styled, permission-gated live scanner. Replaces the old decorative
 * `CameraReticle` (a bare getUserMedia preview that never decoded): before
 * grant it shows the kit `.scanframe` reticle with an Enable Camera
 * affordance; on grant it mounts the real `CameraScanner` (BarcodeDetector
 * + zxing fallback + torch) whose decodes feed `onScan` — the same submit
 * path as manual entry. Camera access stays behind an explicit tap so we
 * never prompt for permission on page load.
 */
export function GatedCameraScanner({
  onScan,
  formats = formatsForMode("any"),
  enableLabel,
  deniedLabel,
}: {
  onScan: (code: ScannedCode) => void;
  formats?: readonly string[];
  enableLabel: string;
  deniedLabel: string;
}) {
  const [state, setState] = useState<"idle" | "requesting" | "live" | "denied">("idle");

  const enable = async () => {
    setState("requesting");
    const res = await requestPermission("camera");
    setState(res.granted ? "live" : "denied");
  };

  return (
    <div className="scanframe" style={{ position: "relative", overflow: "hidden" }}>
      {state === "live" ? (
        <CameraScanner onScan={onScan} formats={formats} className="!rounded-none" />
      ) : (
        <>
          <div className="reticle">
            <span className="cnr tl" />
            <span className="cnr tr" />
            <span className="cnr bl" />
            <span className="cnr br" />
            <span className="laser" />
          </div>
          <button
            type="button"
            className="ps-btn ps-btn--cta"
            onClick={() => void enable()}
            disabled={state === "requesting"}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}
          >
            <Camera size={16} aria-hidden /> {state === "denied" ? deniedLabel : enableLabel}
          </button>
        </>
      )}
    </div>
  );
}
