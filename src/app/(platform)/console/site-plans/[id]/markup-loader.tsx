"use client";

import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Lazy loader so pdfjs-dist (~1.2 MB) only ships on this route. The
 * detail page imports this thin wrapper and the heavy canvas + worker
 * stay out of the rest of the bundle graph.
 */
function LoadingPlaceholder() {
  const t = useT();
  return (
    <div className="surface p-6 text-sm text-[var(--p-text-2)]">
      {t("console.sitePlans.markup.loading", undefined, "Loading sheet…")}
    </div>
  );
}

const MarkupClient = dynamic(() => import("./markup-client"), {
  ssr: false,
  loading: () => <LoadingPlaceholder />,
});

export default MarkupClient;
