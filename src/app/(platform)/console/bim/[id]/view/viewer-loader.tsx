"use client";

import dynamic from "next/dynamic";

/**
 * Lazy loader so web-ifc (~3 MB JS + 3 MB WASM) + three.js (~600 KB)
 * only ship on the viewer route. Without this they'd land in every
 * console bundle.
 */
const ViewerClient = dynamic(() => import("./viewer-client"), {
  ssr: false,
  loading: () => <div className="surface p-6 text-sm text-[var(--text-muted)]">Loading 3D viewer…</div>,
});

export default ViewerClient;
