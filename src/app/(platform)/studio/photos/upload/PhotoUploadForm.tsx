"use client";

import { useState } from "react";
import { Combobox, type ComboboxOption } from "@/components/ui/Combobox";
import { FormShell } from "@/components/FormShell";
import { Input } from "@/components/ui/Input";
import { useT } from "@/lib/i18n/LocaleProvider";
import { uploadPhotosAction } from "./actions";

const MAX_FILES = 20;
const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.heic,.heif,image/*";

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function PhotoUploadForm({ projects }: { projects: ComboboxOption[] }) {
  const t = useT();
  const [projectId, setProjectId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []).slice(0, MAX_FILES);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  const tooBig = files.some((f) => f.size > MAX_BYTES);

  return (
    <FormShell
      action={uploadPhotosAction}
      cancelHref="/studio/photos"
      submitLabel={t("console.photos.upload.submit", undefined, "Upload")}
    >
      {/* Project picker — Combobox is client-only and uses controlled value, so we mirror
          into a hidden input that the FormData picks up. */}
      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.photos.upload.projectLabel", undefined, "Project")}{" "}
          <span className="text-[var(--p-danger)]">*</span>
        </label>
        <div className="mt-1.5">
          <Combobox
            options={projects}
            value={projectId}
            onChange={(v) => setProjectId(v)}
            placeholder={t("console.photos.upload.projectPlaceholder", undefined, "Select a project")}
            searchPlaceholder={t("console.photos.upload.projectSearchPlaceholder", undefined, "Search projects…")}
          />
        </div>
        <input type="hidden" name="projectId" value={projectId} />
      </div>

      <Input
        label={t("console.photos.upload.albumLabel", undefined, "Album")}
        name="album"
        maxLength={80}
        placeholder={t(
          "console.photos.upload.albumPlaceholder",
          undefined,
          'e.g. "Load-in day 1", "Stage build", "Compound"',
        )}
        hint={t("console.photos.upload.albumHint", undefined, "Optional grouping label. Leave blank for unalbumed.")}
      />

      <Input
        label={t("console.photos.upload.captionLabel", undefined, "Caption")}
        name="caption"
        maxLength={280}
        placeholder={t("console.photos.upload.captionPlaceholder", undefined, "Applied to every photo in this batch")}
        hint={t(
          "console.photos.upload.captionHint",
          undefined,
          "Optional — same caption for all photos. Edit individually later.",
        )}
      />

      <div>
        <label className="text-xs font-medium text-[var(--p-text-2)]">
          {t("console.photos.upload.photosLabel", undefined, "Photos")}{" "}
          <span className="text-[var(--p-danger)]">*</span>
        </label>
        <div className="mt-1.5">
          <input
            type="file"
            name="files"
            multiple
            accept={ACCEPT}
            onChange={onPick}
            className="block w-full cursor-pointer text-sm file:me-4 file:cursor-pointer file:border-0 file:bg-[var(--p-text-1)] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[var(--p-bg)] hover:file:opacity-90"
          />
        </div>
        <div className="mt-1 text-[11px] text-[var(--p-text-2)]">
          {t(
            "console.photos.upload.limits",
            { max: MAX_FILES },
            `Up to ${MAX_FILES} photos, 25 MB each. JPEG, PNG, WebP, GIF, HEIC.`,
          )}
        </div>
        {files.length > 0 && (
          <div className="mt-2 text-[11px] text-[var(--p-text-2)]">
            {files.length === 1
              ? t(
                  "console.photos.upload.selectedOne",
                  { total: fmtBytes(totalBytes) },
                  `${files.length} file selected · ${fmtBytes(totalBytes)} total`,
                )
              : t(
                  "console.photos.upload.selectedMany",
                  { count: files.length, total: fmtBytes(totalBytes) },
                  `${files.length} files selected · ${fmtBytes(totalBytes)} total`,
                )}
            {tooBig && (
              <span className="ms-2 font-semibold text-[var(--p-danger)]">
                {t("console.photos.upload.tooBig", undefined, "One or more files exceed 25 MB and will be rejected.")}
              </span>
            )}
          </div>
        )}
      </div>

      {previews.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {previews.map((src, i) => (
            <li key={i} className="surface aspect-square overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={files[i]?.name ?? ""} className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      )}
    </FormShell>
  );
}
