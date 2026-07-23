"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { KIcon, Sheet } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useT } from "@/lib/i18n/LocaleProvider";
import { toast } from "@/lib/hooks/useToast";
import { requestPermission } from "@/lib/native/permissions";
import { getPosition } from "@/lib/geo/position";
import { geoKeyFor, type PhotoFix } from "@/lib/mobile/photo-geo";
import { JPEG_QUALITY, MAX_EDGE_PX } from "@/lib/mobile/image";
import {
  resolveCapture,
  type CaptureFence,
  type CaptureProject,
  type CaptureResolution,
} from "@/lib/mobile/geofence-file";
import { ATTACH_PARAM, stageCaptureForAttach } from "@/lib/mobile/capture-handoff";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { enqueue, list } from "@/lib/offline/queue";
import { dropPhotos, putPhotos, readPhotos, sweepOrphans, type PhotoMeta } from "@/lib/offline/photo-blobs";
import { fileCapturePhoto, filePhotoNote, reassignCapturePhoto } from "./actions";

/**
 * COMPVSS · Capture — camera-first field photo capture (T1-5, expanded).
 *
 * The CompanyCam mechanic: the shutter is the whole job. Shoot; the app
 * geolocates, matches venue geofences, and opens the DESTINATION SHEET with
 * the geofence result as context:
 *
 *   (a) Daily log — the default. Pre-selected when the geofence resolves to
 *       one project; auto-commits after a short beat unless the crew member
 *       touches anything, with an undo-style Change on the toast. Ambiguous
 *       (2+ projects) → matched-projects picker; no match → all-projects
 *       picker.
 *   (b) Photo note — a standalone geotagged artifact (`field_photo_notes`),
 *       optional note text, project/location auto-filed from the fence.
 *   (c) Attach to… — hands the photo into an existing form flow (incident /
 *       lost & found / snag) via the staged-capture handoff (`?photo=` ref
 *       over the offline photo-blob store).
 *
 * Storage: the existing daily-log photo pipeline + the existing offline
 * photo-blob sidecar/outbox (its own queue channel).
 */

const QUEUE_KIND = "capture";
const PHOTOS_KEY = "__photos";
const ITEM_ID_KEY = "__itemId";
const MODE_KEY = "__mode";

/** Seconds before an unambiguous shot auto-commits to the daily log. */
const AUTO_COMMIT_SECONDS = 3;

type QueuedCapture = Record<string, string>;

type Shot = {
  /** Object URL for the preview/session strip. */
  previewUrl: string;
  file: File;
  fix: PhotoFix | null;
};

type PendingCapture = { shot: Shot; resolution: CaptureResolution };

type FiledEntry = {
  key: string;
  previewUrl: string;
  projectId: string | null;
  title: string;
  kindLabel: string;
  /** Server id when a daily-log filing landed online; enables reassign. */
  photoId: string | null;
  synced: boolean;
};

const ATTACH_TARGETS = [
  { key: "incident", href: "/m/incidents/new", icon: "TriangleAlert" },
  { key: "lostfound", href: "/m/lost-found/new", icon: "Search" },
  { key: "snag", href: "/m/snags/new", icon: "Construction" },
] as const;

function parsePhotoMetas(raw: string | undefined): PhotoMeta[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoMeta[]) : [];
  } catch {
    return [];
  }
}

export function CaptureScreen({
  fences,
  projects,
}: {
  fences: CaptureFence[];
  /** All active org projects — the manual-picker fallback. */
  projects: CaptureProject[];
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // --- Camera -------------------------------------------------------------
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cam, setCam] = useState<"idle" | "requesting" | "live" | "denied">("idle");

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }, []);

  const enableCamera = useCallback(async () => {
    setCam("requesting");
    const res = await requestPermission("camera");
    if (!res.granted) {
      setCam("denied");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setCam("live");
    } catch {
      setCam("denied");
    }
  }, []);

  useEffect(() => stopStream, [stopStream]);

  // --- Offline outbox (same machinery as the daily-log form) --------------
  const { online, pending: queued, syncing } = useOfflineQueue<QueuedCapture>(QUEUE_KIND, async (payload) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (k === PHOTOS_KEY || k === ITEM_ID_KEY || k === MODE_KEY) continue;
      fd.set(k, v);
    }
    const itemId = payload[ITEM_ID_KEY];
    const metas = parsePhotoMetas(payload[PHOTOS_KEY]);
    if (itemId && metas.length) {
      const files = await readPhotos(itemId, metas);
      for (const f of files) fd.append("photo", f);
      fd.set(geoKeyFor("photo"), JSON.stringify(metas.slice(0, files.length).map((m) => m.fix)));
    }
    const res =
      payload[MODE_KEY] === "note" ? await filePhotoNote(null, fd) : await fileCapturePhoto(null, fd);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    if (itemId) await dropPhotos(itemId);
    return true;
  });

  useEffect(() => {
    void sweepOrphans(list(QUEUE_KIND).map((i) => i.id));
  }, []);

  // --- Destination sheet state --------------------------------------------
  const [pendingCap, setPendingCap] = useState<PendingCapture | null>(null);
  const [step, setStep] = useState<"root" | "daily-pick" | "note">("root");
  const [noteText, setNoteText] = useState("");
  /** Auto-commit countdown (seconds left); null = disarmed. */
  const [countdown, setCountdown] = useState<number | null>(null);
  const [reassign, setReassign] = useState<FiledEntry | null>(null);
  const [locating, setLocating] = useState(false);
  const [filed, setFiled] = useState<FiledEntry[]>([]);

  const disarm = useCallback(() => setCountdown(null), []);

  const closeSheet = useCallback(() => {
    setPendingCap(null);
    setStep("root");
    setNoteText("");
    setCountdown(null);
  }, []);

  // --- Filing: daily log --------------------------------------------------
  const fileToDailyLog = useCallback(
    (cap: PendingCapture, project: CaptureProject) => {
      const key = `${QUEUE_KIND}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      closeSheet();
      startTransition(async () => {
        setError(null);
        if (navigator.onLine) {
          try {
            const fd = new FormData();
            fd.set("projectId", project.id);
            fd.append("photo", cap.shot.file);
            fd.set(geoKeyFor("photo"), JSON.stringify([cap.shot.fix]));
            const res = await fileCapturePhoto(null, fd);
            if (res?.error) {
              setError(res.error);
              return;
            }
            const entry: FiledEntry = {
              key,
              previewUrl: cap.shot.previewUrl,
              projectId: project.id,
              title: project.name,
              kindLabel: t("m.capture.kind.dailyLog", undefined, "Daily log"),
              photoId: res?.ok?.photoId ?? null,
              synced: true,
            };
            setFiled((prev) => [entry, ...prev]);
            toast.success(t("m.capture.filedTo", { project: project.name }, `Filed to ${project.name}`), {
              description:
                cap.resolution.kind === "auto"
                  ? t("m.capture.filedVia", { fence: cap.resolution.fence.label }, `Matched by the ${cap.resolution.fence.label} geofence`)
                  : undefined,
              action: entry.photoId
                ? { label: t("m.capture.change", undefined, "Change"), onClick: () => setReassign(entry) }
                : undefined,
            });
            return;
          } catch {
            // Signal died mid-send — fall through to the durable path.
          }
        }
        try {
          const metas = await putPhotos(key, [cap.shot.file], [cap.shot.fix]);
          const payload: QueuedCapture = {
            projectId: project.id,
            [MODE_KEY]: "daily-log",
            [PHOTOS_KEY]: JSON.stringify(metas),
            [ITEM_ID_KEY]: key,
          };
          enqueue({ id: key, kind: QUEUE_KIND, payload, queuedAt: Date.now() });
          setFiled((prev) => [
            {
              key,
              previewUrl: cap.shot.previewUrl,
              projectId: project.id,
              title: project.name,
              kindLabel: t("m.capture.kind.dailyLog", undefined, "Daily log"),
              photoId: null,
              synced: false,
            },
            ...prev,
          ]);
          toast.info(t("m.capture.queuedTo", { project: project.name }, `Queued for ${project.name}. Syncs on reconnect.`));
        } catch {
          setError(
            t("m.capture.photoStoreBlocked", undefined, "You're offline and this device can't store photos. Reconnect and shoot again."),
          );
        }
      });
    },
    [closeSheet, t],
  );

  // --- Filing: standalone photo note --------------------------------------
  const fileAsNote = useCallback(
    (cap: PendingCapture, note: string) => {
      const key = `${QUEUE_KIND}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const auto = cap.resolution.kind === "auto" ? cap.resolution : null;
      const noteTitle = auto?.project.name ?? t("m.capture.kind.noteUnfiled", undefined, "Unfiled");
      closeSheet();
      startTransition(async () => {
        setError(null);
        if (navigator.onLine) {
          try {
            const fd = new FormData();
            if (note.trim()) fd.set("note", note.trim());
            if (auto) {
              fd.set("projectId", auto.project.id);
              fd.set("locationId", auto.locationId);
            }
            fd.append("photo", cap.shot.file);
            fd.set(geoKeyFor("photo"), JSON.stringify([cap.shot.fix]));
            const res = await filePhotoNote(null, fd);
            if (res?.error) {
              setError(res.error);
              return;
            }
            setFiled((prev) => [
              {
                key,
                previewUrl: cap.shot.previewUrl,
                projectId: auto?.project.id ?? null,
                title: noteTitle,
                kindLabel: t("m.capture.kind.note", undefined, "Photo note"),
                photoId: null,
                synced: true,
              },
              ...prev,
            ]);
            toast.success(t("m.capture.noteSaved", undefined, "Photo note saved"), {
              action: {
                label: t("m.capture.viewNotes", undefined, "View"),
                onClick: () => router.push("/m/photos"),
              },
            });
            return;
          } catch {
            // Fall through to the durable path.
          }
        }
        try {
          const metas = await putPhotos(key, [cap.shot.file], [cap.shot.fix]);
          const payload: QueuedCapture = {
            [MODE_KEY]: "note",
            [PHOTOS_KEY]: JSON.stringify(metas),
            [ITEM_ID_KEY]: key,
          };
          if (note.trim()) payload.note = note.trim();
          if (auto) {
            payload.projectId = auto.project.id;
            payload.locationId = auto.locationId;
          }
          enqueue({ id: key, kind: QUEUE_KIND, payload, queuedAt: Date.now() });
          setFiled((prev) => [
            {
              key,
              previewUrl: cap.shot.previewUrl,
              projectId: auto?.project.id ?? null,
              title: noteTitle,
              kindLabel: t("m.capture.kind.note", undefined, "Photo note"),
              photoId: null,
              synced: false,
            },
            ...prev,
          ]);
          toast.info(t("m.capture.noteQueued", undefined, "Photo note queued. Syncs on reconnect."));
        } catch {
          setError(
            t("m.capture.photoStoreBlocked", undefined, "You're offline and this device can't store photos. Reconnect and shoot again."),
          );
        }
      });
    },
    [closeSheet, router, t],
  );

  // --- Filing: attach to an existing form flow -----------------------------
  const attachTo = useCallback(
    (cap: PendingCapture, href: string) => {
      closeSheet();
      startTransition(async () => {
        setError(null);
        try {
          const ref = await stageCaptureForAttach(cap.shot.file, cap.shot.fix);
          router.push(`${href}?${ATTACH_PARAM}=${encodeURIComponent(ref)}`);
        } catch {
          setError(t("m.capture.attachFailed", undefined, "Couldn't hand the photo to that form. It's still on your screen. Try again."));
          setPendingCap(cap);
        }
      });
    },
    [closeSheet, router, t],
  );

  // --- Auto-commit countdown (default destination, unambiguous only) ------
  useEffect(() => {
    if (!pendingCap || countdown == null) return;
    if (countdown <= 0) {
      const auto = pendingCap.resolution.kind === "auto" ? pendingCap.resolution : null;
      if (auto) fileToDailyLog(pendingCap, auto.project);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c == null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, pendingCap, fileToDailyLog]);

  // --- Shutter -------------------------------------------------------------
  const shutter = useCallback(async () => {
    const video = videoRef.current;
    if (!video || cam !== "live" || pending || locating || pendingCap) return;
    setError(null);

    // Frame → JPEG at the field-capture cap (same budget as the upload path).
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const scale = Math.min(1, MAX_EDGE_PX / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) {
      setError(t("m.capture.shotFailed", undefined, "That frame didn't take. Try again."));
      return;
    }
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });

    // Geolocate at shutter (never blocks more than ~4s; null is fine).
    setLocating(true);
    const pos = await getPosition().finally(() => setLocating(false));
    const capturedAt = new Date().toISOString();
    const fix: PhotoFix | null = pos ? { lat: pos.lat, lng: pos.lng, accuracyM: pos.accuracy, capturedAt } : null;
    const shot: Shot = { previewUrl: URL.createObjectURL(blob), file, fix };

    const resolution = resolveCapture(pos ? { lat: pos.lat, lng: pos.lng, accuracyM: pos.accuracy } : null, fences);
    setPendingCap({ shot, resolution });
    setStep("root");
    setNoteText("");
    // Fast path: an unambiguous match auto-commits to the daily log after a
    // beat unless the crew member reaches for another destination.
    setCountdown(resolution.kind === "auto" ? AUTO_COMMIT_SECONDS : null);
  }, [cam, pending, locating, pendingCap, fences, t]);

  const doReassign = useCallback(
    (entry: FiledEntry, project: CaptureProject) => {
      startTransition(async () => {
        setError(null);
        const fd = new FormData();
        fd.set("photoId", entry.photoId ?? "");
        fd.set("projectId", project.id);
        const res = await reassignCapturePhoto(null, fd);
        if (res?.error) {
          setError(res.error);
          return;
        }
        setFiled((prev) => prev.map((f) => (f.key === entry.key ? { ...f, projectId: project.id, title: project.name } : f)));
        setReassign(null);
        toast.success(t("m.capture.movedTo", { project: project.name }, `Moved to ${project.name}`));
      });
    },
    [t],
  );

  // --- Render ---------------------------------------------------------------
  const fenceCount = fences.length;
  const resolution = pendingCap?.resolution ?? null;
  const autoRes = resolution?.kind === "auto" ? resolution : null;

  const attachLabel = (key: (typeof ATTACH_TARGETS)[number]["key"]) =>
    key === "incident"
      ? t("m.capture.attach.incident", undefined, "Incident report")
      : key === "lostfound"
        ? t("m.capture.attach.lostFound", undefined, "Lost & Found")
        : t("m.capture.attach.snag", undefined, "Snag / punch item");

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.capture.back", undefined, "Home")}
      </button>
      <div className="scr-eye">{t("m.capture.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.capture.title", undefined, "Capture")}
      </h1>

      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={syncing}
        labels={{
          offline: t("m.offline.offline", undefined, "You're offline. This log saves to your device and syncs later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />

      {/* Viewfinder. */}
      <div className="scanframe" style={{ position: "relative", overflow: "hidden", aspectRatio: "3 / 4" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: cam === "live" ? "block" : "none",
          }}
        />
        {cam !== "live" && (
          <button
            type="button"
            className="ps-btn ps-btn--cta"
            onClick={() => void enableCamera()}
            disabled={cam === "requesting"}
            style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 2 }}
          >
            <KIcon name="Camera" size={16} />{" "}
            {cam === "denied"
              ? t("m.capture.cameraDenied", undefined, "Camera blocked. Check permissions.")
              : t("m.capture.enableCamera", undefined, "Enable Camera")}
          </button>
        )}
      </div>

      {/* Shutter. */}
      {cam === "live" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          <button
            type="button"
            className="ps-btn ps-btn--cta ps-btn--lg"
            onClick={() => void shutter()}
            disabled={pending || locating || !!pendingCap}
            aria-label={t("m.capture.shutter", undefined, "Take Photo")}
            style={{ minWidth: 180, justifyContent: "center", opacity: pending || locating ? 0.6 : 1 }}
          >
            <KIcon name="Camera" size={18} />{" "}
            {locating
              ? t("m.capture.locating", undefined, "Locating…")
              : pending
                ? t("m.capture.filing", undefined, "Filing…")
                : t("m.capture.shutter", undefined, "Take Photo")}
          </button>
        </div>
      )}

      <div className="hint" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
        <KIcon name={fenceCount ? "MapPin" : "MapPinOff"} size={13} />
        <span>
          {fenceCount
            ? t("m.capture.fencesActive", { n: String(fenceCount) }, `${fenceCount} venue geofences active. Shots file themselves.`)
            : t("m.capture.noFences", undefined, "No venue geofences yet. You'll pick the destination per shot.")}
        </span>
      </div>

      {error && (
        <div className="ps-alert ps-alert--danger" style={{ marginTop: 12 }}>
          {error}
        </div>
      )}

      {/* Session strip — destination chip + change per shot. */}
      {filed.length > 0 && (
        <>
          <div className="sech" style={{ marginTop: 14 }}>
            <h2>{t("m.capture.sessionTitle", undefined, "This Session")}</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filed.map((f) => (
              <div key={f.key} className="item" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, never a remote asset */}
                <img
                  src={f.previewUrl}
                  alt=""
                  width={44}
                  height={44}
                  style={{ borderRadius: 8, objectFit: "cover", width: 44, height: 44 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.title}</div>
                  <div className="hint" style={{ margin: 0 }}>
                    {f.kindLabel}
                    {!f.synced ? ` · ${t("m.capture.pendingSync", undefined, "Waiting to sync")}` : ""}
                  </div>
                </div>
                {f.photoId && (
                  <button type="button" className="ps-btn ps-btn--secondary ps-btn--sm" onClick={() => setReassign(f)} disabled={pending}>
                    {t("m.capture.change", undefined, "Change")}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---- Destination sheet (post-shutter) ---- */}
      {pendingCap && (
        <Sheet
          icon="MapPin"
          title={t("m.capture.destTitle", undefined, "File This Photo")}
          sub={
            autoRes
              ? t("m.capture.destMatched", { fence: autoRes.fence.label }, `Inside the ${autoRes.fence.label} geofence`)
              : resolution?.kind === "ambiguous"
                ? t("m.capture.destAmbiguous", undefined, "Your position sits inside more than one venue geofence")
                : t("m.capture.destNoMatch", undefined, "No geofence matched your position")
          }
          closeLabel={t("m.capture.discard", undefined, "Discard this shot")}
          onClose={closeSheet}
        >
          {/* Any tap inside the sheet disarms the auto-commit (capture-phase
              listener, not an actionable control of its own). */}
          <div onClickCapture={disarm}>
            {step === "root" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {/* (a) Daily log — the default. */}
                {autoRes ? (
                  <button
                    type="button"
                    className="ps-btn ps-btn--cta"
                    style={{ justifyContent: "flex-start" }}
                    disabled={pending}
                    onClick={() => fileToDailyLog(pendingCap, autoRes.project)}
                  >
                    <KIcon name="ClipboardList" size={15} />{" "}
                    {countdown != null
                      ? t(
                          "m.capture.dest.dailyLogAuto",
                          { project: autoRes.project.name, s: String(countdown) },
                          `Daily log · ${autoRes.project.name} (auto in ${countdown}s)`,
                        )
                      : t("m.capture.dest.dailyLogTo", { project: autoRes.project.name }, `Daily log · ${autoRes.project.name}`)}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="ps-btn ps-btn--cta"
                    style={{ justifyContent: "flex-start" }}
                    disabled={pending}
                    onClick={() => setStep("daily-pick")}
                  >
                    <KIcon name="ClipboardList" size={15} /> {t("m.capture.dest.dailyLog", undefined, "Daily log")}
                  </button>
                )}

                {/* (b) Photo note. */}
                <button
                  type="button"
                  className="ps-btn ps-btn--secondary"
                  style={{ justifyContent: "flex-start" }}
                  disabled={pending}
                  onClick={() => setStep("note")}
                >
                  <KIcon name="StickyNote" size={15} /> {t("m.capture.dest.note", undefined, "Photo note")}
                </button>

                {/* (c) Attach to an existing form flow. */}
                <div className="hint" style={{ marginTop: 4 }}>
                  {t("m.capture.dest.attachHint", undefined, "Attach to…")}
                </div>
                {ATTACH_TARGETS.map((target) => (
                  <button
                    key={target.key}
                    type="button"
                    className="ps-btn ps-btn--secondary"
                    style={{ justifyContent: "flex-start" }}
                    disabled={pending}
                    onClick={() => attachTo(pendingCap, target.href)}
                  >
                    <KIcon name={target.icon} size={15} /> {attachLabel(target.key)}
                  </button>
                ))}
              </div>
            )}

            {step === "daily-pick" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p className="form-intro" style={{ margin: "0 0 6px" }}>
                  {resolution?.kind === "ambiguous"
                    ? t("m.capture.pickNearbyHint", undefined, "Pick the right show.")
                    : t("m.capture.pickProjectHint", undefined, "Pick the project this photo belongs to.")}
                </p>
                {(resolution?.kind === "ambiguous" ? resolution.projects : projects).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="ps-btn ps-btn--secondary"
                    style={{ justifyContent: "flex-start" }}
                    disabled={pending}
                    onClick={() => fileToDailyLog(pendingCap, p)}
                  >
                    <KIcon name="FolderOpen" size={15} /> {p.name}
                  </button>
                ))}
                {resolution?.kind !== "ambiguous" && projects.length === 0 && (
                  <p className="hint">{t("m.capture.noProjects", undefined, "No active projects. Ask Ops to add one.")}</p>
                )}
                <button type="button" className="ps-btn ps-btn--tertiary" onClick={() => setStep("root")}>
                  {t("m.capture.backToDest", undefined, "Back")}
                </button>
              </div>
            )}

            {step === "note" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label htmlFor="capture-note" className="hint" style={{ margin: 0 }}>
                  {autoRes
                    ? t("m.capture.noteAutoFiled", { project: autoRes.project.name }, `Files under ${autoRes.project.name}.`)
                    : t("m.capture.noteUnfiledHint", undefined, "Saved to your org's photo notes.")}
                </label>
                <textarea
                  id="capture-note"
                  className="ps-input"
                  rows={3}
                  maxLength={2000}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={t("m.capture.notePh", undefined, "Optional note…")}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="ps-btn ps-btn--tertiary" style={{ flex: 1 }} onClick={() => setStep("root")}>
                    {t("m.capture.backToDest", undefined, "Back")}
                  </button>
                  <button
                    type="button"
                    className="ps-btn ps-btn--cta"
                    style={{ flex: 2, justifyContent: "center" }}
                    disabled={pending}
                    onClick={() => fileAsNote(pendingCap, noteText)}
                  >
                    {t("m.capture.saveNote", undefined, "Save Photo Note")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Sheet>
      )}

      {/* Reassign picker (undo-style Change on a filed daily-log photo). */}
      {reassign && (
        <Sheet
          icon="ArrowLeftRight"
          title={t("m.capture.reassignTitle", undefined, "Move This Photo")}
          closeLabel={t("m.capture.reassignClose", undefined, "Keep current filing")}
          onClose={() => setReassign(null)}
        >
          <p className="form-intro" style={{ margin: "0 0 12px" }}>
            {t("m.capture.reassignHint", { project: reassign.title }, `Currently filed to ${reassign.title}.`)}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {projects
              .filter((p) => p.id !== reassign.projectId)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="ps-btn ps-btn--secondary"
                  style={{ justifyContent: "flex-start" }}
                  disabled={pending}
                  onClick={() => doReassign(reassign, p)}
                >
                  <KIcon name="FolderOpen" size={15} /> {p.name}
                </button>
              ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}
