"use client";

import * as React from "react";
import { UploadCloud, X, File as FileIcon, AlertCircle } from "lucide-react";

/**
 * UploadZone — a drag-and-drop dropzone with click-to-browse fallback. Tracks
 * a drag-over state, validates against `accept` / `maxSizeMb`, lists the
 * selected files with per-file remove, and surfaces the current set via
 * `onFiles`. NO upload / network: this only collects File objects for the
 * caller. Token-only colors; the zone is keyboard-operable with a `--p-focus`
 * ring and ARIA messaging for rejects.
 */
export type UploadRejection = { file: File; reason: "type" | "size" };

export type UploadZoneProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMb?: number;
  /** Called when files are filtered out by `accept` / `maxSizeMb`. */
  onReject?: (rejections: UploadRejection[]) => void;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (!tokens.length) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((tok) => {
    if (tok.startsWith(".")) return name.endsWith(tok);
    if (tok.endsWith("/*")) return type.startsWith(tok.slice(0, -1));
    return type === tok;
  });
}

export function UploadZone({
  onFiles,
  accept,
  multiple = false,
  maxSizeMb,
  onReject,
  disabled,
  label = "Drag files here or click to browse",
  hint,
  className = "",
}: UploadZoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [files, setFiles] = React.useState<File[]>([]);
  const [rejectMsg, setRejectMsg] = React.useState<string | null>(null);

  const maxBytes = maxSizeMb != null ? maxSizeMb * 1024 * 1024 : undefined;

  const commit = (next: File[]) => {
    setFiles(next);
    onFiles(next);
  };

  const ingest = (incoming: FileList | File[]) => {
    if (disabled) return;
    const list = Array.from(incoming);
    const accepted: File[] = [];
    const rejected: UploadRejection[] = [];
    for (const f of list) {
      if (!matchesAccept(f, accept)) rejected.push({ file: f, reason: "type" });
      else if (maxBytes != null && f.size > maxBytes) rejected.push({ file: f, reason: "size" });
      else accepted.push(f);
    }

    if (rejected.length) {
      onReject?.(rejected);
      setRejectMsg(
        `${rejected.length} file${rejected.length === 1 ? "" : "s"} skipped (wrong type or too large).`,
      );
    } else {
      setRejectMsg(null);
    }

    if (!accepted.length) return;
    commit(multiple ? [...files, ...accepted] : accepted.slice(0, 1));
  };

  const removeAt = (i: number) => {
    commit(files.filter((_, idx) => idx !== i));
  };

  const openBrowse = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || undefined}
        aria-label={label}
        onClick={openBrowse}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openBrowse();
          }
        }}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer?.files?.length) ingest(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-bg)] focus-visible:outline-none ${
          disabled
            ? "cursor-not-allowed border-[var(--p-border)] bg-[var(--p-surface-2)] opacity-60"
            : dragOver
              ? "cursor-pointer border-[var(--p-accent)] bg-[var(--p-surface-2)]"
              : "cursor-pointer border-[var(--p-border)] bg-[var(--p-surface)] hover:bg-[var(--p-surface-2)]"
        }`}
      >
        <UploadCloud size={24} className="text-[var(--p-text-2)]" aria-hidden="true" />
        <span className="text-sm font-medium text-[var(--p-text-1)]">{label}</span>
        {hint ? <span className="text-xs text-[var(--p-text-2)]">{hint}</span> : null}
        {maxSizeMb != null ? (
          <span className="text-xs text-[var(--p-text-2)]">Max {maxSizeMb} MB per file</span>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) ingest(e.target.files);
          e.target.value = "";
        }}
      />

      {rejectMsg ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--p-danger)]" role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {rejectMsg}
        </p>
      ) : null}

      {files.length > 0 && (
        <ul className="mt-3 space-y-1.5" aria-label="Selected files">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-[var(--p-border)] bg-[var(--p-surface)] px-3 py-2"
            >
              <FileIcon size={15} className="shrink-0 text-[var(--p-text-2)]" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--p-text-1)]">{f.name}</span>
              <span className="shrink-0 text-xs text-[var(--p-text-2)]">{formatBytes(f.size)}</span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${f.name}`}
                className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--p-text-2)] transition-colors hover:bg-[var(--p-surface-2)] hover:text-[var(--p-text-1)] focus-visible:ring-2 focus-visible:ring-[var(--p-focus)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--p-surface)] focus-visible:outline-none"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
