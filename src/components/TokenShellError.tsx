"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

/**
 * Error boundary body for the token-gated public document trees (F-08):
 * /share/[token], /sign/[token], /msa/[token], /offer/[token],
 * /proposals/[token], /forms/[slug]. These are the surfaces external clients
 * reach from emailed links — no console chrome, no workspace links, just a
 * calm retry. Deliberately no i18n hook: these routes render outside the
 * authed shells and must never crash the crash page.
 *
 * Usage (error.tsx): `"use client"; export { TokenShellError as default } from "@/components/TokenShellError";`
 */
export function TokenShellError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[document error]", error);
  }, [error]);
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-md rounded-lg border border-[var(--p-border)] bg-[var(--p-surface)] p-8 text-center">
        <div className="font-mono text-[11px] tracking-[0.14em] text-[var(--p-text-3)] uppercase">Document error</div>
        <h1 className="mt-2 text-lg font-semibold text-[var(--p-text-1)]">This document could not be displayed</h1>
        <p className="mt-2 text-sm text-[var(--p-text-2)]">
          Something went wrong loading this page. Try again, or re-open the link from your email.
          {error.digest ? ` Ref: ${error.digest}` : ""}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="ps-btn ps-btn--cta mt-5"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
