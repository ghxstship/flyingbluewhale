"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";
import { setKioskPin, type State } from "./actions";

/**
 * /m/kiosk/pin — a worker sets their own punch PIN (session-gated via the
 * server action; an unauthenticated visitor is redirected by requireSession
 * on submit, and sees only the form shell before that). Kit form idiom, big
 * numeric inputs, honest weak-PIN refusals.
 */
export default function KioskPinPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState<State, FormData>(setKioskPin, null);

  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.kiosk.eyebrow", undefined, "Kiosk")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.kiosk.pin.title", undefined, "My Punch PIN")}
      </h1>
      <div className="hint" style={{ marginBottom: 16 }}>
        {t(
          "m.kiosk.pin.body",
          undefined,
          "Your PIN clocks you in and out on shared site tablets. 4 to 6 digits, yours only. Don't share it; a punch under your PIN is your time record.",
        )}
      </div>

      {state?.error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="ps-alert ps-alert--ok" role="status" style={{ marginBottom: 12 }}>
          {t("m.kiosk.pin.saved", undefined, "PIN saved. You can punch on any kiosk in your workspace now.")}
        </div>
      )}

      <form action={formAction}>
        <div className="fld">
          <label htmlFor="pin">{t("m.kiosk.pin.pinField", undefined, "New PIN")}</label>
          <input
            id="pin"
            name="pin"
            inputMode="numeric"
            autoComplete="off"
            pattern="\d{4,6}"
            minLength={4}
            maxLength={6}
            required
            type="password"
          />
        </div>
        <div className="fld">
          <label htmlFor="confirm">{t("m.kiosk.pin.confirmField", undefined, "Repeat PIN")}</label>
          <input
            id="confirm"
            name="confirm"
            inputMode="numeric"
            autoComplete="off"
            pattern="\d{4,6}"
            minLength={4}
            maxLength={6}
            required
            type="password"
          />
        </div>
        <button
          type="submit"
          className="ps-btn ps-btn--cta ps-btn--lg"
          style={{ width: "100%", justifyContent: "center", marginTop: 12, minHeight: 48 }}
          disabled={pending}
        >
          {pending ? t("m.kiosk.pin.saving", undefined, "Saving…") : t("m.kiosk.pin.saveCta", undefined, "Save PIN")}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <Link href="/m/kiosk" className="hint">
          {t("m.kiosk.pin.backToKiosk", undefined, "Back to the kiosk")}
        </Link>
      </div>
    </div>
  );
}
