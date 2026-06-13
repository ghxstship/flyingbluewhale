"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Reusable logo uploader for branding editors (org / client / project /
 * proposal). Uploads to the public-read `branding` bucket via the signed-
 * upload route and writes the resulting public URL into a hidden input
 * (`name`) so the surrounding <form> submits it. A URL-paste fallback is
 * retained for already-hosted logos.
 */
export function LogoUploader({
  name,
  scope,
  initialUrl = "",
  label,
}: {
  name: string;
  scope: "org" | "client" | "project" | "proposal";
  initialUrl?: string;
  label?: string;
}) {
  const t = useT();
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    setBusy(true);
    try {
      const res = await fetch("/api/v1/branding/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope, filename: file.name.replace(/[^\w.-]/g, "_"), contentType: file.type }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error ?? "Upload init failed");
      const { uploadUrl, publicUrl } = json.data;
      const put = await fetch(uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!put.ok) throw new Error("Upload failed");
      setUrl(publicUrl);
      toast.success(t("console.branding.uploader.uploaded", undefined, "Logo uploaded"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="block text-xs font-medium text-[var(--p-text-2)]">
        {label ?? t("console.branding.uploader.label", undefined, "Logo")}
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded border border-[var(--p-border)] bg-[var(--p-surface)]">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-[var(--p-text-2)]">{t("console.branding.uploader.none", undefined, "No logo")}</span>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            type="file"
            ref={fileRef}
            accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFile(f);
            }}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="ps-btn ps-btn--sm ps-btn--ghost"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy
                ? t("console.branding.uploader.uploading", undefined, "Uploading…")
                : t("console.branding.uploader.upload", undefined, "Upload logo")}
            </button>
            {url ? (
              <button
                type="button"
                className="text-xs text-[var(--p-text-2)] hover:underline"
                onClick={() => setUrl("")}
              >
                {t("common.remove", undefined, "Remove")}
              </button>
            ) : null}
          </div>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("console.branding.uploader.urlPlaceholder", undefined, "…or paste an HTTPS logo URL")}
            className="ps-input w-full text-xs"
          />
        </div>
      </div>
      <input type="hidden" name={name} value={url} />
    </div>
  );
}
