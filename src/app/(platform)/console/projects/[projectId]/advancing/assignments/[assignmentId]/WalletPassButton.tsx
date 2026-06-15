"use client";

// Wallet pass export — Tixr / Bizzabo Klik competitive feature (2025-2026).
// Fetches pass JSON from /api/v1/assignments/[id]/wallet-pass and surfaces
// Apple Wallet + Google Wallet download options.

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type PassData = {
  assignmentId: string;
  catalogKind: string;
  holderName: string;
  projectName: string;
  apple: { passJson: unknown; signingAvailable: boolean };
  google: { ticketObject: unknown; signingAvailable: boolean; saveUrl: string | null };
};

export function WalletPassButton({ assignmentId }: { assignmentId: string }) {
  const [pending, start] = useTransition();
  const [pass, setPass] = useState<PassData | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fetchPass() {
    start(async () => {
      setError(null);
      try {
        const res = await fetch(`/api/v1/assignments/${assignmentId}/wallet-pass`);
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error?.message ?? "Failed to generate pass");
          return;
        }
        setPass(json.data);
        setOpen(true);
      } catch {
        setError("Network error — try again");
      }
    });
  }

  function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative inline-flex flex-col items-start gap-1">
      <Button variant="secondary" size="sm" disabled={pending} onClick={fetchPass}>
        {pending ? "Generating…" : "Add to Wallet"}
      </Button>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {open && pass && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-[var(--p-border)] bg-[var(--p-surface)] p-4 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold">{pass.projectName}</p>
              <p className="text-xs text-[var(--p-text-2)] capitalize">{pass.catalogKind} · {pass.holderName}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--p-text-2)] hover:text-[var(--p-text)] text-sm"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {pass.google.saveUrl ? (
              <a
                href={pass.google.saveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--p-border)] bg-white px-3 py-2.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                <GoogleWalletIcon />
                Save to Google Wallet
              </a>
            ) : (
              <button
                type="button"
                onClick={() => downloadJson(pass.google.ticketObject, `atlvs-pass-${assignmentId.slice(0, 8)}.json`)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--p-border)] bg-white px-3 py-2.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                <GoogleWalletIcon />
                Download Google Wallet pass
              </button>
            )}

            <button
              type="button"
              onClick={() => downloadJson(pass.apple.passJson, `atlvs-pass-${assignmentId.slice(0, 8)}.pkpass.json`)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-black bg-black px-3 py-2.5 text-xs font-medium text-white hover:bg-gray-900"
            >
              <AppleWalletIcon />
              {pass.apple.signingAvailable ? "Add to Apple Wallet" : "Download Apple Wallet pass"}
            </button>
          </div>

          {(!pass.apple.signingAvailable || !pass.google.signingAvailable) && (
            <p className="mt-3 text-[10px] text-[var(--p-text-2)]">
              Configure <code>APPLE_PASS_CERT_BASE64</code> / <code>GOOGLE_WALLET_ISSUER_ID</code> in env to enable
              one-tap wallet addition.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function GoogleWalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#4285F4" />
      <path d="M12 6a6 6 0 100 12A6 6 0 0012 6zm0 10a4 4 0 110-8 4 4 0 010 8z" fill="white" />
    </svg>
  );
}

function AppleWalletIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
        fill="white"
      />
    </svg>
  );
}
