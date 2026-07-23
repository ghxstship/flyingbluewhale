"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";
import { appendTranscriptToTextarea, DictationButton, KIcon } from "@/components/mobile/kit";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useQueuedAction } from "@/lib/offline/useQueuedAction";
import { REPLAY_KINDS } from "@/lib/offline/replay-codec";
import { quickFileIncident } from "../actions";

/**
 * Express one-field incident quick-file. A single textarea + amber CTA — the
 * fastest path to logging a hazard from the field. Routes back on success.
 * Kit 32 A2: when opened as a follow-up (`followUpOf`), the form names the
 * parent report and the action chains the two records.
 *
 * T1-1 offline-durable: the express intake is exactly what gets used where
 * there is no signal, so an offline submit queues in the app outbox and the
 * app-level drainer replays it on reconnect. No photo affordance here by
 * design — full capture lives at /m/incidents/new.
 */
export function QuickFileForm({ followUpOf }: { followUpOf?: { id: string; summary: string } | null }) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { online, queued, submit } = useQueuedAction({
    kind: REPLAY_KINDS.incidentQuick,
    action: quickFileIncident,
  });

  function onSubmit(fd: FormData) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const res = await submit(fd);
      if (res.status === "error") {
        setError(res.error);
        return;
      }
      // "sent" or "queued" (durable; the drainer replays it on reconnect).
      router.push("/m/incident");
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      <button type="button" className="backbtn" onClick={() => router.back()}>
        <KIcon name="ChevronLeft" size={17} /> {t("m.incident.back", undefined, "My Incidents")}
      </button>
      <div className="scr-eye">{t("m.incident.quick.eyebrow", undefined, "Express")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.incident.quick.title", undefined, "Quick File")}
      </h1>
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
      <p className="form-intro">
        {followUpOf
          ? t(
              "m.incident.quick.followUpIntro",
              { summary: followUpOf.summary },
              `Follow-up to "${followUpOf.summary}". One line, routed to Ops on the same chain.`,
            )
          : t("m.incident.quick.intro", undefined, "One line. We'll route it to Ops and you can add detail later.")}
      </p>

      <form action={onSubmit}>
        {followUpOf && <input type="hidden" name="followUpOf" value={followUpOf.id} />}
        <div className="fld">
          <label htmlFor="qf-summary">
            {t("m.incident.quick.label", undefined, "What Happened")}
            <span className="req"> *</span>
          </label>
          <textarea
            id="qf-summary"
            name="summary"
            required
            autoFocus
            placeholder={t("m.incident.quick.placeholder", undefined, "Describe the incident…")}
          />
          {/* T1-3 dictation — appends the transcript to whatever is typed.
              Renders nothing unless server-side transcription is configured. */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
            <DictationButton onText={(text) => appendTranscriptToTextarea("qf-summary", text)} />
          </div>
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
            {t("m.incident.quick.cancel", undefined, "Cancel")}
          </button>
          <button
            type="submit"
            className="ps-btn ps-btn--cta ps-btn--lg"
            style={{ flex: 2, justifyContent: "center", opacity: pending ? 0.6 : 1 }}
            disabled={pending}
          >
            {pending
              ? t("m.incident.quick.filing", undefined, "Filing…")
              : t("m.incident.quick.submit", undefined, "File Incident")}
          </button>
        </div>
      </form>
    </div>
  );
}
