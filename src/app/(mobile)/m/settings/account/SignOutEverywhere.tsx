"use client";

import { useState, useTransition } from "react";
import { KIcon } from "@/components/mobile/kit";
import { useT } from "@/lib/i18n/LocaleProvider";
import { signOutEverywhere } from "./actions";

/**
 * The kit-29 "sessions" control. Supabase exposes no per-device session
 * list to a client, so the honest control is the global revoke: every
 * device (this one included) is signed out. Confirm-on-tap, no typed
 * confirm word — it is disruptive but fully reversible by logging in.
 */
export function SignOutEverywhere() {
  const t = useT();
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="item tap"
        style={{ cursor: "pointer", width: "100%", textAlign: "left" }}
        disabled={pending}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setError(null);
          start(async () => {
            const res = await signOutEverywhere();
            if (res?.error) setError(res.error);
            // Tokens are revoked server-side; a hard navigation lands on
            // the onboarding gate instead of a half-authed shell.
            else window.location.assign("/m");
          });
        }}
      >
        <KIcon name="MonitorOff" size={18} style={{ color: "var(--p-text-2)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="t">
            {armed
              ? t("m.account.security.signOutAllConfirm", undefined, "Tap again to sign out everywhere")
              : t("m.account.security.signOutAll", undefined, "Sign Out Everywhere")}
          </div>
          <div className="s">
            {t(
              "m.account.security.signOutAllDesc",
              undefined,
              "Ends your session on every device, including this one",
            )}
          </div>
        </div>
        <KIcon name="ChevronRight" size={16} style={{ color: "var(--p-text-3)" }} />
      </button>
      {error && (
        <div className="ps-alert ps-alert--danger" role="alert" style={{ marginTop: 8 }}>
          {error}
        </div>
      )}
    </>
  );
}
