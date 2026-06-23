"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";
import { uploadAndExtract, type UploadState } from "./actions";

const INPUT = "w-full rounded-md border border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-2 text-sm";

export function UploadInvoiceClient() {
  const t = useT();
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
          {pending
            ? t("console.finance.apOcr.upload.extracting", undefined, "Extracting…")
            : t("console.finance.apOcr.upload.submit", undefined, "Upload + Extract")}
        </Button>
      </div>
      {fileName && (
        <p className="text-[10px] text-[var(--p-text-2)]">
          {t("console.finance.apOcr.upload.selectedLabel", undefined, "Selected:")}{" "}
          <span className="font-mono">{fileName}</span> · {(fileSize / 1024).toFixed(1)}{" "}
          {t("console.finance.apOcr.upload.kb", undefined, "KB")}
        </p>
      )}
      {state?.error && <p className="text-xs text-[var(--p-danger)]">{state.error}</p>}
      {state?.success && (
        <p className="text-xs text-[var(--p-success)]">
          {t(
            "console.finance.apOcr.upload.extractedConfidence",
            { pct: (state.success.confidence * 100).toFixed(0) },
            "Extracted. Confidence: {pct}%.",
          )}{" "}
          {state.success.vendor_name && (
            <span className="text-[var(--p-text-2)]">
              {t(
                "console.finance.apOcr.upload.vendorLabel",
                { vendor: state.success.vendor_name },
                "Vendor: {vendor}.",
              )}
            </span>
          )}
        </p>
      )}
    </form>
  );
}
