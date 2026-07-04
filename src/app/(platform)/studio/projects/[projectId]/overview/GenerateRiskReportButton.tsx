"use client";

import { useActionState } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { generateRiskReport, type State } from "./actions";

/**
 * Generate/refresh trigger for the project AI risk report. The generation is
 * a full model round-trip (a few seconds) — keep the button disabled while
 * pending so a double-click can't burn two calls.
 */
export function GenerateRiskReportButton({ projectId, hasReport }: { projectId: string; hasReport: boolean }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    generateRiskReport.bind(null, projectId),
    null,
  );

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={pending}>
          <ShieldAlert size={14} aria-hidden />
          {pending ? "Assessing…" : hasReport ? "Refresh assessment" : "Generate risk report"}
        </Button>
      </form>
      {state?.error && (
        <Alert kind="error" title="Risk assessment failed">
          {state.error}
        </Alert>
      )}
    </div>
  );
}
