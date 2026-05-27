"use client";

import dynamic from "next/dynamic";

/**
 * Lazy loader so pdfjs-dist (~1.2 MB) only ships on this route. The
 * detail page imports this thin wrapper and the heavy canvas + worker
 * stay out of the rest of the bundle graph.
 */
const MarkupClient = dynamic(() => import("./markup-client"), {
  ssr: false,
  loading: () => <div className="surface p-6 text-sm text-[var(--text-muted)]">Loading sheet…</div>,
});

export default MarkupClient;
