"use client";

import dynamic from "next/dynamic";

import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Lazy loader so web-ifc (~3 MB JS + 3 MB WASM) + three.js (~600 KB)
 * only ship on the viewer route. Without this they'd land in every
 * console bundle.
 */
function ViewerLoading() {
  const t = useT();
  return (
    <div className="surface p-6 text-sm text-[var(--text-muted)]">
      {t("console.bim.view.loadingViewer", undefined, "Loading 3D viewer…")}
    </div>
  );
}

const ViewerClient = dynamic(() => import("./viewer-client"), {
  ssr: false,
  loading: () => <ViewerLoading />,
});

export default ViewerClient;
