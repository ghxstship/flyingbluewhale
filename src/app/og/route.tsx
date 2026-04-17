import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "flyingbluewhale";
  const eyebrow = searchParams.get("eyebrow") ?? "Production OS";
  const platform = (searchParams.get("platform") ?? "") as "atlvs" | "gvteway" | "compvss" | "";
  const accent =
    platform === "atlvs" ? "#DC2626" :
    platform === "gvteway" ? "#2563EB" :
    platform === "compvss" ? "#D97706" :
    "#111111";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: "#0a0a0a",
          padding: "80px",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: accent,
          }}
        />
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: accent }}>
          {eyebrow}
        </div>
        <div
          style={{
            fontSize: 84,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            marginTop: 36,
            maxWidth: "1000px",
          }}
        >
          {title}
        </div>
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.01em" }}>flyingbluewhale</div>
          <div style={{ fontSize: 16, color: "#555", fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
            flyingbluewhale.app
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
