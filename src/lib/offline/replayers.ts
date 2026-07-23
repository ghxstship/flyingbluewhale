"use client";

import { saveDailyLog } from "@/app/(mobile)/m/daily-log/actions";
import { fileIncident } from "@/app/(mobile)/m/incidents/actions";
import { quickFileIncident } from "@/app/(mobile)/m/incident/actions";
import { fileLostFound } from "@/app/(mobile)/m/lost-found/actions";
import { submitHandover } from "@/app/(mobile)/m/handover/actions";
import { sendMessage } from "@/app/(mobile)/m/inbox/[roomId]/actions";
import { registerPrefixReplayer, registerReplayer, type ReplayOutcome } from "./drainer";
import { buildReplayFormData, ITEM_ID_KEY, parsePhotoMetas, PHOTOS_KEY, REPLAY_KINDS } from "./replay-codec";
import { dropPhotoBatch, readPhotoBatch } from "./photo-outbox";
import type { QueuedItem } from "./queue";

/**
 * Replayer registry wiring (T1-1) — binds each app-layer queue kind to the
 * SAME server action its surface submits through, so a queued write replays
 * identically whether or not the origin form is still mounted. Imported (for
 * its registration side effect) by the `<OfflineDrainer>` island in the
 * (mobile) layout.
 *
 * Outcome mapping (see drainer.ts): action resolved clean → "ok" (row
 * removed, queued photos dropped); action resolved with `error` → terminal
 * `{ error }` (row parked as failed — the shell banner counts it and offers
 * retry; its photos are KEPT so a retry still has its evidence); action
 * threw → transient (network died again) — rethrow so the drain stops and
 * the next reconnect retries.
 *
 * A resolved `warning` means the record landed but some photo evidence
 * didn't — that is a delivered write (the origin surfaces treat it the same
 * way), so the row clears rather than replaying a duplicate record forever.
 */

type ActionState = { error?: string; warning?: string } | null;
type Action = (prev: null, fd: FormData) => Promise<ActionState>;

/** Standard replay for a form-shaped payload: rebuild FormData (rehydrating
 *  queued photos), call the action, map the outcome. */
function formReplayer(action: Action): (item: QueuedItem) => Promise<ReplayOutcome> {
  return async (item) => {
    const payload = item.payload as Record<string, string>;
    const itemId = payload[ITEM_ID_KEY];
    const metas = parsePhotoMetas(payload[PHOTOS_KEY]);
    const photos = itemId && metas.length ? await readPhotoBatch(itemId, metas) : [];
    const fd = buildReplayFormData(payload, photos, metas);
    const res = await action(null, fd); // throws → transient, propagates
    if (res?.error) return { error: res.error };
    if (itemId) await dropPhotoBatch(itemId);
    return "ok";
  };
}

registerReplayer(REPLAY_KINDS.dailyLog, formReplayer(saveDailyLog));
registerReplayer(REPLAY_KINDS.incident, formReplayer(fileIncident));
registerReplayer(REPLAY_KINDS.incidentQuick, formReplayer(quickFileIncident));
registerReplayer(REPLAY_KINDS.lostFound, formReplayer(fileLostFound));
registerReplayer(REPLAY_KINDS.handover, formReplayer(submitHandover));

// Chat sends queue under "chat:<roomId>" (see ChatRoom) — one prefix
// replayer covers every room, so a message typed in a dead zone lands even
// if that room's thread is never reopened.
registerPrefixReplayer("chat:", async (item) => {
  const p = item.payload as { roomId: string; body: string };
  const fd = new FormData();
  fd.set("roomId", p.roomId);
  fd.set("body", p.body);
  const res = await sendMessage(null, fd);
  return res?.error ? { error: res.error } : "ok";
});
