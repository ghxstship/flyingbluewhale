"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { uploadAndExtract, type UploadState } from "./actions";

const INPUT = "w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm";

export function UploadInvoiceClient() {
  const [state, formAction, pending] = useActionState<UploadState, FormData>(uploadAndExtract, null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [fileSize, setFileSize] = useState<number>(0);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFileSize(f.size);
    const buf = await f.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // Base64-encode in chunks to avoid call-stack overflow on large files.
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
    }
    setFileBase64(btoa(s));
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="file_name" value={fileName} />
      <input type="hidden" name="file_base64" value={fileBase64} />
      <input type="hidden" name="size_bytes" value={String(fileSize)} />
      <div className="flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={onFile} className={`${INPUT} text-xs`} />
        <Button type="submit" size="sm" disabled={!fileBase64 || pending}>
          {pending ? "Extracting…" : "Upload + Extract"}
        </Button>
      </div>
      {fileName && (
        <p className="text-[10px] text-[var(--text-muted)]">
          Selected: <span className="font-mono">{fileName}</span> · {(fileSize / 1024).toFixed(1)} KB
        </p>
      )}
      {state?.error && <p className="text-xs text-[var(--color-error)]">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-[var(--color-success)]">
          Extracted. Confidence: {(state.success.confidence * 100).toFixed(0)}%.{" "}
          {state.success.vendor_name && (
            <span className="text-[var(--text-secondary)]">Vendor: {state.success.vendor_name}.</span>
          )}
        </p>
      )}
    </form>
  );
}
