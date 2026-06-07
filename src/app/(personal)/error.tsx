"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function PersonalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[personal error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        {t("me.error.title", undefined, "Something Went Wrong")}
      </h1>
      <p className="mt-3 text-sm text-[var(--p-text-2)]">
        {error.message || t("me.error.fallbackMessage", undefined, "We hit an error loading your account view.")}
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs">
            {t("me.error.ref", { digest: error.digest }, `Ref: ${error.digest}`)}
          </span>
        ) : null}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => reset()}>{t("common.tryAgain", undefined, "Try Again")}</Button>
        <Button href="/me" variant="secondary">
          {t("me.error.backToYourSpace", undefined, "Back To Your Space")}
        </Button>
      </div>
    </div>
  );
}
