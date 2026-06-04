"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function MarketingError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[marketing error]", error);
  }, [error]);
  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      {/* Waypoint brand anchor — keeps the marketing error on-brand. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/atlvs-mark.svg" alt="" width={32} height={32} aria-hidden="true" className="mx-auto mb-6" />
      <p className="eyebrow eyebrow-brand">{t("marketing.pages.error.eyebrow")}</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">{t("marketing.pages.error.title")}</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {error.message || t("marketing.pages.error.fallbackMessage")}
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs">
            {t("marketing.pages.error.refLabel")} {error.digest}
          </span>
        ) : null}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => reset()}>{t("marketing.pages.error.tryAgain")}</Button>
        <Button href="/" variant="secondary">
          {t("marketing.pages.error.home")}
        </Button>
      </div>
    </main>
  );
}
