"use client";

import { useState, useTransition } from "react";
import { KIcon } from "@/components/mobile/kit";
import { toggleNotifPref } from "./actions";

export type MatrixState = Record<string, Record<string, boolean>>;

type Labels = {
  heading: string;
  push: string;
  email: string;
  text: string;
};

/**
 * The `.notif-matrix` toggle grid (kit settings, app.jsx 3336-3346). Optimistic:
 * flips the cell locally, persists via `toggleNotifPref` (one cell per call),
 * and reverts on error.
 */
export function NotifMatrix({
  categories,
  channels,
  initial,
  labels,
}: {
  categories: string[];
  channels: string[];
  initial: MatrixState;
  labels: Labels;
}) {
  const [state, setState] = useState<MatrixState>(initial);
  const [, startTransition] = useTransition();

  const channelLabel = (ch: string) =>
    ch === "push" ? labels.push : ch === "email" ? labels.email : labels.text;

  const flip = (cat: string, ch: string) => {
    const next = !state[cat]?.[ch];
    setState((s) => ({ ...s, [cat]: { ...(s[cat] ?? {}), [ch]: next } }));
    startTransition(async () => {
      const fd = new FormData();
      fd.set("category", cat);
      fd.set("channel", ch);
      fd.set("on", next ? "1" : "0");
      const res = await toggleNotifPref(null, fd);
      if (res?.error) {
        // Revert on failure.
        setState((s) => ({ ...s, [cat]: { ...(s[cat] ?? {}), [ch]: !next } }));
      }
    });
  };

  return (
    <>
      <div className="sech">
        <h2>{labels.heading}</h2>
      </div>
      <div className="notif-matrix">
        <div className="nm-head">
          <span style={{ flex: 1 }} />
          {channels.map((ch) => (
            <span key={ch}>{channelLabel(ch)}</span>
          ))}
        </div>
        {categories.map((cat) => (
          <div className="nm-row" key={cat}>
            <span className="nm-cat">{cat}</span>
            {channels.map((ch) => {
              const on = Boolean(state[cat]?.[ch]);
              return (
                <button
                  type="button"
                  key={ch}
                  className="nm-cell"
                  data-on={on ? "1" : undefined}
                  onClick={() => flip(cat, ch)}
                  aria-label={`${cat} ${channelLabel(ch)}`}
                  aria-pressed={on}
                >
                  {on && <KIcon name="Check" size={13} stroke={3} />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
