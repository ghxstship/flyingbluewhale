"use client";

import { useEffect, useRef, useState } from "react";

type Mode = "typed" | "canvas";

/**
 * Reusable signature capture: typed text OR freehand canvas.
 *
 * Renders a hidden input named `${name}_kind` with `"typed"|"canvas"` and a
 * hidden input named `name` with either the typed string or the canvas image
 * data URL. Server actions parse both: store kind on the row, store the
 * payload (text or `data:image/png;base64,...`) wherever your schema permits
 * (e.g. JSONB metadata, dedicated `signature_data` column, or storage path
 * after a separate upload).
 *
 * Caller is responsible for the surrounding `<form>` and submit button.
 */
export function SignatureField({
  name,
  label = "Signature",
  required = false,
}: {
  name: string;
  label?: string;
  required?: boolean;
}) {
  const [mode, setMode] = useState<Mode>("typed");
  const [typed, setTyped] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  const [canvasData, setCanvasData] = useState<string>("");

  useEffect(() => {
    if (mode !== "canvas") return;
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = Math.floor(rect.width * ratio);
    c.height = Math.floor(rect.height * ratio);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const stroke =
      typeof window !== "undefined"
        ? getComputedStyle(document.documentElement).getPropertyValue("--p-text-1").trim()
        : "";
    ctx.strokeStyle = stroke || "rgb(17,17,17)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
  }, [mode]);

  const point = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = ev.currentTarget.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  };

  const onDown = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const ctx = ev.currentTarget.getContext("2d")!;
    const p = point(ev);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawingRef.current = true;
  };
  const onMove = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = ev.currentTarget.getContext("2d")!;
    const p = point(ev);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  };
  const onUp = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    if (hasInk) setCanvasData(ev.currentTarget.toDataURL("image/png"));
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
    setCanvasData("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {label}
          {required && <span className="ms-1 text-[var(--p-danger)]">*</span>}
        </label>
        <div className="inline-flex rounded-full border border-[var(--p-border)] bg-[var(--p-surface)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("typed")}
            className={`rounded-full px-3 py-1 ${mode === "typed" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
          >
            Type
          </button>
          <button
            type="button"
            onClick={() => setMode("canvas")}
            className={`rounded-full px-3 py-1 ${mode === "canvas" ? "bg-[var(--p-bg)]" : "text-[var(--p-text-2)]"}`}
          >
            Draw
          </button>
        </div>
      </div>

      <input type="hidden" name={`${name}_kind`} value={mode} />

      {mode === "typed" ? (
        <>
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your full name"
            className="ps-input w-full"
            required={required}
          />
          <input type="hidden" name={name} value={typed} />
        </>
      ) : (
        <>
          <div className="surface-inset h-32 overflow-hidden rounded-md">
            <canvas
              ref={canvasRef}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              className="block h-full w-full touch-none"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <button type="button" onClick={clear} className="text-[var(--p-text-2)] hover:text-[var(--p-text-1)]">
              Clear
            </button>
            {hasInk ? (
              <span className="text-[var(--p-success)]">Captured</span>
            ) : (
              <span className="text-[var(--p-text-2)]">Sign above</span>
            )}
          </div>
          <input type="hidden" name={name} value={canvasData} required={required} />
        </>
      )}
    </div>
  );
}
