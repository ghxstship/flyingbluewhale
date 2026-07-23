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
import { fileIncident } from "../actions";

/**
 * COMPVSS · File Incident — thin client wrapper around the kit `incident`
 * FormScreen. On submit it serialises the kit values into FormData and calls
 * the `fileIncident` server action, then routes back to the queue.
 *
 * T1-5 capture handoff: arriving with `?photo=<ref>` collects the staged
 * capture from the photo-blob store and pre-attaches it (photo + geotag
 * sibling) via FormScreen `initial`.
 *
 * T1-1 offline-durable: a submit with no signal (or one whose signal dies
 * mid-send) queues — photos in the shared photo outbox, scalars in the app
 * queue — and the app-level drainer replays it on reconnect whether or not
 * this form is ever reopened. An incident is exactly the write that must
 * never depend on coverage.
 */
export default function NewIncidentPage() {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { online, queued, submit } = useQueuedAction({
    kind: REPLAY_KINDS.incident,
    action: fileIncident,
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
        // Uploading some evidence failed. The report is filed — don't
        // navigate away silently as if everything landed.
        setError(res.warning);
        return;
      }
      // "sent" clean, or "queued" (durable; replays on reconnect — the
      // shell SyncBanner carries the pending count).
      router.push("/m/incidents");
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
      {error && <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>{error}</div>}
      {staged !== undefined && (
        <FormScreen
          formId="incident"
          initial={staged ? { photo: [staged.file], [geoKeyFor("photo")]: JSON.stringify([staged.fix]) } : undefined}
          onClose={() => history.back()}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
