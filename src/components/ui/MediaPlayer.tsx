"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * MediaPlayer — titled chrome around a native <video> / <audio> element with
 * controls. Optionally persists & restores playback position via localStorage
 * (resumeKey), and reports progress / completion. Ported from the ATLVS kit
 * (kits/core/components/media/MediaPlayer.d.ts).
 */
export function MediaPlayer({
  src,
  kind = "video",
  poster,
  title,
  eyebrow,
  resumeKey,
  onEnded,
  onProgress,
  className = "",
  style,
}: {
  src: string;
  kind?: "video" | "audio";
  poster?: string;
  title?: ReactNode;
  eyebrow?: ReactNode;
  /** localStorage key to persist/restore currentTime. */
  resumeKey?: string;
  onEnded?: () => void;
  onProgress?: (fraction: number, seconds: number) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement & HTMLAudioElement>(null);

  // Restore saved position once metadata is known.
  useEffect(() => {
    if (!resumeKey) return;
    const el = ref.current;
    if (!el) return;
    const restore = () => {
      const saved = Number(localStorage.getItem(`media-resume:${resumeKey}`));
      if (Number.isFinite(saved) && saved > 0 && saved < el.duration) el.currentTime = saved;
    };
    el.addEventListener("loadedmetadata", restore);
    return () => el.removeEventListener("loadedmetadata", restore);
  }, [resumeKey]);

  const handleTimeUpdate = () => {
    const el = ref.current;
    if (!el) return;
    const fraction = el.duration ? el.currentTime / el.duration : 0;
    if (resumeKey) localStorage.setItem(`media-resume:${resumeKey}`, String(el.currentTime));
    onProgress?.(fraction, el.currentTime);
  };

  const handleEnded = () => {
    if (resumeKey) localStorage.removeItem(`media-resume:${resumeKey}`);
    onEnded?.();
  };

  const Media = kind === "audio" ? "audio" : "video";

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
      {(title || eyebrow) && (
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--p-border)", background: "var(--p-surface-2)" }}>
          {eyebrow && (
            <div
              style={{
                fontFamily: "var(--p-mono)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--p-text-3)",
                marginBottom: 2,
              }}
            >
              {eyebrow}
            </div>
          )}
          {title && <div style={{ color: "var(--p-text-1)", fontWeight: 700, fontSize: 15 }}>{title}</div>}
        </div>
      )}
      <Media
        ref={ref}
        src={src}
        controls
        poster={kind === "video" ? poster : undefined}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        style={{
          display: "block",
          width: "100%",
          background: kind === "video" ? "var(--p-bg)" : "transparent",
          ...(kind === "audio" ? { padding: 12 } : {}),
        }}
      />
    </div>
  );
}
