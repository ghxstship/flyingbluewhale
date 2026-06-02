"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, X, Camera, AlertTriangle, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * Incident-report form — used by /console/operations/incidents/new and
 * /m/incidents/new. Supports drag-and-drop photo upload, direct camera
 * capture on mobile, and multi-file attachment.
 *
 * Upload flow: POST /api/v1/incidents/photo-upload → PUT to signed URL →
 * record `path` on `photos[]` → POST /api/v1/incidents with summary +
 * photos.
 */

type Photo = { path: string; caption?: string; localPreview?: string; mediaKind?: "photo" | "video" };

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

  async function handleFiles(files: FileList | File[], forceKind?: "photo" | "video") {
    const ACCEPTED = /\.(jpe?g|png|webp|heic|heif|gif|mp4|mov|webm)$/i;
    const list = Array.from(files).filter((f) => {
      if (forceKind === "video") return f.type.startsWith("video/");
      if (forceKind === "photo") return f.type.startsWith("image/");
      return f.type.startsWith("image/") || f.type.startsWith("video/");
    });
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        const mediaKind: "photo" | "video" = file.type.startsWith("video/") ? "video" : "photo";
        const ext = file.name.match(ACCEPTED)?.[0] ?? (mediaKind === "video" ? ".mp4" : ".jpg");
        const sanitized = `${Date.now()}-evidence${ext}`;
        const res = await fetch("/api/v1/incidents/photo-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ draftId, filename: sanitized, contentType: file.type, mediaKind }),
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
        const localPreview = mediaKind === "photo" ? URL.createObjectURL(file) : undefined;
        setPhotos((prev) => [...prev, { path, localPreview, mediaKind }]);
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
          photos: photos.map((p) => ({ path: p.path, caption: p.caption, mediaKind: p.mediaKind ?? "photo" })),
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
          <label className="block text-xs font-medium text-[var(--text-muted)]">Occurred At</label>
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
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="input-base mt-1 w-full">
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
        <label className="block text-xs font-medium text-[var(--text-muted)]">Evidence (photos &amp; video)</label>
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
              <span>Photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files, "photo")}
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
                onChange={(e) => e.target.files && handleFiles(e.target.files, "photo")}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs hover:bg-[var(--surface-inset)]">
              <Video size={12} />
              <span>Video</span>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files, "video")}
              />
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-[var(--border-color)] px-3 py-1.5 text-xs hover:bg-[var(--surface-inset)]">
              <Video size={12} />
              <span>Record</span>
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files, "video")}
              />
            </label>
            {uploading && <span className="text-xs text-[var(--text-muted)]">Uploading…</span>}
          </div>

          {photos.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {photos.map((p, idx) => (
                <li key={p.path} className="group relative overflow-hidden rounded border border-[var(--border-color)]">
                  {p.mediaKind === "video" ? (
                    <div className="flex aspect-video w-full items-center justify-center bg-[var(--surface-inset)]">
                      <Video size={24} className="text-[var(--text-muted)]" />
                      <span className="ml-1 text-[10px] text-[var(--text-muted)]">Video</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.localPreview}
                      alt="Uploaded incident photo"
                      className="aspect-video w-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    aria-label="Remove evidence"
                    className="absolute top-1 right-1 rounded bg-black/50 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
          Photos: jpg/png/webp/heic · Video: mp4/mov/webm (max ~100 MB). Keep clips under 2 minutes for fast upload.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-[var(--border-color)] pt-4">
        <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <AlertTriangle size={12} className="text-amber-500" />
          In emergencies, call local services first — then log here.
        </div>
        <Button type="submit" variant="danger" disabled={submitting || uploading}>
          {submitting ? "Submitting…" : "Submit report"}
        </Button>
      </div>
    </form>
  );
}
