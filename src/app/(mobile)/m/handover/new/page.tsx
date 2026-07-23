"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { FormScreen, type FormDef } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { toFormData } from "@/lib/mobile/form-data";
import { useQueuedAction } from "@/lib/offline/useQueuedAction";
import { REPLAY_KINDS } from "@/lib/offline/replay-codec";
import { submitHandover } from "../actions";

/**
 * COMPVSS · New Handover — client wrapper over the kit `handover` FormScreen.
 * Serialises kit values → FormData → `submitHandover` action, routes back.
 *
 * T1-1 offline-durable: an end-of-shift handover filed with no signal (a
 * loading dock, a basement post) queues — photos in the shared photo outbox,
 * scalars in the app queue — and the app-level drainer replays it on
 * reconnect whether or not this form is reopened.
 */
export default function NewHandoverPage() {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { online, queued, submit } = useQueuedAction({
    kind: REPLAY_KINDS.handover,
    action: submitHandover,
    photoField: "photo",
  });

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
        // Some photo evidence failed to upload. The handover is submitted —
        // don't navigate away silently as if everything landed.
        setError(res.warning);
        return;
      }
      // "sent" clean, or "queued" (durable; the drainer replays it).
      router.push("/m/handover");
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
          offline: t("m.offline.offline", undefined, "You're offline. This handover saves to your device and syncs later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />
      {error && <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>{error}</div>}
      <FormScreen formId="handover" onClose={() => history.back()} onSubmit={onSubmit} />
    </div>
  );
}
