"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Kit 30 · /m/roster error boundary — covers the whole roster segment
 * (list, assign, contract, onboarding, advance, reporting). Kit alert +
 * retry, per the clickthrough's error state.
 */
export default function RosterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[m/roster error]", error);
  }, [error]);
  return (
    <div className="screen screen-anim">
      <div className="scr-eye">{t("m.roster.eyebrow", undefined, "People")}</div>
      <h1 className="scr-h" style={{ marginBottom: 12 }}>
        {t("m.roster.error.title", undefined, "Couldn't Load")}
      </h1>
      <div className="ps-alert ps-alert--danger" role="alert" style={{ marginBottom: 12 }}>
        {t("m.roster.error.body", undefined, "The roster didn't load. Check your signal and try again.")}
      </div>
      <button type="button" onClick={reset} className="ps-btn ps-btn--cta" style={{ width: "100%", justifyContent: "center" }}>
        {t("m.roster.error.retry", undefined, "Retry")}
      </button>
      <Link
        href="/m"
        className="ps-btn ps-btn--secondary"
        style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
      >
        {t("m.roster.error.home", undefined, "Back To Home")}
      </Link>
    </div>
  );
}
