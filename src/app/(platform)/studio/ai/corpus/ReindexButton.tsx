"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { reindexCorpus, type State } from "./actions";

import { useActionErrorResolver } from "@/lib/errors-client";
import { useT } from "@/lib/i18n/LocaleProvider";
/**
 * Manual corpus reindex trigger. Walks the org's deliverables / submittals /
 * RFIs and feeds each to the embed-source endpoint server-side. Disabled
 * while the walk runs (it can be slow on large orgs — each document is a
 * round-trip to the embedding provider).
 */
export function ReindexButton() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async () => reindexCorpus(),
    null,
  );
  const resolveErr = useActionErrorResolver();
  const t = useT();

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <Button type="submit" size="sm" loading={pending} disabled={pending}>
          <RefreshCw size={14} aria-hidden />
          {pending
            ? t("console.ai.corpus.reindexing", undefined, "Reindexing…")
            : t("console.ai.corpus.reindex", undefined, "Reindex corpus")}
        </Button>
      </form>
      {state?.ok && (
        <Alert kind="success" title={t("console.ai.corpus.reindexComplete", undefined, "Reindex complete")}>
          {state.indexed === 1
            ? t("console.ai.corpus.embeddedOne", undefined, "1 document embedded")
            : t("console.ai.corpus.embeddedMany", { count: state.indexed ?? 0 }, `${state.indexed} documents embedded`)}
          {typeof state.skipped === "number" && state.skipped > 0
            ? t(
                "console.ai.corpus.skippedSuffix",
                { count: state.skipped },
                `, ${state.skipped} already current or skipped.`,
              )
            : "."}
        </Alert>
      )}
      {state?.error && (
        <Alert kind="error" title={t("console.ai.corpus.reindexFailed", undefined, "Reindex failed")}>
          {resolveErr(state.error)}
        </Alert>
      )}
    </div>
  );
}
