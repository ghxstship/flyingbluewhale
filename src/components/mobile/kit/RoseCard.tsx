"use client";

import { useEffect, useState } from "react";
import { KIcon } from "./icon";

/**
 * Real QR renderer + the COMPVSS "Rose" member card.
 *
 * `QR` encodes its value as a genuine, scannable QR symbol (via the
 * `qrcode` encoder — modules rendered as SVG rects), replacing the old
 * decorative FNV-hash matrix that no scanner could read. `RoseCard`
 * renders the holder's REAL active `assignment_scan_codes` code (fetched
 * server-side by the caller, e.g. /m/pass) so the flip-to-QR back of the
 * card is verifiable at any gate scanner through the assignments domain.
 * When no code exists the card says so honestly instead of painting a
 * fake pass. The prototype's client-minted `Math.random()` "single-use
 * token" (`RotatingQR`) is retired — it advertised a rotation no server
 * could verify.
 */

/** FNV-1a string hash → unsigned 32-bit seed. (Kept for kit consumers that
 * derive stable colors/ids from strings — no longer used for QR fakes.) */
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

/** The `qrcode` BitMatrix shape we consume (size + per-cell getter). */
type QrMatrix = { size: number; get: (y: number, x: number) => boolean };

/** Scannable QR symbol as inline SVG. Encoding failures (empty value)
 * render nothing rather than a decorative fake.
 *
 * The `qrcode` encoder (~232K) is a DEFERRED dependency: it is dynamically
 * imported inside the effect, so the chunk loads only when a QR actually
 * renders (the Rose card's flip-to-reveal back, a briefing sign-in), never on
 * first paint of the surfaces that merely might show one. The matrix therefore
 * resolves asynchronously — one frame of nothing before it paints, same as the
 * prior empty-until-ready path. */
export function QR({ value, size = 184, fg = "#0c0e12", bg = "#fff" }: QRProps) {
  const [matrix, setMatrix] = useState<QrMatrix | null>(null);
  useEffect(() => {
    if (!value) {
      setMatrix(null);
      return;
    }
    let live = true;
    void import("qrcode")
      .then(({ create }) => {
        if (!live) return;
        try {
          setMatrix(create(value, { errorCorrectionLevel: "M" }).modules as unknown as QrMatrix);
        } catch {
          setMatrix(null);
        }
      })
      .catch(() => {
        if (live) setMatrix(null);
      });
    return () => {
      live = false;
    };
  }, [value]);

  if (!matrix) return null;
  const n = matrix.size;
  const cells: Array<[number, number]> = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix.get(y, x)) cells.push([x, y]);
    }
  }
  // Quiet zone on each side keeps renders scannable without a wrapper fill.
  const q = 3;
  return (
    <svg
      viewBox={`${-q} ${-q} ${n + 2 * q} ${n + 2 * q}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="QR code"
      style={{ display: "block" }}
    >
      <rect x={-q} y={-q} width={n + 2 * q} height={n + 2 * q} fill={bg} />
      {cells.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={1} height={1} fill={fg} />
      ))}
    </svg>
  );
}

export type RoseCardProps = {
  compact?: boolean;
  onClick?: () => void;
  /** Holder display name (real session identity — no demo placeholder). */
  holderName?: string | null;
  /** The holder's ACTIVE assignment scan code. This exact string is what a
   * gate scanner resolves through /api/v1/scan — the QR encodes it verbatim. */
  code?: string | null;
  /** Short credential label shown under the name (e.g. the code itself). */
  credentialLabel?: string | null;
  /** Member-since line, already formatted. */
  memberSince?: string | null;
  /** Copy for the no-code state, e.g. "No active gate code yet". */
  noCodeLabel?: string;
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
          fontFamily: "var(--font-pinyon), 'Pinyon Script', cursive",
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

export function RoseCard({
  compact,
  onClick,
  holderName,
  code,
  credentialLabel,
  memberSince,
  noCodeLabel = "No active gate code yet",
}: RoseCardProps) {
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
      <button
        type="button"
        className="tap"
        onClick={onClick}
        aria-label="Open pass"
        style={{ ...skin, width: "100%", textAlign: "left", font: "inherit", color: "inherit", border: "none", padding: "15px 17px", marginBottom: 14, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
      >
        {sheen}
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Lock wm={12} />
          {holderName ? (
            <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 20, lineHeight: 1, marginTop: 7 }}>
              {holderName}
            </div>
          ) : null}
          {credentialLabel ? (
            <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,.6)", marginTop: 5 }}>
              {credentialLabel}
            </div>
          ) : null}
        </div>
        <span
          style={{
            position: "relative",
            width: 46,
            height: 46,
            borderRadius: 11,
            background: code ? "#fff" : "rgba(255,255,255,.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
            padding: 5,
            boxSizing: "border-box",
          }}
        >
          {code ? <QR value={code} size={36} /> : <KIcon name="QrCode" size={20} />}
        </span>
      </button>
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
          {code ? (
            <>
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
                <QR value={code} size={100} />
              </span>
              <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,.7)" }}>
                {code}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", textAlign: "center" }}>
                Scan to verify
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", textAlign: "center", maxWidth: 200 }}>
              {noCodeLabel}
            </div>
          )}
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
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.22em", color: "rgba(244,205,191,.6)" }}>
            MEMBER
          </div>
          {holderName ? (
            <div style={{ fontFamily: "var(--p-heading)", textTransform: "uppercase", fontSize: 24, lineHeight: 1, marginTop: 3 }}>
              {holderName}
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 9 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p-accent)" }} />
            <span
              style={{
                fontFamily: "var(--p-mono)",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.82)",
              }}
            >
              {code ? "Active" : "Pending"}
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
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>
            CREDENTIAL ID
          </div>
          <div style={{ fontFamily: "var(--p-mono)", fontSize: 15, letterSpacing: "0.2em", marginTop: 3 }}>
            {credentialLabel ?? code ?? " "}
          </div>
        </div>
        {memberSince ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--p-mono)", fontSize: 11, letterSpacing: "0.16em", color: "rgba(255,255,255,.5)" }}>
              MEMBER SINCE
            </div>
            <div style={{ fontFamily: "var(--p-mono)", fontSize: 12, marginTop: 3 }}>{memberSince}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
