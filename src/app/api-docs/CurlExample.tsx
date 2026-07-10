"use client";

import * as React from "react";

/**
 * Copyable curl example for one API operation (F-20).
 *
 * Server page derives the command string from the OpenAPI document; this
 * island only owns the clipboard interaction so /api-docs stays
 * force-static.
 */
export function CurlExample({
  command,
  label,
  copyLabel,
  copiedLabel,
}: {
  command: string;
  label: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/http) — leave the text selectable.
    }
  }

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[var(--p-text-2)] uppercase">{label}</h4>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded border border-[var(--p-border)] px-2 py-0.5 text-xs text-[var(--p-text-2)] hover:bg-[var(--p-surface-2)]"
          aria-live="polite"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <pre className="overflow-x-auto rounded bg-[var(--p-surface-2)] p-3 text-xs">{command}</pre>
    </div>
  );
}
