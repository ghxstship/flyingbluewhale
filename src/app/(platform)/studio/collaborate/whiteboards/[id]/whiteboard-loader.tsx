"use client";

import dynamic from "next/dynamic";

import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Lazy loader so the browser-only tldraw bundle (canvas + WASM-free but
 * window-dependent) only ships on this route and never runs during SSR.
 * Mirrors src/app/(platform)/studio/bim/[id]/view/viewer-loader.tsx.
 */
function CanvasLoading() {
  const t = useT();
  return (
    <div className="surface p-6 text-sm text-[var(--p-text-2)]">
      {t("console.collaborate.whiteboards.detail.loading", undefined, "Loading whiteboard…")}
    </div>
  );
}

export const WhiteboardCanvas = dynamic(
  () => import("./whiteboard-canvas").then((m) => m.WhiteboardCanvas),
  {
    ssr: false,
    loading: () => <CanvasLoading />,
  },
);
