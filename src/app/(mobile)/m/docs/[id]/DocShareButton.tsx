"use client";

import { useState } from "react";
import { KIcon, Sheet } from "@/components/mobile/kit";
import { shareDoc } from "../actions";

/**
 * COMPVSS · Document Share (kit 32 A7).
 *
 * Opens a share drawer that STATES the access scope up front — the link is a
 * deep link, not an anon/public one, so it only widens reach inside the RBAC
 * scope that already governs the doc. Both actions (native share / copy link)
 * run the `shareDoc` server action, which re-checks the caller can read the
 * doc and writes an `audit_log` row noting the scope on share. Kit primitive
 * rule: callers pass already-translated labels.
 */
export function DocShareButton({
  sopId,
  labels,
}: {
  sopId: string;
  labels: {
    share: string;
    title: string;
    scopeWarning: string;
    shareAction: string;
    copyAction: string;
    copied: string;
    error: string;
    close: string;
  };
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Runs shareDoc (audit fires here — the moment of sharing) and returns the
  // resolved link, or null on failure.
  const resolve = async (): Promise<string | null> => {
    setErr(null);
    const res = await shareDoc(sopId);
    if ("error" in res) {
      setErr(labels.error);
      return null;
    }
    return res.url;
  };

  const onNativeShare = async () => {
    setBusy(true);
    try {
      const url = await resolve();
      if (!url) return;
      const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
      if (typeof nav.share === "function") {
        try {
          await nav.share({ title: labels.title, url });
        } catch {
          // User dismissed the native sheet — not an error; the audit already
          // recorded the share intent.
        }
      } else {
        await copyToClipboard(url);
      }
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    setBusy(true);
    try {
      const url = await resolve();
      if (url) await copyToClipboard(url);
    } finally {
      setBusy(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setErr(labels.error);
    }
  };

  return (
    <>
      <button type="button" className="iconbtn" aria-label={labels.share} onClick={() => setOpen(true)}>
        <KIcon name="Share2" size={18} />
      </button>
      {open && (
        <Sheet icon="Share2" title={labels.title} closeLabel={labels.close} onClose={() => setOpen(false)}>
          <div
            className="ps-alert ps-alert--info"
            role="note"
            style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: "4px 0 12px" }}
          >
            <KIcon name="ShieldCheck" size={16} style={{ flex: "none", marginTop: 1 }} />
            <span>{labels.scopeWarning}</span>
          </div>
          <button
            type="button"
            className="item tap"
            disabled={busy}
            style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
            onClick={onNativeShare}
          >
            <KIcon name="Share2" size={18} style={{ color: "var(--p-text-2)", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{labels.shareAction}</div>
            </div>
          </button>
          <button
            type="button"
            className="item tap"
            disabled={busy}
            style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
            onClick={onCopy}
          >
            <KIcon
              name={copied ? "Check" : "Link"}
              size={18}
              style={{ color: copied ? "var(--p-success)" : "var(--p-text-2)", flex: "none" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="t">{copied ? labels.copied : labels.copyAction}</div>
            </div>
          </button>
          {err && (
            <div className="s" style={{ color: "var(--p-danger)", marginTop: 8 }}>
              {err}
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}
