"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[root error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      {/* Waypoint brand anchor — even the runtime error boundary
          stays on-brand instead of reading as a generic crash page. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/atlvs-mark.svg" alt="" width={32} height={32} aria-hidden="true" className="mx-auto mb-6" />
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">
        {t("rootError.eyebrow", undefined, "Error")}
      </div>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        {t("rootError.title", undefined, "Something went wrong")}
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {error.message || t("rootError.fallback", undefined, "An unexpected error occurred.")}
        {error.digest && (
          <span className="ms-2 font-mono text-xs">
            {t("rootError.ref", { digest: error.digest }, `ref: ${error.digest}`)}
          </span>
        )}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={reset} className="btn btn-primary">
          {t("common.retry", undefined, "Try again")}
        </button>
        <Link href="/" className="btn btn-secondary">
          {t("nav.home", undefined, "Home")}
        </Link>
      </div>
    </div>
  );
}
