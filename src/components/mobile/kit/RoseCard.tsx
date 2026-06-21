"use client";

import { useEffect, useState } from "react";
import { KIcon } from "./icon";

/**
 * Deterministic QR-style matrix + rotating credential + the COMPVSS "Rose"
 * member card. Ported from the prototype `hashStr` / `QR` / `RotatingQR` /
 * `RoseCard`.
 *
 * `RotatingQR` mints a fresh single-use token on mount and every TTL seconds.
 * It defaults to a client-side `Math.random()` token (fine — this is a
 * "use client" component that only runs in the browser), but accepts a
 * `mintToken` async hook so a server action can back it later.
 */

/** FNV-1a string hash → unsigned 32-bit seed. */
export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type QRProps = {
  value: string;
  size?: number;
  fg?: string;
  bg?: string;
};

/** Deterministic matrix cells for a QR-style code. Pure — no render state. */
function qrCells(value: string, n: number): Array<[number, number]> {
  let seed = hashStr(value || "x");
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const finders: Array<[number, number]> = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  const inFinder = (x: number, y: number) =>
    finders.some(([ox, oy]) => x >= ox - 1 && x < ox + 8 && y >= oy - 1 && y < oy + 8);
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (inFinder(x, y)) continue;
      if (rnd() > 0.52) cells.push([x, y]);
    }
  return cells;
}

export function QR({ value, size = 184, fg = "#0c0e12", bg = "#fff" }: QRProps) {
  const n = 25;
  const finders: Array<[number, number]> = [
    [0, 0],
    [n - 7, 0],
    [0, n - 7],
  ];
  const cells = qrCells(value, n);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} shapeRendering="crispEdges" style={{ display: "block" }}>
      {cells.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fg} />
      ))}
      {finders.map(([fx, fy], i) => (
        <g key={"f" + i}>
          <rect x={fx} y={fy} width={7} height={7} fill={fg} />
          <rect x={fx + 1} y={fy + 1} width={5} height={5} fill={bg} />
          <rect x={fx + 2} y={fy + 2} width={3} height={3} fill={fg} />
        </g>
      ))}
    </svg>
  );
}

function randomToken(): string {
  return (
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  );
}

export type RotatingQRProps = {
  base: string;
  size?: number;
  ttl?: number;
  /** Optional async token source; when provided it's awaited instead of Math.random. */
  mintToken?: () => Promise<string>;
};

export function RotatingQR({ base, size = 176, ttl = 30, mintToken }: RotatingQRProps) {
  const [token, setToken] = useState<string>(randomToken);
  const [left, setLeft] = useState(ttl);

  const refresh = () => {
    if (mintToken) {
      void mintToken().then(setToken);
    } else {
      setToken(randomToken());
    }
  };

  useEffect(() => {
    const tick = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          refresh();
          return ttl;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ttl, mintToken]);

  const regen = () => {
    refresh();
    setLeft(ttl);
  };
  const pct = (left / ttl) * 100;
  return (
    <>
      <div className="qrbox" onClick={regen} style={{ cursor: "pointer", position: "relative" }}>
        <QR value={`${base}:${token}`} size={size} />
      </div>
      <div className="pass-id">
        {base.split(":").pop()}-{token}
      </div>
      <div className="qr-ttl">
        <div className="qr-ttl-bar">
          <span style={{ width: pct + "%" }} />
        </div>
        <span className="qr-ttl-l">
          <KIcon name="ShieldCheck" size={11} /> Single-use · refreshes in {left}s
        </span>
      </div>
    </>
  );
}

export type RoseCardProps = {
  compact?: boolean;
  onClick?: () => void;
};

/** COMPVSS Rose wordmark lockup. */
function Lock({ wm }: { wm: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      <div className="atlvs-wordmark" style={{ fontSize: wm, color: "rgba(255,255,255,.85)", paddingTop: 2 }}>
        COMPVSS
      </div>
      <span
        style={{
          fontFamily: "'Pinyon Script', cursive",
          fontSize: wm * 3.15,
          lineHeight: 1,
          marginLeft: -wm * 1.7,
          marginTop: -3,
          background: "linear-gradient(135deg,#f4cdbf,#d9a08e 45%,#b76e79)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Rose
      </span>
    </div>
  );
}

export function RoseCard({ compact, onClick }: RoseCardProps) {
  const [flip, setFlip] = useState(false);
  const skin: React.CSSProperties = {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    color: "#fff",
    background: "linear-gradient(140deg,#2a1a09 0%,#36230d 38%,#120d08 100%)",
    border: "1px solid rgba(255,255,255,.1)",
    boxShadow: "var(--p-elev-2, var(--p-elev-1))",
  };
  const sheen = (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(130% 90% at 100% 0%, color-mix(in oklab, var(--p-accent) 55%, transparent), transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(115deg, transparent 38%, rgba(255,255,255,.07) 50%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </>
  );
  if (compact)
    return (
      <div
        className="tap"
        onClick={onClick}
        style={{ ...skin, padding: "15px 17px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
      >
        {sheen}
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Lock wm={12} />
          <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 20, lineHeight: 1, marginTop: 7 }}>
            Rio Tovar
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,.6)", marginTop: 5 }}>
            ID 0042 · RT4471
          </div>
        </div>
        <span
          style={{
            position: "relative",
            width: 46,
            height: 46,
            borderRadius: 11,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            padding: 5,
            boxSizing: "border-box",
          }}
        >
          <QR value="COMPVSS:RT4471" size={36} />
        </span>
      </div>
    );
  return (
    <div
      style={{
        ...skin,
        aspectRatio: "1.586 / 1",
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        marginBottom: 14,
      }}
    >
      {sheen}
      <button
        type="button"
        onClick={() => setFlip((f) => !f)}
        aria-label="Flip card"
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 3,
          width: 30,
          height: 30,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,.22)",
          background: "rgba(255,255,255,.1)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <KIcon name={flip ? "User" : "QrCode"} size={15} />
      </button>
      {flip && (
        <div
          className="cardback"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            background: "linear-gradient(140deg,#2a1a09 0%,#36230d 38%,#120d08 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              width: "72%",
              height: 30,
              marginTop: 6,
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,.5) 0 2px, transparent 2px 5px)",
              borderRadius: 2,
              opacity: 0.45,
            }}
          />
          <span
            style={{
              width: 116,
              height: 116,
              borderRadius: 14,
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 8,
              boxSizing: "border-box",
            }}
          >
            <QR value="COMPVSS:RT4471" size={100} />
          </span>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,.7)" }}>
            0042 · RT4471
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
            Scan to verify · single-use
          </div>
        </div>
      )}
      <div style={{ position: "relative" }}>
        <Lock wm={13} />
      </div>
      <div style={{ position: "relative", display: "flex", gap: 14, alignItems: "flex-end" }}>
        <span
          style={{
            width: 56,
            height: 70,
            borderRadius: 8,
            background: "linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.04))",
            border: "1px solid rgba(244,205,191,.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(244,205,191,.55)",
            flex: "none",
          }}
        >
          <KIcon name="User" size={28} />
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 7.5, letterSpacing: "0.22em", color: "rgba(244,205,191,.6)" }}>
            MEMBER
          </div>
          <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 24, lineHeight: 1, marginTop: 3 }}>
            Rio Tovar
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p-accent)" }} />
            <span
              style={{
                fontFamily: "var(--p-mono)",
                fontSize: 9.5,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.82)",
              }}
            >
              Active
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderTop: "1px solid rgba(255,255,255,.1)",
          paddingTop: 11,
        }}
      >
        <div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 8, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>
            CREDENTIAL ID
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 15, letterSpacing: "0.2em", marginTop: 3 }}>0042 · RT4471</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 8, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>
            MEMBER SINCE
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 12, marginTop: 3 }}>06 / 26</div>
        </div>
      </div>
    </div>
  );
}
