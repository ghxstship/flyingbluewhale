import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/env";
import { getRequestT } from "@/lib/i18n/request";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

/**
 * /p/[slug]/flyer — printable event flyer with QR code.
 * Eventbrite April 2026 "Shareable Flyers" parity.
 *
 * Adds ?print=1 for a bare-body print view (no chrome).
 * The QR code links directly back to /p/[slug] (the portal home).
 */
export default async function FlyerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { slug } = await params;
  const { print } = await searchParams;
  const { t } = await getRequestT();
  if (!hasSupabase) notFound();

  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("name, slug, description, starts_at, ends_at, branding")
    .eq("slug", slug)
    .maybeSingle();
  if (!project) notFound();

  const p = project as {
    name: string | null;
    slug: string;
    description: string | null;
    starts_at: string | null;
    ends_at: string | null;
    branding: Record<string, unknown> | null;
  };

  // Build the canonical portal URL — no hardcoded domains per CLAUDE.md convention.
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://atlvs.pro";
  const portalUrl = `${baseUrl}/p/${slug}`;

  // Generate the QR code as a compact inline PNG data URL.
  const qrDataUrl = await QRCode.toDataURL(portalUrl, {
    width: 280,
    margin: 1,
    color: { dark: "#111318", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });

  const isPrint = print === "1";

  // Date range display.
  const dateStr =
    p.starts_at
      ? new Intl.DateTimeFormat("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(p.starts_at))
      : null;

  const accent = (p.branding as { accentColor?: string } | null)?.accentColor ?? "#E23414";

  return (
    <>
      <style>{`
        @media print {
          .flyer-chrome { display: none !important; }
          .flyer-root { box-shadow: none !important; }
        }
        body { background: var(--p-page, #F7F8FA); }
      `}</style>

      {!isPrint && (
        <div
          className="flyer-chrome"
          style={{
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid var(--p-border)",
          }}
        >
          <span style={{ flex: 1, fontSize: 13, color: "var(--p-text-2)" }}>
            {t("p.flyer.chrome.hint", undefined, "Share or print this flyer. The QR code links directly to your portal.")}
          </span>
          <button
            type="button"
            className="ps-btn"
            onClick={() => window.print()}
            style={{ fontSize: 13 }}
            suppressHydrationWarning
          >
            {t("p.flyer.chrome.print", undefined, "Print")}
          </button>
          <a
            href={`/p/${slug}/flyer?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="ps-btn ps-btn--ghost"
            style={{ fontSize: 13 }}
          >
            {t("p.flyer.chrome.bare", undefined, "Bare view")}
          </a>
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          minHeight: isPrint ? "100vh" : "calc(100vh - 64px)",
          padding: isPrint ? 0 : 32,
        }}
      >
        {/* Flyer card */}
        <div
          className="flyer-root"
          style={{
            width: "100%",
            maxWidth: 540,
            background: "#fff",
            borderRadius: isPrint ? 0 : 16,
            boxShadow: isPrint ? "none" : "0 8px 32px rgba(0,0,0,0.12)",
            overflow: "hidden",
            fontFamily: "Hanken Grotesk, sans-serif",
          }}
        >
          {/* Hero bar */}
          <div
            style={{
              background: accent,
              padding: "40px 40px 32px",
              color: "#fff",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: "Space Mono, monospace",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                opacity: 0.8,
                marginBottom: 10,
              }}
            >
              {t("p.flyer.eyebrow", undefined, "A T L V S  P R O D U C T I O N S")}
            </div>
            <h1
              style={{
                fontFamily: "Anton, sans-serif",
                fontSize: "clamp(28px, 6vw, 48px)",
                fontWeight: 400,
                textTransform: "uppercase",
                lineHeight: 1.05,
                margin: 0,
                letterSpacing: "0.01em",
              }}
            >
              {p.name ?? slug}
            </h1>
            {dateStr && (
              <div style={{ marginTop: 12, fontSize: 15, opacity: 0.9 }}>{dateStr}</div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "32px 40px", display: "flex", gap: 32, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              {p.description && (
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333", marginBottom: 20 }}>
                  {p.description}
                </p>
              )}
              <div
                style={{
                  fontSize: 12,
                  color: "#666",
                  fontFamily: "Space Mono, monospace",
                  marginBottom: 8,
                }}
              >
                {t("p.flyer.scan", undefined, "Scan to register & view your portal")}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#999",
                  fontFamily: "Space Mono, monospace",
                  wordBreak: "break-all",
                }}
              >
                {portalUrl}
              </div>
            </div>

            {/* QR code */}
            <div style={{ flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={t("p.flyer.qrAlt", { url: portalUrl }, `QR code for ${portalUrl}`)}
                width={120}
                height={120}
                style={{ borderRadius: 8, border: "1px solid #eee" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "1px solid #eee",
              padding: "16px 40px",
              fontSize: 11,
              color: "#aaa",
              fontFamily: "Space Mono, monospace",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>atlvs.pro</span>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {t("p.flyer.footer", undefined, "A T L V S  Technologies")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
