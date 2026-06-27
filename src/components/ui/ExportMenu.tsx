"use client";

import * as React from "react";
import { Download, FileText, FileJson, FileSpreadsheet, Printer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./DropdownMenu";

/**
 * ExportMenu — a dropdown that surfaces export formats and fires `onExport`
 * with the chosen format. Built on the repo's `./DropdownMenu` (Radix) so it
 * inherits the kit's surface/border/highlight tokens and keyboard behavior.
 * No I/O: the caller does the actual serialization/print. Token-only colors;
 * the trigger focus ring reads `--p-focus`.
 */
export type ExportFormat = "csv" | "json" | "pdf" | "print";

export type ExportMenuProps = {
  onExport: (format: ExportFormat) => void;
  /** Which formats to offer, in order. Defaults to all four. */
  formats?: ExportFormat[];
  triggerLabel?: string;
  menuLabel?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

const FORMAT_META: Record<ExportFormat, { label: string; icon: React.ReactNode }> = {
  csv: { label: "CSV", icon: <FileSpreadsheet size={14} aria-hidden="true" /> },
  json: { label: "JSON", icon: <FileJson size={14} aria-hidden="true" /> },
  pdf: { label: "PDF", icon: <FileText size={14} aria-hidden="true" /> },
  print: { label: "Print", icon: <Printer size={14} aria-hidden="true" /> },
};

export function ExportMenu({
  onExport,
  formats = ["csv", "json", "pdf", "print"],
  triggerLabel = "Export",
  menuLabel = "Export as",
  disabled,
  className = "",
  "aria-label": ariaLabel,
}: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={ariaLabel ?? triggerLabel}
          className={`ps-btn ps-btn--ghost ps-btn--sm inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-bg)] focus-visible:outline-none ${className}`}
        >
          <Download size={14} aria-hidden="true" />
          {triggerLabel}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {menuLabel ? (
          <>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        ) : null}
        {formats.map((f) => {
          const meta = FORMAT_META[f];
          return (
            <DropdownMenuItem key={f} onSelect={() => onExport(f)}>
              {meta.icon}
              {meta.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
