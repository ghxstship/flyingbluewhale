"use client";

import { useEffect, useRef, useState } from "react";

export function PhotoCapture({
  onCapture,
  onRetake,
  required = false,
}: {
  onCapture: (dataUrl: string | null) => void;
  onRetake?: () => void;
  required?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const [captured, setCaptured] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setUnavailable(true);
        onCaptureRef.current(null);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setUnavailable(true);
          onCaptureRef.current(null);
        }
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCaptured(dataUrl);
    onCaptureRef.current(dataUrl);
  }

  function retake() {
    setCaptured(null);
    onRetake?.();

    async function restartCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setUnavailable(true);
        onCaptureRef.current(null);
      }
    }
    void restartCamera();
  }

  if (unavailable) {
    return (
      <p className="text-xs text-[var(--text-muted)] text-center py-2">
        Camera unavailable — clock-in will proceed without photo
      </p>
    );
  }

  if (captured) {
    return (
      <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={captured} alt="Clock-in photo" className="rounded w-full object-cover" />
        <button type="button" className="btn btn-secondary w-full" onClick={retake}>
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 max-w-sm mx-auto">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="rounded w-full object-cover bg-[var(--surface-inset)]"
      />
      <canvas ref={canvasRef} className="hidden" />
      <button type="button" className="btn btn-primary w-full" onClick={takePhoto}>
        Take Photo
      </button>
      {!required && (
        <button
          type="button"
          className="text-xs text-[var(--text-muted)] underline"
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
            setUnavailable(true);
            onCaptureRef.current(null);
          }}
        >
          Skip photo
        </button>
      )}
    </div>
  );
}
