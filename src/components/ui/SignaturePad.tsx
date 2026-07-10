"use client";

import { useId, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

/**
 * SignaturePad — freehand signature capture on a <canvas> via pointer events,
 * with a Clear control. Fires onChange with a PNG data URL at the end of each
 * stroke. Ported from the ATLVS kit (kits/core/components/input/SignaturePad.d.ts).
 *
 * Distinct from src/components/SignatureField.tsx (a hidden-input form field) —
 * this is the raw drawing primitive.
 *
 * A11y PAIRING RULE (F-17): a freehand canvas is inherently pointer-only, so
 * this primitive must NEVER be the sole way to sign. Always mount it through
 * (or alongside) `SignatureField`'s TYPED mode, which provides the keyboard /
 * assistive-tech alternative — the pad here carries `role="img"` + a name and
 * announces that a typed path exists, but it cannot capture keyboard strokes.
 */
export function SignaturePad({
  height = 180,
  onChange,
  onClear,
  label,
  className = "",
  style,
}: {
  /** Canvas height, px. Width fills the container. */
  height?: number;
  onChange?: (dataUrl: string) => void;
  onClear?: () => void;
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  const hintId = useId();

  const ctx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // Size the backing store to the rendered box once, lazily.
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(rect.width) || canvas.height !== Math.round(rect.height)) {
      canvas.width = Math.round(rect.width);
      canvas.height = Math.round(rect.height);
    }
    const c = canvas.getContext("2d");
    if (c) {
      c.lineWidth = 2;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = getComputedStyle(canvas).getPropertyValue("color") || "currentColor";
    }
    return c;
  };

  const pos = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = ctx();
    if (!c) return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    c.beginPath();
    c.moveTo(x, y);
  };

  const move = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current?.getContext("2d");
    if (!c) return;
    const { x, y } = pos(e);
    c.lineTo(x, y);
    c.stroke();
    setDirty(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && onChange) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const c = canvas?.getContext("2d");
    if (canvas && c) c.clearRect(0, 0, canvas.width, canvas.height);
    setDirty(false);
    onClear?.();
  };

  return (
    <div className={className} style={style}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
          gap: 12,
        }}
      >
        {label ? (
          <span
            style={{
              fontFamily: "var(--p-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--p-text-3)",
            }}
          >
            {label}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={clear}
          disabled={!dirty}
          style={{
            border: "1px solid var(--p-border)",
            borderRadius: "var(--p-r-sm, 6px)",
            background: "var(--p-surface)",
            color: dirty ? "var(--p-text-2)" : "var(--p-text-3)",
            cursor: dirty ? "pointer" : "default",
            paddingInline: 10,
            height: 26,
            font: "inherit",
            fontSize: 12,
          }}
        >
          Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label ? `${label} signature drawing area` : "Signature drawing area"}
        aria-describedby={hintId}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
        style={{
          display: "block",
          width: "100%",
          height,
          touchAction: "none",
          border: "1px solid var(--p-border)",
          borderRadius: "var(--p-r, 8px)",
          background: "var(--p-surface)",
          color: "var(--p-text-1)",
          cursor: "crosshair",
        }}
      />
      <span id={hintId} className="sr-only">
        Freehand signature capture with a pointer. If you cannot draw, use the typed signature option provided by the
        form.
      </span>
    </div>
  );
}
