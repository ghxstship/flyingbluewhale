"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { clockIn, clockOut, submitShiftPulse } from "./actions";

/** Format an elapsed millisecond span as HH:MM:SS. */
function elapsed(fromIso: string | null): string {
  if (!fromIso) return "00:00:00";
  const ms = Math.max(0, Date.now() - new Date(fromIso).getTime());
  const total = Math.floor(ms / 1000);
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const PULSE_LABELS: Record<number, string> = {
  1: "Rough",
  2: "Tough",
  3: "OK",
  4: "Good",
  5: "Great",
};

/**
 * Running time-clock face + Shift Pulse prompt.
 *
 * When the user clocks out, a Shift Pulse card slides in asking for a
 * 1–5 morale rating and optional note (Deputy Shift Pulse+ parity).
 * The card is skippable — pressing "Skip" or navigating away is fine.
 */
export function CheckInControls({
  openSince,
  zoneName,
}: {
  openSince: string | null;
  zoneName: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState("00:00:00");

  // Shift Pulse state — only shown after a successful clock-out this session.
  const [pulseEntryId, setPulseEntryId] = useState<string | null>(null);
  const [pulseRating, setPulseRating] = useState<number | null>(null);
  const [pulseNote, setPulseNote] = useState("");
  const [pulseSent, setPulseSent] = useState(false);

  const clockedIn = openSince != null;

  useEffect(() => {
    if (!openSince) {
      setNow("00:00:00");
      return;
    }
    setNow(elapsed(openSince));
    const id = setInterval(() => setNow(elapsed(openSince)), 1000);
    return () => clearInterval(id);
  }, [openSince]);

  const toggle = () => {
    if (pending) return;
    setError(null);
    start(async () => {
      if (clockedIn) {
        const res = await clockOut();
        if (res?.error) { setError(res.error); return; }
        if (res?.entryId) setPulseEntryId(res.entryId);
      } else {
        const res = await clockIn();
        if (res?.error) { setError(res.error); return; }
        setPulseEntryId(null);
        setPulseRating(null);
        setPulseNote("");
        setPulseSent(false);
      }
      router.refresh();
    });
  };

  const sendPulse = () => {
    if (!pulseEntryId || !pulseRating) return;
    start(async () => {
      await submitShiftPulse(pulseEntryId, pulseRating, pulseNote || undefined);
      setPulseSent(true);
    });
  };

  return (
    <>
      <div className="te-clock">
        <div className="wl" style={{ justifyContent: "center" }}>
          <KIcon name="MapPin" size={12} style={{ color: "var(--p-success)" }} />{" "}
          {zoneName ?? t("m.clock.noZone", undefined, "No Zone Set")}
        </div>
        <div className="tcv">{now}</div>
        {error && (
          <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            type="button"
            className={clockedIn ? "ps-btn ps-btn--danger ps-btn--lg" : "ps-btn ps-btn--cta ps-btn--lg"}
            disabled={pending}
            onClick={toggle}
          >
            {pending
              ? t("m.clock.working", undefined, "Working…")
              : clockedIn
                ? t("m.clock.clockOut", undefined, "Clock Out")
                : t("m.clock.clockIn", undefined, "Clock In")}
          </button>
        </div>
      </div>

      {/* Shift Pulse card — shown after clock-out, dismissed on submit or skip */}
      {pulseEntryId && !pulseSent && (
        <div
          className="surface surface-raised"
          style={{ marginTop: 16, padding: 20, borderRadius: "var(--p-r-xl)" }}
        >
          <div className="scr-eye" style={{ marginBottom: 6 }}>
            {t("m.clock.pulse.eyebrow", undefined, "Shift Pulse")}
          </div>
          <p style={{ marginBottom: 14, fontSize: 14 }}>
            {t("m.clock.pulse.question", undefined, "How was your shift?")}
          </p>

          {/* 1–5 star row */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPulseRating(n)}
                aria-label={PULSE_LABELS[n]}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: "var(--p-r-md)",
                  border: "2px solid",
                  borderColor: pulseRating === n ? "var(--p-accent)" : "var(--p-border)",
                  background: pulseRating === n ? "var(--p-accent-lift)" : "transparent",
                  cursor: "pointer",
                  fontWeight: pulseRating === n ? 700 : 400,
                  fontSize: 18,
                }}
              >
                {n}
              </button>
            ))}
          </div>

          {pulseRating !== null && (
            <div
              style={{
                textAlign: "center",
                fontSize: 12,
                color: "var(--p-text-2)",
                marginBottom: 12,
              }}
            >
              {PULSE_LABELS[pulseRating]}
            </div>
          )}

          <textarea
            placeholder={t("m.clock.pulse.notePlaceholder", undefined, "Any notes? (optional)")}
            rows={2}
            maxLength={500}
            className="ps-input"
            style={{ width: "100%", marginBottom: 12 }}
            value={pulseNote}
            onChange={(e) => setPulseNote(e.target.value)}
          />

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="ps-btn ps-btn--cta"
              style={{ flex: 1 }}
              disabled={pulseRating === null || pending}
              onClick={sendPulse}
            >
              {pending ? t("m.clock.pulse.sending", undefined, "Sending…") : t("m.clock.pulse.submit", undefined, "Submit")}
            </button>
            <button
              type="button"
              className="ps-btn ps-btn--ghost"
              onClick={() => setPulseSent(true)}
            >
              {t("m.clock.pulse.skip", undefined, "Skip")}
            </button>
          </div>
        </div>
      )}

      {pulseSent && pulseEntryId && (
        <div
          className="surface"
          style={{
            marginTop: 12,
            padding: "12px 16px",
            borderRadius: "var(--p-r-md)",
            fontSize: 13,
            color: "var(--p-success-text)",
          }}
        >
          {t("m.clock.pulse.thanks", undefined, "Pulse received. Thanks.")}
        </div>
      )}
    </>
  );
}
