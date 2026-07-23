"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { toFormData } from "@/lib/mobile/form-data";
import { ATTACH_PARAM, takeStagedCapture, type StagedCapture } from "@/lib/mobile/capture-handoff";
import { geoKeyFor } from "@/lib/mobile/photo-geo";
import { useQueuedAction } from "@/lib/offline/useQueuedAction";
import { REPLAY_KINDS } from "@/lib/offline/replay-codec";
import { fileLostFound } from "../actions";

/**
 * COMPVSS · Lost & Found — thin client wrapper around the kit `lostfound`
 * FormScreen. The form spec had existed since the kit rebuild but was
 * mounted nowhere, so the only way to report property from the field was
 * the safety incident intake — which is what put every dropped backpack in
 * the safety queue and every injury in Lost & Found.
 *
 * T1-5 capture handoff: `?photo=<ref>` pre-attaches a staged capture
 * (photo + geotag sibling) via FormScreen `initial`.
 *
 * T1-1 offline-durable: an offline submit queues (photos in the shared
 * photo outbox, scalars in the app queue) and the app-level drainer replays
 * it on reconnect regardless of which surface is mounted.
 */
export default function LostFoundPage() {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { online, queued, submit } = useQueuedAction({
    kind: REPLAY_KINDS.lostFound,
    action: fileLostFound,
    photoField: "photo",
  });
  // undefined = still resolving the handoff; null = none staged.
  const [staged, setStaged] = useState<StagedCapture | null | undefined>(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).has(ATTACH_PARAM) ? undefined : null,
  );

  useEffect(() => {
    if (staged !== undefined) return;
    const ref = new URLSearchParams(window.location.search).get(ATTACH_PARAM);
    void takeStagedCapture(ref).then((s) => setStaged(s));
  }, [staged]);

  function onSubmit(_def: FormDef, vals: Record<string, unknown>) {
    if (pending) return;
    const fd = toFormData(vals);
    startTransition(async () => {
      const res = await submit(fd);
      if (res.status === "error") {
        setError(res.error);
        return;
      }
      if (res.status === "sent" && res.warning) {
        // Some photo evidence failed to upload. The report is filed — don't
        // navigate away silently as if everything landed.
        setError(res.warning);
        return;
      }
      // "sent" clean, or "queued" (durable; the drainer replays it).
      router.push("/m/lost-found");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={false}
        labels={{
          offline: t("m.offline.offline", undefined, "You're offline. This report saves to your device and syncs later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />
      {error && (
        <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      {staged !== undefined && (
        <FormScreen
          formId="lostfound"
          initial={staged ? { photo: [staged.file], [geoKeyFor("photo")]: JSON.stringify([staged.fix]) } : undefined}
          onClose={() => history.back()}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
