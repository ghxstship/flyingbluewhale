"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
// Import ModuleHeader from its dedicated zero-i18n module, NOT from
// @/components/Shell — Shell.tsx pulls `getRequestT` (server-only) into
// any importer's module graph, which breaks when error.tsx is rendered
// as a Client Component. Trace: Shell.tsx → i18n/request.ts →
// i18n/server.ts → next/headers. ADR-0007 follow-up.
import { ModuleHeader } from "@/components/ModuleHeader";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    // SC-7 — client render errors only reach Sentry through this explicit
    // capture; the server-side onRequestError hook never sees them.
    Sentry.captureException(error);
    console.error("[console error]", error);
  }, [error]);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.error.eyebrow", undefined, "Error")}
        title={t("console.error.title", undefined, "Something Went Wrong")}
        subtitle={error.digest ? t("console.error.ref", { digest: error.digest }, `Ref: ${error.digest}`) : undefined}
      />
      <div className="page-content">
        <div className="surface p-6">
          <p className="text-sm text-[var(--p-text-2)]">
            {error.message || t("console.error.fallbackMessage", undefined, "An unexpected error occurred.")}
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => reset()}>{t("console.error.tryAgain", undefined, "Try Again")}</Button>
            <Button href="/studio" variant="secondary">
              {t("console.error.backToWorkspace", undefined, "Back to Workspace")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
