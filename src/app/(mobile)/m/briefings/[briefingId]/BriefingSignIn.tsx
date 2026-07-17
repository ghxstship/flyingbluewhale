"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KIcon, QR } from "@/components/mobile/kit";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { OfflineSyncBanner } from "@/components/mobile/OfflineSyncBanner";
import { useOfflineQueue } from "@/lib/offline/useOfflineQueue";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signBriefing, startTalk } from "./actions";

export type AttendeeRow = {
  id: string;
  name: string;
  signed: boolean;
  signedAtLabel: string | null;
  hasSignature: boolean;
};

export type CrewOption = { id: string; name: string };

/** Queue channel — one constant so enqueue and drain agree. */
const QUEUE_KIND = "briefing-signin";

type SignPayload = {
  briefingId: string;
  signature: string;
  typedName: string;
  crewMemberId: string;
  signedAt: string;
};

const STATE_TONE: Record<string, string> = {
  scheduled: "info",
  conducted: "ok",
  cancelled: "neutral",
};

/**
 * COMPVSS · Briefing sign-in (G11). The deliverer starts the talk and shows
 * the QR; each attendee signs on their own device (scan or list) or on the
 * deliverer's ("pass the phone" — pick your roster name, then sign).
 *
 * Signatures queue offline: the payload is all strings (the PNG travels as
 * a data URL, well inside the localStorage queue's budget), so a dead zone
 * at the muster point queues the sign-in and replays it on reconnect —
 * the daily-log idiom, minus the photo sidecar it doesn't need.
 */
export function BriefingSignIn({
  briefingId,
  topic,
  state,
  scheduledLabel,
  conductedLabel,
  projectName,
  brieferName,
  briefingNotes,
  isDeliverer,
  qrValue,
  meSigned,
  attendees,
  crewOptions,
}: {
  briefingId: string;
  topic: string;
  state: string;
  scheduledLabel: string;
  conductedLabel: string | null;
  projectName: string | null;
  brieferName: string | null;
  briefingNotes: string | null;
  isDeliverer: boolean;
  qrValue: string;
  meSigned: boolean;
  attendees: AttendeeRow[];
  crewOptions: CrewOption[];
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  // Sign form state. "" = signing as myself.
  const [who, setWho] = useState<string>(meSigned ? (crewOptions[0]?.id ?? "") : "");
  const [signature, setSignature] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  // Remounts the SignaturePad after a successful pass-the-phone sign so the
  // next person starts with clean ink.
  const [padKey, setPadKey] = useState(0);

  const { online, pending: queued, syncing, submit } = useOfflineQueue<SignPayload>(
    QUEUE_KIND,
    async (payload) => {
      const fd = new FormData();
      fd.set("briefingId", payload.briefingId);
      if (payload.signature) fd.set("signature", payload.signature);
      if (payload.typedName) fd.set("typedName", payload.typedName);
      if (payload.crewMemberId) fd.set("crewMemberId", payload.crewMemberId);
      fd.set("signedAt", payload.signedAt);
      const res = await signBriefing(null, fd);
      if (res?.error) {
        setError(res.error);
        return false; // business/validation error — do not queue-retry
      }
      if (res?.warning) setNotice(res.warning);
      return true;
    },
  );

  const cancelled = state === "cancelled";
  const signedCount = attendees.filter((a) => a.signed).length;
  const selfDone = meSigned && who === "" && crewOptions.length === 0;

  function onSign() {
    if (pending) return;
    setError(null);
    setNotice(null);
    if (!signature && !typedName.trim()) {
      setError(t("m.briefings.sign.needInk", undefined, "Draw your signature or type your full name first."));
      return;
    }
    const payload: SignPayload = {
      briefingId,
      signature: signature ?? "",
      typedName: typedName.trim(),
      crewMemberId: who,
      signedAt: new Date().toISOString(),
    };
    const id = `${QUEUE_KIND}-${briefingId}-${who || "self"}-${Date.now()}`;
    startTransition(async () => {
      const outcome = await submit(id, payload);
      if (outcome === "failed") return; // send() already surfaced the error
      setSignature(null);
      setTypedName("");
      setPadKey((k) => k + 1);
      if (outcome === "queued") {
        setNotice(
          t("m.briefings.sign.queued", undefined, "You're offline. The sign-in is saved on this device and syncs when the signal is back."),
        );
        return;
      }
      router.refresh();
    });
  }

  function onStartTalk() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("briefingId", briefingId);
      const res = await startTalk(null, fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="screen screen-anim">
      <Link href="/m/briefings" className="backbtn">
        <KIcon name="ChevronLeft" size={17} /> {t("m.briefings.back", undefined, "Briefings")}
      </Link>
      <div className="scr-eye">{t("m.briefings.eyebrow", undefined, "Safety")}</div>
      <h1 className="scr-h" style={{ marginBottom: 4 }}>
        {topic}
      </h1>
      <div className="ps-caption" style={{ color: "var(--p-text-2)", marginBottom: 12 }}>
        {scheduledLabel}
        {projectName ? ` · ${projectName}` : ""}
        {brieferName ? ` · ${brieferName}` : ""}
      </div>

      <OfflineSyncBanner
        online={online}
        pending={queued}
        syncing={syncing}
        labels={{
          offline: t("m.offline.offlineBriefing", undefined, "You're offline. Sign-ins save to your device and sync later."),
          queued: t("m.offline.queued", undefined, "{n} waiting to sync"),
          syncing: t("m.offline.syncing", undefined, "Syncing…"),
        }}
      />

      <div className="item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div className="t">
            {state === "conducted"
              ? t("m.briefings.state.conductedAt", { time: conductedLabel ?? "" }, `Conducted ${conductedLabel ?? ""}`)
              : state === "cancelled"
                ? t("m.briefings.state.cancelled", undefined, "Cancelled")
                : t("m.briefings.state.scheduled", undefined, "Scheduled")}
          </div>
          <div className="s">
            {t("m.briefings.signedCount", { n: signedCount, total: attendees.length }, `${signedCount}/${attendees.length} signed in`)}
          </div>
        </div>
        <span className={`ps-badge ps-badge--${STATE_TONE[state] ?? "neutral"}`} style={{ flex: "none" }}>
          {state === "conducted"
            ? t("m.briefings.state.conducted", undefined, "Conducted")
            : state === "cancelled"
              ? t("m.briefings.state.cancelled", undefined, "Cancelled")
              : t("m.briefings.state.scheduled", undefined, "Scheduled")}
        </span>
      </div>

      {briefingNotes && (
        <div className="item" style={{ display: "block" }}>
          <div className="s" style={{ whiteSpace: "pre-wrap" }}>
            {briefingNotes}
          </div>
        </div>
      )}

      {/* ── Deliverer controls ─────────────────────────────────────── */}
      {isDeliverer && !cancelled && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, marginBottom: 12 }}>
          {state === "scheduled" && (
            <button
              type="button"
              className="ps-btn ps-btn--cta ps-btn--lg"
              style={{ width: "100%", justifyContent: "center", opacity: pending ? 0.6 : 1 }}
              disabled={pending || !online}
              onClick={onStartTalk}
            >
              <KIcon name="Megaphone" size={16} /> {t("m.briefings.startTalk", undefined, "Start The Talk")}
            </button>
          )}
          <button
            type="button"
            className="ps-btn ps-btn--secondary ps-btn--lg"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setShowQr((s) => !s)}
          >
            <KIcon name="QrCode" size={16} />{" "}
            {showQr
              ? t("m.briefings.hideQr", undefined, "Hide Sign-In Code")
              : t("m.briefings.showQr", undefined, "Show Sign-In Code")}
          </button>
          {showQr && (
            <div
              className="item"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 16 }}
            >
              {/* Literal white regardless of theme — a scanner needs the quiet
                  zone, so this must NOT follow the surface token in dark mode
                  (same constraint as RoseCard's QR field). */}
              <div style={{ background: "white", padding: 12, borderRadius: 12 }}>
                <QR value={qrValue} size={200} />
              </div>
              <div className="s" style={{ textAlign: "center" }}>
                {t("m.briefings.qrHint", undefined, "Crew scan this with their camera to sign in on their own phone.")}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Sign-in ────────────────────────────────────────────────── */}
      {!cancelled && (
        <div style={{ marginTop: 12 }}>
          <div className="scr-eye" style={{ marginBottom: 8 }}>
            {t("m.briefings.sign.heading", undefined, "Sign In")}
          </div>

          {meSigned && (
            <div className="ps-alert ps-alert--success" role="status" style={{ marginBottom: 12 }}>
              {t("m.briefings.sign.done", undefined, "You're signed in to this briefing.")}
            </div>
          )}

          {selfDone ? null : (
            <>
              <div className="fld">
                <label htmlFor="brief-who">{t("m.briefings.sign.who", undefined, "Who is signing?")}</label>
                <select id="brief-who" value={who} onChange={(e) => setWho(e.target.value)}>
                  <option value="" disabled={meSigned}>
                    {meSigned
                      ? t("m.briefings.sign.meSigned", undefined, "Myself (already signed)")
                      : t("m.briefings.sign.me", undefined, "Myself")}
                  </option>
                  {crewOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {crewOptions.length > 0 && (
                  <div className="hint">
                    {t("m.briefings.sign.passHint", undefined, "Passing the phone? Each person picks their name, signs, and hands it on.")}
                  </div>
                )}
              </div>

              <div className="fld">
                <SignaturePad
                  key={padKey}
                  label={t("m.briefings.sign.pad", undefined, "Signature")}
                  onChange={setSignature}
                  onClear={() => setSignature(null)}
                />
              </div>

              <div className="fld">
                <label htmlFor="brief-typed">{t("m.briefings.sign.typed", undefined, "Or type your full name")}</label>
                <input
                  id="brief-typed"
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder={t("m.briefings.sign.typedPh", undefined, "Full name")}
                  autoComplete="name"
                  maxLength={120}
                />
              </div>

              {error && (
                <div className="ps-alert ps-alert--danger" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              {notice && !error && (
                <div className="ps-alert ps-alert--warning" role="status" style={{ marginBottom: 12 }}>
                  {notice}
                </div>
              )}

              <button
                type="button"
                className="ps-btn ps-btn--cta ps-btn--lg"
                style={{ width: "100%", justifyContent: "center", opacity: pending ? 0.6 : 1 }}
                disabled={pending}
                onClick={onSign}
              >
                {pending
                  ? t("m.briefings.sign.saving", undefined, "Saving…")
                  : online
                    ? t("m.briefings.sign.submit", undefined, "Sign In To This Briefing")
                    : t("m.briefings.sign.submitOffline", undefined, "Sign In Offline")}
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Attendance roll ────────────────────────────────────────── */}
      {attendees.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="scr-eye" style={{ marginBottom: 8 }}>
            {t("m.briefings.roll", undefined, "Attendance")}
          </div>
          {attendees.map((a) => (
            <div key={a.id} className="item" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <KIcon
                name={a.signed ? "CheckCircle2" : "Circle"}
                size={18}
                style={{ color: a.signed ? "var(--p-success)" : "var(--p-text-3)", flex: "none" }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="t">{a.name}</div>
                <div className="s">
                  {a.signed
                    ? `${t("m.briefings.rollSigned", { time: a.signedAtLabel ?? "" }, `Signed ${a.signedAtLabel ?? ""}`)}${a.hasSignature ? "" : ` · ${t("m.briefings.noInk", undefined, "No signature image")}`}`
                    : t("m.briefings.rollWaiting", undefined, "Not signed in")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
