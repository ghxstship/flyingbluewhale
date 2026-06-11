"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    // SC-7 — client render errors only reach Sentry through this explicit
    // capture; the server-side onRequestError hook never sees them.
    Sentry.captureException(error);
    console.error("[portal error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("p.error.eyebrow", undefined, "Error")}
      </div>
      <h1 className="mt-3 text-2xl font-semibold">{t("p.error.title", undefined, "Something Went Wrong")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">{error.message}</p>
      <button type="button" onClick={reset} className="ps-btn mt-6">
        {t("p.error.tryAgain", undefined, "Try Again")}
      </button>
    </div>
  );
}
