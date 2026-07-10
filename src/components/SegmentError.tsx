"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
// ModuleHeader from its zero-i18n module (NOT @/components/Shell) — Shell.tsx
// pulls server-only i18n into the module graph, which breaks client error
// boundaries (see src/app/(platform)/error.tsx, ADR-0007 follow-up).
import { ModuleHeader } from "@/components/ModuleHeader";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * Module-segment error boundary body (F-08). Mounted by the thin `error.tsx`
 * files at the console module sub-segments (comms, finance, marketplace,
 * settings, workforce, projects/[projectId], inspections, ai, documents, …)
 * so a throwing widget replaces only its module body — the shell chrome,
 * sidebar, and the rest of the console stay alive.
 *
 * Usage (error.tsx):
 *   "use client";
 *   export { SegmentError as default } from "@/components/SegmentError";
 */
export function SegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    // Client render errors only reach Sentry through explicit capture (SC-7).
    Sentry.captureException(error);
    console.error("[segment error]", error);
  }, [error]);
  return (
    <>
      <ModuleHeader
        eyebrow={t("console.error.eyebrow", undefined, "Error")}
        title={t("console.error.segmentTitle", undefined, "This Section Hit A Snag")}
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
