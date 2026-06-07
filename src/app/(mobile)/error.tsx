"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function MobileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[mobile error]", error);
  }, [error]);
  return (
    <div className="px-4 pt-6 pb-24">
      <div className="text-xs font-semibold tracking-wider text-[var(--p-danger)] uppercase">
        {t("m.error.eyebrow", undefined, "Error")}
      </div>
      <h1 className="mt-2 text-2xl font-semibold">{t("m.error.title", undefined, "Something Went Wrong")}</h1>
      <p className="mt-2 text-sm text-[var(--p-text-2)]">{error.message}</p>
      <button type="button" onClick={reset} className="ps-btn mt-4 w-full">
        {t("m.error.tryAgain", undefined, "Try Again")}
      </button>
    </div>
  );
}
