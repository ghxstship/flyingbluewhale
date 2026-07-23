"use client";

import { useState, useTransition } from "react";
import { KIcon } from "@/components/mobile/kit";
import { saveQuietHours } from "./actions";

/**
 * Quiet-hours editor (T1-2 push discipline). Enable toggle (same
 * `.nm-cell` checkbox affordance as the matrix above it) + two NATIVE
 * time inputs per canon (`.fld` mobile-kit fields), one explicit Save.
 * The IANA timezone is captured from the browser at save time — the
 * stored window is wall-clock in the user's zone, so it survives
 * travel days.
 */
export function QuietHoursCard({
  initial,
  labels,
}: {
  initial: { enabled: boolean; start: string; end: string };
  labels: {
    enable: string;
    from: string;
    to: string;
    save: string;
    saved: string;
    error: string;
  };
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  const [flash, setFlash] = useState<"saved" | "error" | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setFlash(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("enabled", enabled ? "1" : "0");
      fd.set("start", start);
      fd.set("end", end);
      fd.set("tz", Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
      const res = await saveQuietHours(null, fd);
      setFlash(res?.error ? "error" : "saved");
    });
  };

  return (
    <div className="item" style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          className="nm-cell"
          data-on={enabled ? "1" : undefined}
          aria-pressed={enabled}
          aria-label={labels.enable}
          onClick={() => setEnabled((v) => !v)}
        >
          {enabled && <KIcon name="Check" size={13} stroke={3} />}
        </button>
        <span className="t" style={{ flex: 1, minWidth: 0 }}>
          {labels.enable}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginTop: 10, flexWrap: "wrap" }}>
        <div className="fld" style={{ flex: 1, minWidth: 120 }}>
          <label htmlFor="qh-start">{labels.from}</label>
          <input
            id="qh-start"
            type="time"
            value={start}
            disabled={!enabled}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div className="fld" style={{ flex: 1, minWidth: 120 }}>
          <label htmlFor="qh-end">{labels.to}</label>
          <input
            id="qh-end"
            type="time"
            value={end}
            disabled={!enabled}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <button type="button" className="ps-btn" onClick={save} disabled={pending}>
          {labels.save}
        </button>
      </div>
      {flash && (
        <div
          role="status"
          style={{
            marginTop: 8,
            fontSize: 11,
            fontWeight: 600,
            color: flash === "saved" ? "var(--p-success-text)" : "var(--p-danger-text)",
          }}
        >
          {flash === "saved" ? labels.saved : labels.error}
        </div>
      )}
    </div>
  );
}
