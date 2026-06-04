"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function AuthError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error("[auth error]", error);
  }, [error]);
  return (
    <div className="mx-auto max-w-md px-6 py-12 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{t("auth.error.title", undefined, "Sign-in error")}</h1>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">
        {error.message ||
          t(
            "auth.error.fallback",
            undefined,
            "We couldn't complete the request. Try again or contact support if this persists.",
          )}
        {error.digest ? (
          <span className="mt-2 block font-mono text-xs">
            {t("auth.error.ref", { digest: error.digest }, `Ref: ${error.digest}`)}
          </span>
        ) : null}
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => reset()}>{t("common.retry", undefined, "Try again")}</Button>
        <Button href="/login" variant="secondary">
          {t("auth.forgotPassword.backToLogin", undefined, "Back to sign in")}
        </Button>
      </div>
    </div>
  );
}
