"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as pdfjs from "pdfjs-dist";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * PDF.js + canvas drawing-markup renderer (gap G-015 / B7 runtime).
 *
 * Two stacked canvases inside a positioned wrapper:
 *   1. base — PDF.js renders the sheet page at the device pixel ratio.
 *   2. overlay — markups are drawn on top; pointer events compose new ones.
 *
 * Markups round-trip through /api/v1/drawings/[siteplanId]/markups (the
 * REST API landed in Round 64). Geometry is stored in PDF-page space
 * (matches the canonical Bluebeam convention) so re-renders at any
 * zoom level are exact.
 *
 * Why this lives in a client island: PDF.js needs the DOM (Canvas2D),
 * and the worker bundle is heavy. The parent page lazy-loads this
 * island via next/dynamic so the bundle cost is paid only on this route.
 */

// Mozilla ships a separate worker bundle. Using a same-origin URL keeps
// it CSP-clean and avoids CDN coupling.
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
}

type MarkupKind =
  | "rectangle"
  | "ellipse"
  | "polygon"
  | "polyline"
  | "freehand"
  | "cloud"
  | "text"
  | "callout"
  | "dimension"
  | "highlight"
  | "measure_count";

type Markup = {
  id: string;
  layer_id: string | null;
  kind: MarkupKind;
  geometry: Record<string, unknown>;
  color: string;
  fill_color: string | null;
  fill_opacity: number | null;
  stroke_width: number;
  text_content: string | null;
  text_size: number | null;
};

type Layer = {
  id: string;
  name: string;
  color: string;
  is_visible: boolean;
  ordinal: number;
};

type Props = {
  siteplanId: string;
  pdfUrl: string;
  calibrationInchesPerFoot?: number | null;
};

const DEFAULT_COLOR = "#EF4444";
const DEFAULT_STROKE = 2;

export default function MarkupClient({ siteplanId, pdfUrl, calibrationInchesPerFoot }: Props) {
  const t = useT();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [scale, setScale] = useState(1.25);
  const [tool, setTool] = useState<MarkupKind>("rectangle");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [stroke, setStroke] = useState(DEFAULT_STROKE);
  const [text, setText] = useState(t("console.sitePlans.markup.defaultText", undefined, "Note"));
  const [markups, setMarkups] = useState<Markup[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Drawing state for a single in-progress markup.
  const drawingRef = useRef<{
    kind: MarkupKind;
    start: { x: number; y: number };
    current: { x: number; y: number };
    points: Array<[number, number]>;
  } | null>(null);

  // ── PDF rendering ────────────────────────────────────────────────────────
  const renderPage = useCallback(
    async (pageNumber: number, zoom: number) => {
      try {
        const loadingTask = pdfjs.getDocument({ url: pdfUrl });
        const pdf = await loadingTask.promise;
        setPageCount(pdf.numPages);
        const pdfPage = await pdf.getPage(pageNumber);
        const viewport = pdfPage.getViewport({ scale: zoom });

        const dpr = window.devicePixelRatio || 1;
        const base = baseCanvasRef.current!;
        const overlay = overlayCanvasRef.current!;
        for (const c of [base, overlay]) {
          c.width = Math.floor(viewport.width * dpr);
          c.height = Math.floor(viewport.height * dpr);
          c.style.width = `${viewport.width}px`;
          c.style.height = `${viewport.height}px`;
        }
        const ctx = base.getContext("2d")!;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [pdfUrl],
  );

  useEffect(() => {
    renderPage(page, scale);
  }, [page, scale, renderPage]);

  // ── Markup fetch ─────────────────────────────────────────────────────────
  const refetchMarkups = useCallback(async () => {
    const res = await fetch(`/api/v1/drawings/${siteplanId}/markups`);
    if (!res.ok) return;
    const json = (await res.json()) as { data?: { markups: Markup[]; layers: Layer[] } };
    if (json.data) {
      setMarkups(json.data.markups);
      setLayers(json.data.layers);
    }
  }, [siteplanId]);

  useEffect(() => {
    refetchMarkups();
  }, [refetchMarkups]);

  // ── Geometry + draw helpers ──────────────────────────────────────────────
  // Declared BEFORE paintOverlay: they close over reactive values
  // (page / scale / calibrationInchesPerFoot), so the react-compiler
  // reactivity analysis needs them in scope when paintOverlay captures them.
  function kindGeometry(live: NonNullable<typeof drawingRef.current>): Record<string, unknown> {
    const x = Math.min(live.start.x, live.current.x);
    const y = Math.min(live.start.y, live.current.y);
    const w = Math.abs(live.current.x - live.start.x);
    const h = Math.abs(live.current.y - live.start.y);
    switch (live.kind) {
      case "rectangle":
      case "ellipse":
      case "cloud":
      case "highlight":
        return { x, y, w, h, page };
      case "text":
      case "callout":
      case "measure_count":
        return { x: live.start.x, y: live.start.y, page };
      case "polyline":
      case "polygon":
      case "freehand":
        return { points: live.points, page };
      case "dimension":
        return {
          a: [live.start.x, live.start.y],
          b: [live.current.x, live.current.y],
          page,
          length_ft: calibrationInchesPerFoot
            ? Math.hypot(live.current.x - live.start.x, live.current.y - live.start.y) / (72 * calibrationInchesPerFoot)
            : null,
        };
    }
  }

  function drawMarkup(ctx: CanvasRenderingContext2D, m: Markup) {
    ctx.save();
    ctx.strokeStyle = m.color;
    ctx.lineWidth = Number(m.stroke_width) / scale;
    if (m.fill_color) {
      ctx.fillStyle = m.fill_color;
      ctx.globalAlpha = m.fill_opacity ?? 0.2;
    }
    const g = m.geometry as Record<string, number | number[] | string | undefined>;

    if (m.kind === "rectangle" || m.kind === "highlight") {
      const x = Number(g.x ?? 0),
        y = Number(g.y ?? 0),
        w = Number(g.w ?? 0),
        h = Number(g.h ?? 0);
      if (m.fill_color) ctx.fillRect(x, y, w, h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = m.color;
      ctx.strokeRect(x, y, w, h);
    } else if (m.kind === "ellipse") {
      const x = Number(g.x ?? 0),
        y = Number(g.y ?? 0),
        w = Number(g.w ?? 0),
        h = Number(g.h ?? 0);
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      if (m.fill_color) ctx.fill();
      ctx.stroke();
    } else if (m.kind === "cloud") {
      // Wavy rectangle — classic revision cloud.
      const x = Number(g.x ?? 0),
        y = Number(g.y ?? 0),
        w = Number(g.w ?? 0),
        h = Number(g.h ?? 0);
      const r = Math.max(8, Math.min(w, h) / 10);
      ctx.beginPath();
      const drawArc = (cx: number, cy: number) => ctx.arc(cx, cy, r, 0, Math.PI * 2);
      for (let cx = x + r; cx < x + w; cx += r * 1.6) drawArc(cx, y);
      for (let cy = y + r; cy < y + h; cy += r * 1.6) drawArc(x + w, cy);
      for (let cx = x + w - r; cx > x; cx -= r * 1.6) drawArc(cx, y + h);
      for (let cy = y + h - r; cy > y; cy -= r * 1.6) drawArc(x, cy);
      ctx.stroke();
    } else if (m.kind === "polyline" || m.kind === "polygon" || m.kind === "freehand") {
      const pts = (g.points as unknown as number[][]) ?? [];
      if (pts.length < 2) return ctx.restore();
      ctx.beginPath();
      // pts.length >= 2 checked above; each point is an [x, y] pair.
      ctx.moveTo(pts[0]![0] ?? 0, pts[0]![1] ?? 0);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i]![0] ?? 0, pts[i]![1] ?? 0);
      if (m.kind === "polygon") ctx.closePath();
      ctx.stroke();
    } else if (m.kind === "text" || m.kind === "callout") {
      const x = Number(g.x ?? 0),
        y = Number(g.y ?? 0);
      ctx.fillStyle = m.color;
      ctx.font = `${Number(m.text_size ?? 12) / scale}px sans-serif`;
      ctx.fillText(m.text_content ?? "", x, y);
    } else if (m.kind === "dimension") {
      const a = (g.a as number[]) ?? [0, 0];
      const b = (g.b as number[]) ?? [0, 0];
      ctx.beginPath();
      ctx.moveTo(a[0] ?? 0, a[1] ?? 0);
      ctx.lineTo(b[0] ?? 0, b[1] ?? 0);
      ctx.stroke();
      const lengthFt = g.length_ft;
      ctx.fillStyle = m.color;
      ctx.font = `${10 / scale}px sans-serif`;
      ctx.fillText(
        typeof lengthFt === "number" ? `${lengthFt.toFixed(2)} ft` : "—",
        ((a[0] ?? 0) + (b[0] ?? 0)) / 2,
        ((a[1] ?? 0) + (b[1] ?? 0)) / 2,
      );
    } else if (m.kind === "measure_count") {
      const x = Number(g.x ?? 0),
        y = Number(g.y ?? 0);
      ctx.beginPath();
      ctx.arc(x, y, 6 / scale, 0, Math.PI * 2);
      ctx.fillStyle = m.color;
      ctx.fill();
    }
    ctx.restore();
  }

  // ── Overlay paint ────────────────────────────────────────────────────────
  const paintOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    ctx.clearRect(0, 0, canvas.width / (dpr * scale), canvas.height / (dpr * scale));

    for (const m of markups) {
      if (m.geometry && (m.geometry.page ?? 1) !== page) continue;
      drawMarkup(ctx, m);
    }
    const live = drawingRef.current;
    if (live) {
      drawMarkup(ctx, {
        id: "live",
        layer_id: null,
        kind: live.kind,
        geometry: kindGeometry(live),
        color,
        fill_color: null,
        fill_opacity: null,
        stroke_width: stroke,
        text_content: live.kind === "text" ? text : null,
        text_size: 12,
      });
    }
    // drawMarkup / kindGeometry are render-scope helpers whose only reactive
    // capture is `scale`, which is already a dependency — the closures can
    // never go stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markups, page, scale, color, stroke, text]);

  useEffect(() => {
    paintOverlay();
  }, [paintOverlay]);

  // ── Pointer handlers ─────────────────────────────────────────────────────
  function toPageXY(e: React.PointerEvent): { x: number; y: number } {
    const rect = overlayCanvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }

  function onPointerDown(e: React.PointerEvent) {
    const p = toPageXY(e);
    drawingRef.current = { kind: tool, start: p, current: p, points: [[p.x, p.y]] };
    overlayCanvasRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drawingRef.current) return;
    const p = toPageXY(e);
    drawingRef.current.current = p;
    if (drawingRef.current.kind === "freehand" || drawingRef.current.kind === "polyline") {
      drawingRef.current.points.push([p.x, p.y]);
    }
    paintOverlay();
  }

  async function onPointerUp(e: React.PointerEvent) {
    const live = drawingRef.current;
    if (!live) return;
    overlayCanvasRef.current?.releasePointerCapture(e.pointerId);
    drawingRef.current = null;

    const body = {
      kind: live.kind,
      geometry: kindGeometry(live),
      color,
      stroke_width: stroke,
      text_content: live.kind === "text" || live.kind === "callout" ? text : undefined,
      text_size: live.kind === "text" || live.kind === "callout" ? 12 : undefined,
    };
    const res = await fetch(`/api/v1/drawings/${siteplanId}/markups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) await refetchMarkups();
  }

  return (
    <div className="space-y-3">
      <div className="surface flex flex-wrap items-center gap-2 p-2 text-xs">
        <label className="flex items-center gap-1">
          {t("console.sitePlans.markup.tool", undefined, "Tool")}
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value as MarkupKind)}
            className="rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1 text-xs"
          >
            {[
              "rectangle",
              "ellipse",
              "cloud",
              "polyline",
              "polygon",
              "freehand",
              "text",
              "callout",
              "dimension",
              "highlight",
              "measure_count",
            ].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1">
          {t("console.sitePlans.markup.color", undefined, "Color")}
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-6 w-8 rounded" />
        </label>
        <label className="flex items-center gap-1">
          {t("console.sitePlans.markup.stroke", undefined, "Stroke")}
          <input
            type="range"
            min="1"
            max="10"
            value={stroke}
            onChange={(e) => setStroke(Number(e.target.value))}
            className="w-16"
          />
          <span className="font-mono">{stroke}</span>
        </label>
        {(tool === "text" || tool === "callout") && (
          <label className="flex items-center gap-1">
            {t("console.sitePlans.markup.text", undefined, "Text")}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded border border-[var(--p-border)] bg-[var(--p-bg)] px-2 py-1 text-xs"
            />
          </label>
        )}
        <span className="ms-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-[var(--p-border)] px-2 py-1 disabled:opacity-50"
            aria-label={t("console.sitePlans.markup.previousPage", undefined, "Previous page")}
          >
            ‹
          </button>
          <span className="font-mono">
            {page} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page >= pageCount}
            className="rounded border border-[var(--p-border)] px-2 py-1 disabled:opacity-50"
            aria-label={t("console.sitePlans.markup.nextPage", undefined, "Next page")}
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            className="rounded border border-[var(--p-border)] px-2 py-1"
            aria-label={t("console.sitePlans.markup.zoomOut", undefined, "Zoom out")}
          >
            −
          </button>
          <span className="font-mono">{(scale * 100).toFixed(0)}%</span>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(4, s + 0.25))}
            className="rounded border border-[var(--p-border)] px-2 py-1"
            aria-label={t("console.sitePlans.markup.zoomIn", undefined, "Zoom in")}
          >
            +
          </button>
        </span>
      </div>
      {error && (
        <div className="surface p-3 text-xs text-[var(--p-danger)]">
          {t("console.sitePlans.markup.renderError", { error }, "PDF render error: {error}")}
        </div>
      )}
      <div className="text-[10px] text-[var(--p-text-2)]">
        {t(
          "console.sitePlans.markup.summary",
          {
            layerCount: layers.length,
            layerWord: layers.length === 1 ? "layer" : "layers",
            markupCount: markups.filter((m) => (m.geometry?.page ?? 1) === page).length,
            markupWord: markups.filter((m) => (m.geometry?.page ?? 1) === page).length === 1 ? "markup" : "markups",
          },
          "{layerCount} {layerWord} · {markupCount} {markupWord} on this page",
        )}
      </div>
      <div ref={wrapperRef} className="surface relative inline-block overflow-auto" style={{ maxHeight: "75vh" }}>
        <canvas ref={baseCanvasRef} className="block" />
        <canvas
          ref={overlayCanvasRef}
          className="absolute start-0 top-0 cursor-crosshair"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>
    </div>
  );
}
