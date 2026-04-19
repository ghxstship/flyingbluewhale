"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Camera, AlertTriangle } from "lucide-react";

/**
 * Incident-report form — used by /console/operations/incidents/new and
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
  returnHref = "/console/operations/incidents",
}: {
  projects: Array<{ id: string; name: string }>;
  defaultProjectId?: string;
  returnHref?: string;
}) {
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
          toast.error(json?.error?.message ?? `Upload failed: ${file.name}`);
          continue;
        }
        const { path, uploadUrl } = json.data;
        const put = await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "content-type": file.type },
        });
        if (!put.ok) {
          toast.error(`Upload failed: ${file.name}`);
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
      toast.error("Summary is required");
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
        toast.success("Incident reported");
        router.push(returnHref);
        router.refresh();
      } else {
        toast.error(json?.error?.message ?? "Submit failed");
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
        <label className="block text-xs font-medium text-[var(--text-muted)]">
          Summary <span className="text-[var(--color-error)]">*</span>
        </label>
        <input
          required
          maxLength={200}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. Slip on wet floor backstage"
          className="input-base mt-1 w-full"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Severity</label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value as typeof severity)}
            className="input-base mt-1 w-full"
          >
            <option value="near_miss">Near-miss</option>
            <option value="minor">Minor</option>
            <option value="major">Major</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Occurred at</label>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(e) => setOccurredAt(e.target.value)}
            className="input-base mt-1 w-full"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="input-base mt-1 w-full"
          >
            <option value="">— None —</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)]">Location</label>
          <input
            maxLength={200}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Stage-right monitor world"
            className="input-base mt-1 w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Description</label>
        <textarea
          maxLength={8000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened, what was the response, witnesses…"
          className="input-base mt-1 w-full"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-muted)]">Photos</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
          className="mt-1 rounded-md border-2 border-dashed border-[var(--border-color)] p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs hover:bg-[var(--surface-inset)]">
              <Upload size={12} />
              <span>Choose files</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs hover:bg-[var(--surface-inset)]">
              <Camera size={12} />
              <span>Camera</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            {uploading && <span className="text-xs text-[var(--text-muted)]">Uploading…</span>}
          </div>

          {photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((p, idx) => (
                <li
                  key={p.path}
                  className="group relative overflow-hidden rounded border border-[var(--border-color)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.localPreview}
                    alt="Uploaded incident photo"
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label="Remove photo"
                    className="absolute right-1 top-1 rounded bg-black/50 p-0.5 text-white opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <AlertTriangle size={12} className="text-amber-500" />
          In emergencies, call local services first — then log here.
        </div>
        <button
          type="submit"
          disabled={submitting || uploading}
          className="inline-flex items-center gap-1 rounded bg-[var(--color-error)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </div>
    </form>
  );
}
