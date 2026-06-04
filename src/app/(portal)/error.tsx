"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function PortalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[portal error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="text-xs font-semibold tracking-wider text-[var(--color-error)] uppercase">
        {t("p.error.eyebrow", undefined, "Error")}
      </div>
      <h1 className="mt-3 text-2xl font-semibold">{t("p.error.title", undefined, "Something Went Wrong")}</h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{error.message}</p>
      <button type="button" onClick={reset} className="btn btn-primary mt-6">
        {t("p.error.tryAgain", undefined, "Try Again")}
      </button>
    </div>
  );
}
