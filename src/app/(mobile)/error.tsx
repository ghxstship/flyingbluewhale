"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function MobileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    // SC-7 — client render errors only reach Sentry through this explicit
    // capture; the server-side onRequestError hook never sees them.
    Sentry.captureException(error);
    console.error("[mobile error]", error);
  }, [error]);
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.error.eyebrow", undefined, "Error")}
      </div>
      <h1 className="mt-2 text-[length:var(--p-fs-h2)]">{t("m.error.title", undefined, "Something Went Wrong")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {error.message || t("m.error.fallbackMessage", undefined, "An unexpected error occurred.")}
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-[var(--p-text-2)]">
          {t("m.error.ref", { digest: error.digest }, `Ref: ${error.digest}`)}
        </p>
      )}
      <button type="button" onClick={reset} className="ps-btn mt-4 w-full">
        {t("m.error.tryAgain", undefined, "Try Again")}
      </button>
      <Link href="/m" className="ps-btn ps-btn--ghost mt-2 w-full">
        {t("m.error.backHome", undefined, "Back To Home")}
      </Link>
    </div>
  );
}
