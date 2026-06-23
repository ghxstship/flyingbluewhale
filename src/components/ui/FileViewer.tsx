"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/**
 * FileViewer — a preview shell for an attachment: a toolbar (name, page
 * indicator, zoom controls, Download) over a body that renders an image, a
 * PDF iframe, or a placeholder card for opaque doc types. Ported from the
 * ATLVS kit (kits/core/components/data/FileViewer.d.ts).
 */
export function FileViewer({
  src,
  name,
  kind = "image",
  pages,
  page,
  onDownload,
  className = "",
  style,
}: {
  src: string;
  name?: ReactNode;
  kind?: "image" | "pdf" | "doc";
  /** Total page count, for the "n / total" indicator. */
  pages?: number;
  /** Current page (1-based). */
  page?: number;
  onDownload?: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  const [zoom, setZoom] = useState(1);
  const clamp = (z: number) => Math.min(3, Math.max(0.25, Math.round(z * 100) / 100));

  const iconBtn: CSSProperties = {
    width: 28,
    height: 28,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--p-border)",
    borderRadius: "var(--p-r-sm, 6px)",
    background: "var(--p-surface)",
    color: "var(--p-text-2)",
    cursor: "pointer",
    font: "inherit",
    fontSize: 15,
    lineHeight: 1,
  };

  return (
    <div
      className={className}
      style={{
        border: "1px solid var(--p-border)",
        borderRadius: "var(--p-r, 8px)",
        overflow: "hidden",
        background: "var(--p-surface)",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 10px",
          borderBottom: "1px solid var(--p-border)",
          background: "var(--p-surface-2)",
        }}
      >
        <span
          style={{
            flex: 1,
            minWidth: 0,
            color: "var(--p-text-1)",
            fontWeight: 600,
            fontSize: 13,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name ?? "Untitled"}
        </span>
        {pages ? (
          <span style={{ fontFamily: "var(--p-mono)", fontSize: 12, color: "var(--p-text-3)" }}>
            {page ?? 1} / {pages}
          </span>
        ) : null}
        <button type="button" title="Zoom out" aria-label="Zoom out" style={iconBtn} onClick={() => setZoom((z) => clamp(z - 0.25))}>
          −
        </button>
        <span style={{ fontFamily: "var(--p-mono)", fontSize: 12, color: "var(--p-text-3)", minWidth: 38, textAlign: "center" }}>
          {Math.round(zoom * 100)}%
        </span>
        <button type="button" title="Zoom in" aria-label="Zoom in" style={iconBtn} onClick={() => setZoom((z) => clamp(z + 0.25))}>
          +
        </button>
        <button
          type="button"
          onClick={onDownload}
          style={{
            ...iconBtn,
            width: "auto",
            paddingInline: 10,
            fontSize: 13,
            color: "var(--p-accent-text)",
          }}
        >
          Download
        </button>
      </div>

      <div
        style={{
          minHeight: 240,
          maxHeight: 560,
          overflow: "auto",
          display: "flex",
          alignItems: kind === "doc" ? "center" : "flex-start",
          justifyContent: "center",
          padding: 16,
          background: "var(--p-bg)",
        }}
      >
        {kind === "image" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={typeof name === "string" ? name : "Preview"}
            style={{
              maxWidth: "100%",
              transform: `scale(${zoom})`,
              transformOrigin: "top center",
              transition: "transform var(--motion-fast) var(--ease-standard)",
            }}
          />
        )}
        {kind === "pdf" && (
          <iframe
            src={src}
            title={typeof name === "string" ? name : "PDF preview"}
            style={{ width: "100%", height: 520, border: "none", background: "var(--p-surface)" }}
          />
        )}
        {kind === "doc" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: 32,
              border: "1px dashed var(--p-border-2)",
              borderRadius: "var(--p-r, 8px)",
              color: "var(--p-text-3)",
              textAlign: "center",
            }}
          >
            <span aria-hidden style={{ fontSize: 32, lineHeight: 1 }}>
              ▦
            </span>
            <span style={{ color: "var(--p-text-2)", fontWeight: 600 }}>{name ?? "Document"}</span>
            <span style={{ fontSize: 13 }}>Preview unavailable — download to open.</span>
          </div>
        )}
      </div>
    </div>
  );
}
