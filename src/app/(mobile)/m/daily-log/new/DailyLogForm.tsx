"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { FolderOpen } from "lucide-react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { EmptyState } from "@/components/ui/EmptyState";
import { KIcon } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { enqueue, list } from "@/lib/offline/queue";
import { getPosition } from "@/lib/geo/position";
import { geoKeyFor, type PhotoFix } from "@/lib/mobile/photo-geo";
import {
  dropPhotos,
  isPersisted,
  PhotoBudgetExceededError,
  putPhotos,
  readPhotos,
  sweepOrphans,
  type PhotoMeta,
} from "@/lib/offline/photo-blobs";
import { saveDailyLog } from "../actions";

export type ProjectOpt = { id: string; name: string };

/** Queue channel. One constant so the sweep, the enqueue and the drain agree. */
const QUEUE_KIND = "daily-log";

/**
 * Sidecar bookkeeping smuggled through the queue's JSON payload.
 *
 * `useOfflineQueue`'s `send` receives only the payload — not the item id — so
 * the id rides inside it. Underscore-prefixed and stripped before the
 * FormData is built, so the server action never sees them as fields.
 */
const PHOTOS_KEY = "__photos";
const ITEM_ID_KEY = "__itemId";

/** A malformed manifest degrades to "no photos" rather than throwing mid-replay
 *  and wedging the whole queue behind one bad row. */
function parsePhotoMetas(raw: string | undefined): PhotoMeta[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PhotoMeta[]) : [];
  } catch {
    return [];
  }
}

/**
 * COMPVSS · New Daily Log — project + date + weather + notes. Submits to the
 * `saveDailyLog` upsert action; an offline submit is queued (kit 21 W8) and
 * replays on reconnect so a log filed with no signal is never lost.
 */
export function DailyLogForm({ projects }: { projects: ProjectOpt[] }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Capture fixes for the currently-picked photos, index-aligned with the
  // file input's FileList.
  const [photoFixes, setPhotoFixes] = useState<(PhotoFix | null)[]>([]);
  const located = photoFixes.filter(Boolean).length;
  const today = new Date().toISOString().slice(0, 10);

  // Offline outbox — the send handler rebuilds FormData from the queued record
  // and calls the same server action, online or on reconnect.
  const {
    online,
    pending: queued,
    syncing,
  } = useOfflineQueue<Record<string, string>>(QUEUE_KIND, async (payload) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (k === PHOTOS_KEY || k === ITEM_ID_KEY) continue; // sidecar bookkeeping, not form fields
      fd.set(k, v);
    }

    // Rehydrate the photos from the IndexedDB sidecar. `send` isn't given the
    // queue item's id, so the payload carries it — that keeps this working
    // without changing the shared queue's contract.
    const itemId = payload[ITEM_ID_KEY];
    const metas = parsePhotoMetas(payload[PHOTOS_KEY]);
    if (itemId && metas.length) {
      const files = await readPhotos(itemId, metas);
      for (const f of files) fd.append("photo", f);
      // Fixes stay index-aligned with the files we actually recovered.
      fd.set(geoKeyFor("photo"), JSON.stringify(metas.slice(0, files.length).map((m) => m.fix)));
    }

    const res = await saveDailyLog(null, fd);
    if (res?.error) {
      setError(res.error);
      return false; // business/validation error — do not queue-retry
    }
    // The row is gone from the queue the moment this returns true, so the
    // bytes must go with it or they're orphaned megabytes nothing references.
    if (itemId) await dropPhotos(itemId);
    return true;
  });

  /**
   * Reclaim bytes whose queue row is gone.
   *
   * The queue lives in localStorage and the photos live in IndexedDB, so the
   * two drift: a cleared store, a tab killed mid-drain, an item removed by a
   * path that knew nothing about photos. Orphaned megabytes are invisible to
   * the user and permanent. Runs once on mount against whatever is actually
   * still queued.
   */
  useEffect(() => {
    void sweepOrphans(list(QUEUE_KIND).map((i) => i.id));
  }, []);

  /**
   * Don't promise durability the browser hasn't granted.
   *
   * If storage isn't persisted, the UA may evict a queued log's photos under
   * pressure — silently, after we've told the crew member it's saved. That's
   * the same overclaim as the phantom photos, so when there IS something
   * waiting and we DON'T have the grant, say so.
   */
  const [evictable, setEvictable] = useState(false);
  useEffect(() => {
    if (queued === 0) {
      setEvictable(false);
      return;
    }
    let alive = true;
    void isPersisted().then((ok) => {
      if (alive) setEvictable(!ok);
    });
    return () => {
      alive = false;
    };
  }, [queued]);

  /**
   * Geotag at pick time, not submit time — the fix has to describe where the
   * photo was taken, and a crew member can walk a long way between shooting
   * a hazard and finishing the notes field.
   *
   * Each change fully replaces the selection (a multi-select input reports
   * its whole FileList), so the fixes replace wholesale too and stay aligned
   * by construction.
   */
  async function onPhotoPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) {
      setPhotoFixes([]);
      return;
    }
    const fix = await getPosition();
    const capturedAt = new Date().toISOString();
    setPhotoFixes(picked.map(() => (fix ? { lat: fix.lat, lng: fix.lng, accuracyM: fix.accuracy, capturedAt } : null)));
  }

  function onSubmit(fd: FormData) {
    if (pending) return;
    setError(null);

    const photos = fd.getAll("photo").filter((f): f is File => f instanceof File && f.size > 0);
    const fixes = photoFixes.slice(0, photos.length);

    const payload: Record<string, string> = {};
    for (const [k, v] of fd.entries()) {
      if (v instanceof File) continue; // bytes travel separately
      if (k === geoKeyFor("photo")) continue; // rebuilt from the fixes below
      payload[k] = String(v);
    }
    const id = `${QUEUE_KIND}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    /** The live send: files straight from memory, nothing persisted. */
    const sendNow = () => {
      const direct = new FormData();
      for (const [k, v] of Object.entries(payload)) direct.set(k, v);
      for (const f of photos) direct.append("photo", f);
      if (photos.length) direct.set(geoKeyFor("photo"), JSON.stringify(fixes));
      return saveDailyLog(null, direct);
    };

    /**
     * The durable path: park the bytes, then enqueue. Only reached when we
     * genuinely cannot deliver now, so IndexedDB is never touched by a
     * connected submit — which keeps megabytes off the flash on every save,
     * and means a device where IDB is blocked (private mode) is refused ONLY
     * when queueing was the only option left.
     */
    const queueForReplay = async (): Promise<boolean> => {
      if (photos.length > 0) {
        try {
          const metas = await putPhotos(id, photos, fixes);
          payload[PHOTOS_KEY] = JSON.stringify(metas);
          payload[ITEM_ID_KEY] = id;
        } catch (err) {
          setError(
            err instanceof PhotoBudgetExceededError
              ? "Too many photos are already waiting to sync. Reconnect to clear them, or remove the photos to save this log now."
              : "You're offline and this device can't store photos. Reconnect to submit, or remove the photos to save the log now.",
          );
          return false;
        }
      }
      enqueue({ id, kind: QUEUE_KIND, payload, queuedAt: Date.now() });
      return true;
    };

    startTransition(async () => {
      // Online: deliver it. The sidecar exists for replay, and a submit that
      // is about to succeed has nothing to replay.
      if (navigator.onLine) {
        try {
          const res = await sendNow();
          if (res?.error) {
            setError(res.error);
            return;
          }
          if (res?.warning) {
            setError(res.warning);
            return;
          }
          router.push("/m/daily-log");
          router.refresh();
          return;
        } catch {
          // Signal died mid-send. We still hold the bytes — fall through and
          // make them durable rather than lose the submit.
        }
      }
      if (await queueForReplay()) router.push("/m/daily-log");
    });
  }

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.dailyLog.back", undefined, "Daily Logs")}
      </button>
      <div className="scr-eye">{t("m.dailyLog.new.eyebrow", undefined, "Site")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.dailyLog.new.title", undefined, "New Daily Log")}
      </h1>

      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={syncing}
        labels={{
          offline: t("m.offline.offline", undefined, "You're offline — this log saves to your device and syncs later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />

      {evictable && (
        <div className="ps-alert ps-alert--warning" style={{ marginBottom: 12 }}>
          {t(
            "m.offline.evictable",
            undefined,
            "Your device hasn't guaranteed this storage. Don't clear your browser data before these sync.",
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={<FolderOpen size={28} aria-hidden="true" />}
          title={t("m.dailyLog.new.noProjects", undefined, "No Projects")}
          description={t("m.dailyLog.new.noProjectsBody", undefined, "Daily logs attach to a project. Ask Ops to add one.")}
        />
      ) : (
        <form action={onSubmit}>
          <div className="fld">
            <label>
              {t("m.dailyLog.new.project", undefined, "Project")}
              <span className="req"> *</span>
            </label>
            <select name="projectId" defaultValue={projects[0]?.id} required>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label>
              {t("m.dailyLog.new.date", undefined, "Date")}
              <span className="req"> *</span>
            </label>
            <input type="date" name="log_date" defaultValue={today} required />
          </div>
          <div className="fld">
            <label>{t("m.dailyLog.new.weather", undefined, "Weather")}</label>
            <input
              type="text"
              name="weather_summary"
              placeholder={t("m.dailyLog.new.weatherPh", undefined, "e.g. Clear · light wind")}
            />
          </div>
          <div className="frow">
            <div className="fld" style={{ width: "100%" }}>
              <label>{t("m.dailyLog.new.high", undefined, "High °F")}</label>
              <input type="number" name="weather_temp_high_f" placeholder="88" />
            </div>
            <div className="fld" style={{ width: "100%" }}>
              <label>{t("m.dailyLog.new.low", undefined, "Low °F")}</label>
              <input type="number" name="weather_temp_low_f" placeholder="74" />
            </div>
          </div>
          <div className="fld">
            <label>{t("m.dailyLog.new.notes", undefined, "Notes")}</label>
            <textarea
              name="notes"
              placeholder={t("m.dailyLog.new.notesPh", undefined, "Headcounts, deliveries, blockers, incidents…")}
            />
          </div>
          <div className="fld">
            <label htmlFor="dl-photo">{t("m.dailyLog.new.photos", undefined, "Site Photos")}</label>
            {/* Native multipart form, so a real file input is all this needs —
                the OS picker brings the camera. A site diary the field can
                write but not photograph is a paragraph, not a record. */}
            <input
              id="dl-photo"
              type="file"
              name="photo"
              accept="image/*"
              multiple
              onChange={onPhotoPick}
              style={{ paddingTop: 11, paddingBottom: 11 }}
            />
            <div className="hint">
              {t("m.dailyLog.new.photosHint", undefined, "Optional. Attach what you saw.")}
            </div>
            {photoFixes.length > 0 && (
              <div
                className="hint"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: located ? "var(--p-success)" : "var(--p-text-3)",
                }}
              >
                <KIcon name={located ? "MapPin" : "MapPinOff"} size={13} />
                <span>
                  {located === photoFixes.length
                    ? t("m.dailyLog.new.geoOn", undefined, "Location attached")
                    : located
                      ? t("m.dailyLog.new.geoPartial", undefined, "Location attached to some photos")
                      : t("m.dailyLog.new.geoOff", undefined, "No location — your device didn't provide one")}
                </span>
              </div>
            )}
          </div>
          {error && (
            <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
              {error}
            </div>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="ps-btn ps-btn--secondary ps-btn--lg"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={() => router.back()}
            >
              {t("m.dailyLog.new.cancel", undefined, "Cancel")}
            </button>
            <button
              type="submit"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
              disabled={pending}
            >
              {pending
                ? t("m.dailyLog.new.saving", undefined, "Saving…")
                : online
                  ? t("m.dailyLog.new.submit", undefined, "Save Log")
                  : t("m.dailyLog.new.submitOffline", undefined, "Save Offline")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
