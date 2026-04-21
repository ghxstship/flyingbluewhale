"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Music,
  Mic,
  Speaker,
  Drum,
  Guitar,
  Radio,
  Lightbulb,
  Square,
  Trash2,
  Save,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * 2D stage plot editor. SVG-based drag-and-drop — every palette item
 * becomes a draggable element on the canvas. Elements are persisted as
 * plain objects in `stage_plots.elements` jsonb.
 *
 * Scope:
 *  - Tap a palette tool, then tap the canvas to place an element
 *  - Drag elements to reposition; grid-snap at 1 ft
 *  - Select + Delete (Backspace/Delete key) or trash button
 *  - Undo last action (in-memory history, 25 steps)
 *  - Save commits the array back via PATCH /api/v1/stage-plots/[id]
 *
 * Out of scope (future): rotation, text labels, multi-select,
 * line/truss segments, real-time collab. Good enough for 90% of
 * production advancing needs.
 */

type ElementKind =
  | "mic"
  | "monitor"
  | "amp"
  | "drum_kit"
  | "guitar"
  | "keys"
  | "speaker"
  | "di_box"
  | "light_truss"
  | "riser";

type StageElement = {
  id: string;
  kind: ElementKind;
  x: number; // feet from stage-left edge
  y: number; // feet from downstage edge
  w: number; // feet
  h: number; // feet
  label?: string;
};

const PALETTE: Array<{ kind: ElementKind; label: string; Icon: React.ComponentType<{ size?: number }>; w: number; h: number; color: string }> = [
  { kind: "mic", label: "Mic", Icon: Mic, w: 1, h: 1, color: "#64748b" },
  { kind: "monitor", label: "Monitor", Icon: Square, w: 3, h: 2, color: "#475569" },
  { kind: "amp", label: "Amp", Icon: Music, w: 3, h: 2, color: "#1e293b" },
  { kind: "drum_kit", label: "Drum kit", Icon: Drum, w: 6, h: 6, color: "#334155" },
  { kind: "guitar", label: "Guitar", Icon: Guitar, w: 2, h: 2, color: "#334155" },
  { kind: "keys", label: "Keys", Icon: Music, w: 4, h: 2, color: "#334155" },
  { kind: "speaker", label: "Speaker", Icon: Speaker, w: 3, h: 3, color: "#0f172a" },
  { kind: "di_box", label: "DI", Icon: Radio, w: 1, h: 1, color: "#64748b" },
  { kind: "light_truss", label: "Light truss", Icon: Lightbulb, w: 20, h: 1, color: "#ca8a04" },
  { kind: "riser", label: "Riser", Icon: Square, w: 8, h: 4, color: "#78350f" },
];

const COLOR_BY_KIND: Record<ElementKind, string> = Object.fromEntries(
  PALETTE.map((p) => [p.kind, p.color]),
) as Record<ElementKind, string>;

const SIZE_BY_KIND: Record<ElementKind, { w: number; h: number }> = Object.fromEntries(
  PALETTE.map((p) => [p.kind, { w: p.w, h: p.h }]),
) as Record<ElementKind, { w: number; h: number }>;

const SCALE = 8; // pixels per foot
const GRID_FT = 1;

export function StagePlotCanvas({
  plotId,
  initial,
}: {
  plotId: string;
  initial: {
    name: string;
    widthFt: number;
    depthFt: number;
    elements: StageElement[];
  };
}) {
  const [name, setName] = React.useState(initial.name);
  const [widthFt, setWidthFt] = React.useState(initial.widthFt || 32);
  const [depthFt, setDepthFt] = React.useState(initial.depthFt || 24);
  const [elements, setElements] = React.useState<StageElement[]>(initial.elements);
  const [selectedTool, setSelectedTool] = React.useState<ElementKind | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const historyRef = React.useRef<StageElement[][]>([]);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const dragRef = React.useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const pushHistory = React.useCallback((next: StageElement[]) => {
    historyRef.current.push(elements);
    if (historyRef.current.length > 25) historyRef.current.shift();
    setElements(next);
  }, [elements]);

  const undo = React.useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) setElements(prev);
  }, []);

  const clientToFeet = React.useCallback((e: React.MouseEvent): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / SCALE;
    const y = (e.clientY - rect.top) / SCALE;
    return { x: Math.round(x / GRID_FT) * GRID_FT, y: Math.round(y / GRID_FT) * GRID_FT };
  }, []);

  function onCanvasClick(e: React.MouseEvent) {
    if (!selectedTool) {
      setSelectedId(null);
      return;
    }
    const pt = clientToFeet(e);
    if (!pt) return;
    const size = SIZE_BY_KIND[selectedTool];
    const next: StageElement = {
      id: crypto.randomUUID(),
      kind: selectedTool,
      x: Math.max(0, Math.min(widthFt - size.w, pt.x - size.w / 2)),
      y: Math.max(0, Math.min(depthFt - size.h, pt.y - size.h / 2)),
      w: size.w,
      h: size.h,
    };
    pushHistory([...elements, next]);
    setSelectedId(next.id);
  }

  function onElementPointerDown(e: React.PointerEvent, el: StageElement) {
    e.stopPropagation();
    setSelectedId(el.id);
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
  }

  function onElementPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / SCALE;
    const dy = (e.clientY - d.startY) / SCALE;
    setElements((prev) =>
      prev.map((el) =>
        el.id === d.id
          ? {
              ...el,
              x: Math.max(0, Math.min(widthFt - el.w, Math.round((d.origX + dx) / GRID_FT) * GRID_FT)),
              y: Math.max(0, Math.min(depthFt - el.h, Math.round((d.origY + dy) / GRID_FT) * GRID_FT)),
            }
          : el,
      ),
    );
  }

  function onElementPointerUp() {
    if (dragRef.current) {
      // Commit final position into history as one entry
      historyRef.current.push(elements);
      if (historyRef.current.length > 25) historyRef.current.shift();
    }
    dragRef.current = null;
  }

  function deleteSelected() {
    if (!selectedId) return;
    pushHistory(elements.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  }

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.key === "Backspace" || e.key === "Delete") && selectedId) {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if (e.key === "Escape") {
        setSelectedTool(null);
        setSelectedId(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, elements]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/stage-plots/${plotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, widthFt, depthFt, elements }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast.success("Stage plot saved");
        historyRef.current = [];
      } else {
        toast.error(json?.error?.message ?? "Save failed");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const canvasW = widthFt * SCALE;
  const canvasH = depthFt * SCALE;

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Plot name"
          className="input-base w-48"
        />
        <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          Width
          <input
            type="number"
            value={widthFt}
            onChange={(e) => setWidthFt(Math.max(8, Math.min(200, Number(e.target.value))))}
            className="input-base w-16"
          />
          ft
        </label>
        <label className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          Depth
          <input
            type="number"
            value={depthFt}
            onChange={(e) => setDepthFt(Math.max(8, Math.min(200, Number(e.target.value))))}
            className="input-base w-16"
          />
          ft
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={undo}
            disabled={historyRef.current.length === 0}
            aria-label="Undo last change"
            className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs disabled:opacity-50"
          >
            <Undo2 size={12} /> Undo
          </button>
          <button
            type="button"
            onClick={deleteSelected}
            disabled={!selectedId}
            aria-label="Delete selected element"
            className="inline-flex items-center gap-1 rounded border border-[var(--border-color)] px-2 py-1 text-xs disabled:opacity-50"
          >
            <Trash2 size={12} /> Delete
          </button>
          <Button type="button" onClick={save} disabled={saving} size="sm">
            <Save size={12} /> {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Palette */}
        <div className="w-36 shrink-0 space-y-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Palette
          </div>
          {PALETTE.map((p) => (
            <button
              key={p.kind}
              type="button"
              onClick={() => setSelectedTool(selectedTool === p.kind ? null : p.kind)}
              aria-pressed={selectedTool === p.kind}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition ${
                selectedTool === p.kind
                  ? "bg-[var(--surface-inset)] text-[var(--text-primary)] ring-1 ring-[var(--org-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-inset)]"
              }`}
            >
              <p.Icon size={12} />
              <span>{p.label}</span>
            </button>
          ))}
          <p className="mt-2 text-[10px] leading-relaxed text-[var(--text-muted)]">
            Pick a tool, then click the stage to place. Drag to move. Delete to remove. ⌘Z undo.
          </p>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto rounded-md border border-[var(--border-color)] bg-[var(--surface-inset)] p-4">
          <svg
            ref={svgRef}
            width={canvasW}
            height={canvasH}
            role="img"
            aria-label="Stage plot canvas"
            onClick={onCanvasClick}
            onPointerMove={onElementPointerMove}
            onPointerUp={onElementPointerUp}
            className="block bg-white"
            style={{ cursor: selectedTool ? "crosshair" : "default" }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid" width={SCALE * GRID_FT * 4} height={SCALE * GRID_FT * 4} patternUnits="userSpaceOnUse">
                <path
                  d={`M ${SCALE * GRID_FT * 4} 0 L 0 0 0 ${SCALE * GRID_FT * 4}`}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width={canvasW} height={canvasH} fill="url(#grid)" />
            {/* Downstage edge label */}
            <line x1={0} y1={canvasH} x2={canvasW} y2={canvasH} stroke="#1e293b" strokeWidth={2} />
            <text x={canvasW / 2} y={canvasH - 4} fill="#1e293b" fontSize="10" textAnchor="middle">
              Downstage · audience
            </text>
            {/* Elements */}
            {elements.map((el) => {
              const isSelected = el.id === selectedId;
              return (
                <g
                  key={el.id}
                  onPointerDown={(e) => onElementPointerDown(e, el)}
                  style={{ cursor: "move" }}
                >
                  <rect
                    x={el.x * SCALE}
                    y={el.y * SCALE}
                    width={el.w * SCALE}
                    height={el.h * SCALE}
                    fill={COLOR_BY_KIND[el.kind]}
                    fillOpacity={0.85}
                    stroke={isSelected ? "#2563eb" : "#0f172a"}
                    strokeWidth={isSelected ? 2 : 1}
                    rx={2}
                  />
                  <text
                    x={el.x * SCALE + (el.w * SCALE) / 2}
                    y={el.y * SCALE + (el.h * SCALE) / 2 + 3}
                    fill="white"
                    fontSize="10"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {el.kind.replace("_", " ")}
                  </text>
                </g>
              );
            })}
          </svg>
          <div className="mt-2 text-[11px] text-[var(--text-muted)]">
            {widthFt}′ × {depthFt}′ stage · {elements.length}{" "}
            {elements.length === 1 ? "element" : "elements"}
          </div>
        </div>
      </div>
    </div>
  );
}
