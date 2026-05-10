"use client";
/* eslint-disable no-restricted-syntax, @next/next/no-html-link-for-pages */
/**
 * Global error boundary — catches errors that escape every other error.tsx
 * (e.g. errors thrown inside the root layout itself, before any shell-level
 * boundary mounts). Per the Next.js App Router contract, this file must be a
 * Client Component and render its own <html>/<body> because it replaces the
 * root layout entirely when it kicks in.
 *
 * Without this file, a root-layout exception renders a blank white page in
 * production. Sentry still gets the report via instrumentation, but the user
 * sees nothing actionable.
 */

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#f5f2ec",
          color: "#0a0a0a",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          margin: 0,
        }}
      >
        <main style={{ maxWidth: 480, textAlign: "center" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#8a8a8a",
              marginBottom: 12,
            }}
          >
            Something Broke at the Root
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 12px", lineHeight: 1.1 }}>We hit a wall.</h1>
          <p style={{ fontSize: 14, color: "#4a4a4a", margin: "0 0 20px" }}>
            The application failed to load. Our error reporter has been notified.
            {error.digest ? (
              <>
                {" "}
                Reference: <code style={{ fontFamily: "ui-monospace, monospace" }}>{error.digest}</code>
              </>
            ) : null}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                background: "#0a0a0a",
                color: "#f5f2ec",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/"
              style={{
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 500,
                background: "transparent",
                color: "#0a0a0a",
                border: "1px solid #0a0a0a",
                borderRadius: 4,
                textDecoration: "none",
              }}
            >
              Home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
