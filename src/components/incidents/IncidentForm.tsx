"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Incident-report form — used by /studio/operations/incidents/new and
 * /m/incidents/new. Supports drag-and-drop photo upload, direct camera
 * capture on mobile, and multi-file attachment.
 *
 * Upload flow: POST /api/v1/incidents/photo-upload → PUT to signed URL →
 * record `path` on `photos[]` → POST /api/v1/incidents with summary +
 * photos.
 */

type Photo = { path: string; caption?: string; localPreview?: string };

export function IncidentForm({
  projects,
  defaultProjectId,
  returnHref = "/studio/operations/incidents",
}: {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  returnHref?: string;
}) {
  const t = useT();
  const router = useRouter();
  const draftId = React.useMemo(() => crypto.randomUUID(), []);
  const [summary, setSummary] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [severity, setSeverity] = React.useState<"near_miss" | "minor" | "major" | "critical">("minor");
  const [location, setLocation] = React.useState("");
  const [occurredAt, setOccurredAt] = React.useState(() => new Date().toISOString().slice(0, 16));
  const [projectId, setProjectId] = React.useState(defaultProjectId ?? "");
  const [photos, setPhotos] = React.useState<Photo[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        const filename = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
        const res = await fetch("/api/v1/incidents/photo-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftId, filename, contentType: file.type }),
        });
        const json = await res.json();
        if (!json?.ok) {
          toast.error(
            json?.error?.message ??
              t("components.incidentForm.uploadFailed", { name: file.name }, "Upload failed: {name}"),
          );
          continue;
        }
        const { path, uploadUrl } = json.data;
        const put = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "content-type": file.type },
        });
        if (!put.ok) {
          toast.error(t("components.incidentForm.uploadFailed", { name: file.name }, "Upload failed: {name}"));
          continue;
        }
        setPhotos((prev) => [...prev, { path, localPreview: URL.createObjectURL(file) }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error(t("components.incidentForm.summaryRequired", undefined, "Summary is required"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId: projectId || undefined,
          summary,
          description: description || undefined,
          severity,
          location: location || undefined,
          occurredAt: new Date(occurredAt).toISOString(),
          photos: photos.map((p) => ({ path: p.path, caption: p.caption })),
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast.success(t("components.incidentForm.reported", undefined, "Incident reported"));
        router.push(returnHref);
        router.refresh();
      } else {
        toast.error(json?.error?.message ?? t("components.incidentForm.submitFailed", undefined, "Submit failed"));
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-[var(--p-text-2)]">
          {t("components.incidentForm.summaryLabel", undefined, "Summary")}{" "}
          <span className="text-[var(--p-danger)]">*</span>
        </label>
        <input
          required
          maxLength={200}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder={t("components.incidentForm.summaryPlaceholder", undefined, "e.g. Slip on wet floor backstage")}
          className="ps-input mt-1 w-full"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--p-text-2)]">
            {t("components.incidentForm.severityLabel", undefined, "Severity")}
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
            className="ps-input mt-1 w-full"
          >
            <option value="near_miss">{t("components.incidentForm.severity.nearMiss", undefined, "Near-miss")}</option>
            <option value="minor">{t("components.incidentForm.severity.minor", undefined, "Minor")}</option>
            <option value="major">{t("components.incidentForm.severity.major", undefined, "Major")}</option>
            <option value="critical">{t("components.incidentForm.severity.critical", undefined, "Critical")}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--p-text-2)]">
            {t("components.incidentForm.occurredAtLabel", undefined, "Occurred At")}
          </label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="ps-input mt-1 w-full"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--p-text-2)]">
            {t("components.incidentForm.projectLabel", undefined, "Project")}
          </label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="ps-input mt-1 w-full">
            <option value="">{t("components.incidentForm.projectNone", undefined, "— None —")}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--p-text-2)]">
            {t("components.incidentForm.locationLabel", undefined, "Location")}
          </label>
          <input
            maxLength={200}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder={t("components.incidentForm.locationPlaceholder", undefined, "e.g. Stage-right monitor world")}
            className="ps-input mt-1 w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--p-text-2)]">
          {t("components.incidentForm.descriptionLabel", undefined, "Description")}
        </label>
        <textarea
          maxLength={8000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t(
            "components.incidentForm.descriptionPlaceholder",
            undefined,
            "What happened, what was the response, witnesses…",
          )}
          className="ps-input mt-1 w-full"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--p-text-2)]">
          {t("components.incidentForm.photosLabel", undefined, "Photos")}
        </label>
        {/* Drag-drop is a pointer-only enhancement — the file-input label
            inside this zone is the keyboard/screen-reader path. */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
          className="mt-1 rounded-md border-2 border-dashed border-[var(--p-border)] p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--p-border)] px-3 py-1.5 text-xs hover:bg-[var(--p-surface-2)]">
              <Upload size={12} />
              <span>{t("components.incidentForm.chooseFiles", undefined, "Choose files")}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--p-border)] px-3 py-1.5 text-xs hover:bg-[var(--p-surface-2)]">
              <Camera size={12} />
              <span>{t("components.incidentForm.camera", undefined, "Camera")}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            {uploading && (
              <span className="text-xs text-[var(--p-text-2)]">
                {t("components.incidentForm.uploading", undefined, "Uploading…")}
              </span>
            )}
          </div>

          {photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((p, idx) => (
                <li key={p.path} className="group relative overflow-hidden rounded border border-[var(--p-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.localPreview}
                    alt={t("components.incidentForm.photoAlt", undefined, "Uploaded incident photo")}
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label={t("components.incidentForm.removePhoto", undefined, "Remove photo")}
                    className="absolute end-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--p-border)] pt-4">
        <div className="flex items-center gap-1 text-[11px] text-[var(--p-text-2)]">
          <AlertTriangle size={12} className="text-[var(--p-warning)]" />
          {t(
            "components.incidentForm.emergencyNotice",
            undefined,
            "In emergencies, call local services first — then log here.",
          )}
        </div>
        <Button type="submit" variant="danger" disabled={submitting || uploading}>
          {submitting
            ? t("components.incidentForm.submitting", undefined, "Submitting…")
            : t("components.incidentForm.submit", undefined, "Submit report")}
        </Button>
      </div>
    </form>
  );
}
