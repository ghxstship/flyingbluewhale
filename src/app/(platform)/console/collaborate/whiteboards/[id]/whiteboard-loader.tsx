"use client";

import dynamic from "next/dynamic";

/**
 * Lazy loader so the browser-only tldraw bundle (canvas + WASM-free but
 * window-dependent) only ships on this route and never runs during SSR.
 * Mirrors src/app/(platform)/console/bim/[id]/view/viewer-loader.tsx.
 */
function CanvasLoading() {
  return (
    <div className="surface p-6 text-sm text-[var(--p-text-2)]">Loading whiteboard…</div>
  );
}

export const WhiteboardCanvas = dynamic(
  () => import("./whiteboard-canvas").then((m) => m.WhiteboardCanvas),
  {
    ssr: false,
    loading: () => <CanvasLoading />,
  },
);
