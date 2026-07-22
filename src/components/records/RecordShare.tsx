"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Share2, Link2, QrCode, Mail, MessageSquare, Download, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/DropdownMenu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { useToast } from "@/lib/hooks/useToast";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * RecordShare — the canonical share affordance for a detail record
 * (kit 21 wave W3, dead-ends D2·D3·D4). One button, every real endpoint:
 *
 *   • Copy Link  → writes the record's absolute deep link to the clipboard.
 *   • Show QR    → a scannable QR of the deep link in a Dialog (share to a
 *                  phone; Esc peels back to the page via the W0 overlay stack).
 *   • Email / Text → hands off to `mailto:` / `sms:` drafts pre-filled with
 *                  the title + link.
 *   • Export CSV → serializes the passed record fields to a downloaded file.
 *   • Print      → opens the browser print dialog (record print view).
 *
 * `path` is the in-app route (e.g. `/studio/invoices/abc`); the absolute URL
 * is resolved against the current origin at click time (we're already on the
 * shell that owns the record, so the origin is correct). Every previously
 * simulated-success share path now does the real thing.
 */
export type RecordShareProps = {
  /** In-app route for the record, e.g. `/studio/invoices/abc`. */
  path: string;
  /** Human title used in email subject / QR caption / CSV filename. */
  title: string;
  /**
   * Flat field map serialized to CSV on Export. Omit to hide the Export item
   * (some records have nothing tabular worth exporting from the detail page).
   */
  fields?: Record<string, string | number | null | undefined>;
  /** Compact icon-only trigger (detail-header cluster). Default false. */
  compact?: boolean;
  className?: string;
};

function toAbsolute(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? "" : "/"}${path}`;
}

function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function RecordShare({ path, title, fields, compact = false, className = "" }: RecordShareProps) {
  const t = useT();
  const toast = useToast();
  const [qrOpen, setQrOpen] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [shareUrl, setShareUrl] = React.useState("");

  const copyLink = React.useCallback(async () => {
    const url = toAbsolute(path);
    try {
      await navigator.clipboard.writeText(url);
      toast.success(t("share.copied", undefined, "Link copied"), { description: url });
    } catch {
      // Clipboard blocked (insecure context / permission) — surface the URL
      // so the operator can copy it by hand rather than failing silently.
      toast.error(t("share.copyFailed", undefined, "Couldn't copy. Here's the link"), {
        description: url,
        duration: 10000,
      });
    }
  }, [path, t, toast]);

  const showQr = React.useCallback(async () => {
    const url = toAbsolute(path);
    setShareUrl(url);
    try {
      const dataUrl = await QRCode.toDataURL(url, { margin: 1, width: 320 });
      setQrDataUrl(dataUrl);
      setQrOpen(true);
    } catch {
      toast.error(t("share.qrFailed", undefined, "Couldn't generate QR code"));
    }
  }, [path, t, toast]);

  const email = React.useCallback(() => {
    const url = toAbsolute(path);
    window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`;
  }, [path, title]);

  const sms = React.useCallback(() => {
    const url = toAbsolute(path);
    window.location.href = `sms:?&body=${encodeURIComponent(`${title} ${url}`)}`;
  }, [path, title]);

  const exportCsv = React.useCallback(() => {
    if (!fields) return;
    const keys = Object.keys(fields);
    const header = keys.map(csvCell).join(",");
    const row = keys.map((k) => csvCell(fields[k])).join(",");
    const csv = `${header}\n${row}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${title.replace(/[^\w-]+/g, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
    toast.success(t("share.exported", undefined, "CSV exported"));
  }, [fields, title, t, toast]);

  const print = React.useCallback(() => window.print(), []);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`ps-btn ps-btn--ghost ${compact ? "ps-btn--icon" : "ps-btn--sm"} ${className}`.trim()}
          aria-label={t("share.label", undefined, "Share")}
        >
          <Share2 size={compact ? 16 : 14} aria-hidden="true" />
          {!compact && <span className="ms-1.5">{t("share.label", undefined, "Share")}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={copyLink}>
            <Link2 size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {t("share.copyLink", undefined, "Copy Link")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={showQr}>
            <QrCode size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {t("share.qr", undefined, "Show QR Code")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={email}>
            <Mail size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {t("share.email", undefined, "Email")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={sms}>
            <MessageSquare size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {t("share.text", undefined, "Text Message")}
          </DropdownMenuItem>
          {fields && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={exportCsv}>
                <Download size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
                {t("share.exportCsv", undefined, "Export CSV")}
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onSelect={print}>
            <Printer size={14} className="me-2 text-[var(--p-text-3)]" aria-hidden="true" />
            {t("share.print", undefined, "Print")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>{t("share.qrTitle", undefined, "Scan To Open")}</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt={t("share.qrAlt", { title }, `QR code for ${title}`)}
                className="h-64 w-64 rounded-[var(--p-r-md)] bg-white p-2"
              />
            )}
            <p className="max-w-full truncate font-mono text-xs text-[var(--p-text-3)]">{shareUrl}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
