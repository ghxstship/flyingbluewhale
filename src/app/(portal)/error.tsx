"use client";

import { useEffect } from "react";
import Link from "next/link";
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
      {/* Never surface raw error internals to external portal users —
          the digest below is enough to correlate with Sentry. */}
      <p className="mt-2 text-sm text-[var(--p-text-2)]">
        {t(
          "p.error.description",
          undefined,
          "We hit a problem loading this page. Try again, or reach your production team if it keeps happening.",
        )}
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <button type="button" onClick={reset} className="ps-btn">
          {t("p.error.tryAgain", undefined, "Try Again")}
        </button>
        <Link href="/p" className="ps-btn ps-btn--tertiary">
          {t("p.error.backToPortal", undefined, "Back to Portal")}
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-4 font-mono text-[11px] text-[var(--p-text-3)]">
          {t("p.error.reference", { digest: error.digest }, `Reference: ${error.digest}`)}
        </p>
      ) : null}
    </div>
  );
}
