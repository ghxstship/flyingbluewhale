"use client";

import dynamic from "next/dynamic";

import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Lazy loader — dxf-viewer ships its own nested three.js, so it must only
 * load on the viewer route, mirroring the IFC viewer-loader.
 */
function DxfLoading() {
  const t = useT();
  return (
    <div className="surface p-6 text-sm text-[var(--p-text-2)]">
      {t("console.bim.view.loadingViewer", undefined, "Loading 3D viewer…")}
    </div>
  );
}

const DxfViewerLazy = dynamic(() => import("./dxf-viewer-client"), {
  ssr: false,
  loading: () => <DxfLoading />,
});

export default DxfViewerLazy;
