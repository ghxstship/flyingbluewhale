"use client";

import { useEffect, useRef, useState } from "react";
import { DxfViewer } from "dxf-viewer";

/**
 * 2D CAD viewer for DXF sheets (gap: CAD formats were download-only; IFC had
 * a viewer, DWG/DXF had nothing web-viewable). DXF is the universal CAD
 * exchange format — any vendor holding a DWG can export one — so this is the
 * free on-ramp; native DWG/RVT/NWD remain the Autodesk Platform Services
 * integration (ADR-0017).
 *
 * dxf-viewer vendors its own three@0.161 (nested dep, isolated from our
 * 0.180) — acceptable because this component is lazy-loaded on the viewer
 * route only.
 */
export default function DxfViewerClient({ dxfUrl }: { dxfUrl: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let viewer: DxfViewer | null = null;
    let cancelled = false;

    (async () => {
      try {
        viewer = new DxfViewer(host, { autoResize: true, antialias: true });
        await viewer.Load({ url: dxfUrl, fonts: null });
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      viewer?.Destroy();
    };
  }, [dxfUrl]);

  return (
    <div className="surface overflow-hidden rounded-[var(--p-r-md)]">
      {status === "loading" && (
        <div className="p-3 text-sm text-[var(--p-text-2)]">Parsing DXF…</div>
      )}
      {status === "error" && (
        <div className="p-3 text-sm text-[var(--p-danger-text)]">
          Couldn&apos;t parse this DXF. Download it and open locally, or re-export from the source CAD as ASCII DXF.
        </div>
      )}
      <div ref={hostRef} style={{ width: "100%", height: "70vh" }} />
    </div>
  );
}
